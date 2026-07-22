"use server";

import { getDataSource } from "@/lib/typeorm/data-source";
import { Employee } from "@/lib/typeorm/entities/Employee";
import { revalidatePath } from "next/cache";
import { ILike } from "typeorm";
import { requireTenant, isPinTaken, generateGlobalUniquePin } from "./auth";

export async function getEmployees(year?: number, month?: number) {
    const tenantId = await requireTenant();
    const ds = await getDataSource();
    const repo = ds.getRepository(Employee);

    const employees = await repo.find({
        where: { status: "active", tenantId },
        order: { dailyWage: "DESC", name: "ASC" },
    });

    // Ensure all active employees have a globally-unique PIN (migration for existing)
    for (const emp of employees) {
        if (!emp.pin) {
            emp.pin = await generateGlobalUniquePin();
            await repo.save(emp);
        }
    }

    return JSON.parse(JSON.stringify(employees));
}

export async function addEmployee(formData: { name: string; dailyWage: number; phone?: string }) {
    if (formData.name.length > 15) {
        throw new Error("Name must be 15 characters or less");
    }

    const tenantId = await requireTenant();
    const ds = await getDataSource();
    const repo = ds.getRepository(Employee);

    // Case-insensitive check for existing name WITHIN this tenant
    const existing = await repo.findOne({
        where: { name: ILike(formData.name), tenantId },
    });

    if (existing) {
        if (existing.status === "archived") {
            existing.status = "active";
            existing.dailyWage = formData.dailyWage;
            existing.phone = formData.phone;
            if (!existing.pin) {
                existing.pin = await generateGlobalUniquePin();
            }
            await repo.save(existing);
            revalidatePath("/");
            return;
        }
        throw new Error("Employee name already exists");
    }

    const pin = await generateGlobalUniquePin();

    const employee = repo.create({
        name: formData.name,
        dailyWage: formData.dailyWage,
        phone: formData.phone,
        status: "active",
        pin,
        tenantId,
    });

    await repo.save(employee);
    revalidatePath("/");
}

export async function deleteEmployee(id: number) {
    const tenantId = await requireTenant();
    const ds = await getDataSource();
    await ds.getRepository(Employee).update({ id, tenantId }, { status: "archived" });
    revalidatePath("/");
}

export async function updateEmployee(id: number, data: Partial<Employee>) {
    const tenantId = await requireTenant();
    const ds = await getDataSource();
    const repo = ds.getRepository(Employee);

    // Never allow a client to move a row across tenants.
    const { tenantId: _ignore, id: _ignoreId, ...safe } = data as any;

    // If the PIN is being changed, keep it globally unique.
    if (safe.pin) {
        if (!/^\d{4}$/.test(safe.pin)) throw new Error("PIN must be exactly 4 digits");
        if (await isPinTaken(safe.pin, { excludeEmployeeId: id })) {
            throw new Error("That PIN is already in use");
        }
    }

    await repo.update({ id, tenantId }, safe);
    revalidatePath("/");
}
