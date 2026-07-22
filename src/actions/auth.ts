"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getDataSource } from "@/lib/typeorm/data-source";
import { Employee } from "@/lib/typeorm/entities/Employee";
import { SystemSettings } from "@/lib/typeorm/entities/SystemSettings";
import { Tenant } from "@/lib/typeorm/entities/Tenant";
import { Not } from "typeorm";

const COOKIE_OPTS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: "/",
};

/**
 * Single 4-digit-PIN login for the whole app. The PIN itself decides the role
 * and tenant:
 *   - super-admin PIN  -> /admin portal (no tenant)
 *   - a tenant's admin PIN -> that tenant's dashboard as "admin"
 *   - an employee PIN  -> that employee's own view as "employee"
 * PINs are globally unique across all three, enforced at creation time.
 */
export async function login(pin: string) {
    const ds = await getDataSource();

    let role = "";
    let tenantId = "";
    let employeeId = "";
    let destination = "/";

    // 1. Super-admin
    const settingsRepo = ds.getRepository(SystemSettings);
    const superRow = await settingsRepo.findOne({ where: { key: "superadmin_pin" } });
    if (superRow && pin === superRow.value) {
        role = "superadmin";
        destination = "/admin";
    }

    // 2. Tenant admin (owner)
    if (!role) {
        const tenant = await ds.getRepository(Tenant).findOne({ where: { adminPin: pin } });
        if (tenant) {
            if (tenant.status !== "active") {
                return { error: "This account has been suspended. Contact support." };
            }
            role = "admin";
            tenantId = tenant.id.toString();
        }
    }

    // 3. Employee
    if (!role) {
        const emp = await ds.getRepository(Employee).findOne({ where: { pin, status: "active" } });
        if (emp) {
            role = "employee";
            tenantId = emp.tenantId ? emp.tenantId.toString() : "";
            employeeId = emp.id.toString();
        }
    }

    if (!role) {
        return { error: "Invalid PIN. Please try again." };
    }

    const cookieStore = await cookies();
    cookieStore.set("user_role", role, COOKIE_OPTS);

    if (tenantId) {
        cookieStore.set("tenant_id", tenantId, COOKIE_OPTS);
    } else {
        cookieStore.delete("tenant_id");
    }

    if (employeeId) {
        cookieStore.set("user_id", employeeId, COOKIE_OPTS);
    } else {
        cookieStore.delete("user_id");
    }

    redirect(destination);
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete("user_role");
    cookieStore.delete("user_id");
    cookieStore.delete("tenant_id");
    redirect("/login");
}

export async function getRole() {
    const cookieStore = await cookies();
    return cookieStore.get("user_role")?.value || null;
}

export async function getUserId() {
    const cookieStore = await cookies();
    return cookieStore.get("user_id")?.value || null;
}

/** Display name of the current session's tenant (business/owner name), or null. */
export async function getTenantName(): Promise<string | null> {
    const tenantId = await getTenantId();
    if (!tenantId) return null;
    const ds = await getDataSource();
    const tenant = await ds.getRepository(Tenant).findOne({ where: { id: tenantId } });
    return tenant?.name || null;
}

export async function getTenantId(): Promise<number | null> {
    const cookieStore = await cookies();
    const raw = cookieStore.get("tenant_id")?.value;
    if (!raw) return null;
    const n = parseInt(raw, 10);
    return Number.isNaN(n) ? null : n;
}

/**
 * Returns the current request's tenant id, throwing if there isn't one.
 * Every tenant-scoped action calls this so no query can run unscoped.
 */
export async function requireTenant(): Promise<number> {
    const tenantId = await getTenantId();
    if (!tenantId) {
        throw new Error("Unauthorized: no active tenant session");
    }
    return tenantId;
}

/**
 * Global PIN-uniqueness check across super-admin, all tenant admins, and all
 * employees. Optionally exclude one employee / one tenant (for edits).
 */
export async function isPinTaken(
    pin: string,
    opts?: { excludeEmployeeId?: number; excludeTenantId?: number }
): Promise<boolean> {
    const ds = await getDataSource();

    const superRow = await ds.getRepository(SystemSettings).findOne({ where: { key: "superadmin_pin" } });
    if (superRow && superRow.value === pin) return true;

    const tenantWhere: any = { adminPin: pin };
    if (opts?.excludeTenantId) tenantWhere.id = Not(opts.excludeTenantId);
    const tenant = await ds.getRepository(Tenant).findOne({ where: tenantWhere });
    if (tenant) return true;

    const empWhere: any = { pin };
    if (opts?.excludeEmployeeId) empWhere.id = Not(opts.excludeEmployeeId);
    const emp = await ds.getRepository(Employee).findOne({ where: empWhere });
    if (emp) return true;

    return false;
}

/**
 * Live availability check for the CURRENT user's own PIN change. Excludes the
 * caller's own account so re-using their existing PIN isn't flagged as taken.
 * Returns { available } — used by the Change PIN modal for inline validation.
 */
export async function checkPinAvailableForSelf(pin: string): Promise<{ available: boolean }> {
    if (!/^\d{4}$/.test(pin)) return { available: false };

    const role = await getRole();

    if (role === "admin") {
        const tenantId = await getTenantId();
        const taken = await isPinTaken(pin, tenantId ? { excludeTenantId: tenantId } : undefined);
        return { available: !taken };
    }

    if (role === "superadmin") {
        const ds = await getDataSource();
        const row = await ds.getRepository(SystemSettings).findOne({ where: { key: "superadmin_pin" } });
        // Their own current PIN counts as available (changing to it is a no-op).
        if (row && row.value === pin) return { available: true };
        return { available: !(await isPinTaken(pin)) };
    }

    return { available: false };
}

/** Generate a random 4-digit PIN that is globally unused. */
export async function generateGlobalUniquePin(): Promise<string> {
    for (let attempts = 0; attempts < 100; attempts++) {
        const pin = Math.floor(1000 + Math.random() * 9000).toString();
        if (!(await isPinTaken(pin))) return pin;
    }
    throw new Error("Failed to generate a unique PIN");
}

/**
 * Change the caller's own PIN.
 *  - admin      -> updates their tenant's admin PIN
 *  - superadmin -> updates the super-admin PIN
 * New PIN must be 4 digits and globally unique.
 */
export async function updateAdminPin(currentPin: string, newPin: string) {
    const role = await getRole();
    const ds = await getDataSource();

    if (!/^\d{4}$/.test(newPin)) {
        throw new Error("PIN must be exactly 4 digits");
    }

    if (role === "superadmin") {
        const settingsRepo = ds.getRepository(SystemSettings);
        const row = await settingsRepo.findOne({ where: { key: "superadmin_pin" } });
        const stored = row ? row.value : "";
        if (currentPin !== stored) throw new Error("Current PIN is incorrect");
        if (await isPinTaken(newPin)) throw new Error("That PIN is already in use");
        await settingsRepo.save({ key: "superadmin_pin", value: newPin });
        return { success: true };
    }

    if (role === "admin") {
        const tenantId = await requireTenant();
        const tenantRepo = ds.getRepository(Tenant);
        const tenant = await tenantRepo.findOne({ where: { id: tenantId } });
        if (!tenant) throw new Error("Account not found");
        if (currentPin !== tenant.adminPin) throw new Error("Current PIN is incorrect");
        if (await isPinTaken(newPin, { excludeTenantId: tenantId })) {
            throw new Error("That PIN is already in use");
        }
        tenant.adminPin = newPin;
        await tenantRepo.save(tenant);
        return { success: true };
    }

    throw new Error("Unauthorized");
}
