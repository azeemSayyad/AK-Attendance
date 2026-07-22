"use server";

import { getDataSource } from "@/lib/typeorm/data-source";
import { Tenant } from "@/lib/typeorm/entities/Tenant";
import { getRole, isPinTaken, generateGlobalUniquePin } from "./auth";
import { revalidatePath } from "next/cache";
import type { TenantRow } from "@/lib/types";

// Tables owned by a tenant — used for size accounting and hard-delete.
const TENANT_TABLES = [
    "employees",
    "clients",
    "attendance",
    "advances",
    "work_assignments",
    "money_taken",
    "monthly_advances",
    "project_expenses",
    "common_expenses",
];

async function requireSuperadmin() {
    const role = await getRole();
    if (role !== "superadmin") {
        throw new Error("Unauthorized");
    }
}

function humanSize(bytes: number): string {
    if (!bytes || bytes < 1024) return `${bytes || 0} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
}

/** List every tenant with live user counts and on-disk data usage. */
export async function listTenants(): Promise<TenantRow[]> {
    await requireSuperadmin();
    const ds = await getDataSource();

    const byteExprs = TENANT_TABLES.map(
        (tbl) => `COALESCE((SELECT SUM(pg_column_size(x.*)) FROM ${tbl} x WHERE x.tenant_id = t.id), 0)`
    ).join(" + ");

    const rows = await ds.query(`
        SELECT
            t.id,
            t.name,
            t.admin_pin      AS "adminPin",
            t.status,
            t.created_at     AS "createdAt",
            COALESCE((SELECT COUNT(*) FROM employees e WHERE e.tenant_id = t.id AND e.status = 'active'), 0) AS "employeeCount",
            COALESCE((SELECT COUNT(*) FROM clients c WHERE c.tenant_id = t.id), 0) AS "clientCount",
            (${byteExprs}) AS bytes
        FROM tenants t
        ORDER BY t.created_at ASC
    `);

    return rows.map((r: any) => {
        const bytes = Number(r.bytes) || 0;
        return {
            id: Number(r.id),
            name: r.name,
            adminPin: r.adminPin,
            status: r.status,
            createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : "",
            employeeCount: Number(r.employeeCount) || 0,
            clientCount: Number(r.clientCount) || 0,
            bytes,
            sizeLabel: humanSize(bytes),
        };
    });
}

/** Suggest a fresh, globally-unique 4-digit PIN for the onboarding form. */
export async function suggestPin(): Promise<string> {
    await requireSuperadmin();
    return generateGlobalUniquePin();
}

/** Onboard a new customer (tenant) with their owner login PIN. */
export async function onboardTenant(name: string, adminPin: string) {
    await requireSuperadmin();

    const cleanName = (name || "").trim();
    if (cleanName.length < 2 || cleanName.length > 40) {
        throw new Error("Business name must be 2–40 characters");
    }
    if (!/^\d{4}$/.test(adminPin)) {
        throw new Error("PIN must be exactly 4 digits");
    }
    if (await isPinTaken(adminPin)) {
        throw new Error("That PIN is already in use — pick another");
    }

    const ds = await getDataSource();
    const repo = ds.getRepository(Tenant);
    const tenant = repo.create({ name: cleanName, adminPin, status: "active" });
    await repo.save(tenant);

    revalidatePath("/admin");
    return { success: true, id: tenant.id };
}

export async function setTenantStatus(id: number, status: "active" | "suspended") {
    await requireSuperadmin();
    if (status !== "active" && status !== "suspended") {
        throw new Error("Invalid status");
    }
    const ds = await getDataSource();
    await ds.getRepository(Tenant).update(id, { status });
    revalidatePath("/admin");
    return { success: true };
}

export async function changeTenantPin(id: number, newPin: string) {
    await requireSuperadmin();
    if (!/^\d{4}$/.test(newPin)) {
        throw new Error("PIN must be exactly 4 digits");
    }
    if (await isPinTaken(newPin, { excludeTenantId: id })) {
        throw new Error("That PIN is already in use");
    }
    const ds = await getDataSource();
    await ds.getRepository(Tenant).update(id, { adminPin: newPin });
    revalidatePath("/admin");
    return { success: true };
}

export async function renameTenant(id: number, name: string) {
    await requireSuperadmin();
    const cleanName = (name || "").trim();
    if (cleanName.length < 2 || cleanName.length > 40) {
        throw new Error("Business name must be 2–40 characters");
    }
    const ds = await getDataSource();
    await ds.getRepository(Tenant).update(id, { name: cleanName });
    revalidatePath("/admin");
    return { success: true };
}

/** Permanently delete a tenant and ALL of its data. Irreversible. */
export async function deleteTenant(id: number) {
    await requireSuperadmin();
    const ds = await getDataSource();

    await ds.transaction(async (manager) => {
        for (const table of TENANT_TABLES) {
            await manager.query(`DELETE FROM ${table} WHERE tenant_id = $1`, [id]);
        }
        await manager.query(`DELETE FROM tenants WHERE id = $1`, [id]);
    });

    revalidatePath("/admin");
    return { success: true };
}
