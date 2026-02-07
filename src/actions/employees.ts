"use server";

import { getDataSource } from "@/lib/typeorm/data-source";
import { Employee } from "@/lib/typeorm/entities/Employee";
import { Attendance } from "@/lib/typeorm/entities/Attendance";
import { revalidatePath } from "next/cache";

export async function getEmployees(year?: number, month?: number) {
    const ds = await getDataSource();
    const repo = ds.getRepository(Employee);

    const employees = await repo.find({
        where: { status: "active" },
        order: { dailyWage: "DESC", name: "ASC" },
    });

    // Ensure all active employees have a PIN (migration for existing)
    for (const emp of employees) {
        if (!emp.pin) {
            emp.pin = Math.floor(1000 + Math.random() * 9000).toString();
            await repo.save(emp);
        }
    }

    return JSON.parse(JSON.stringify(employees));
}

export async function addEmployee(formData: { name: string; dailyWage: number; phone?: string }) {
    if (formData.name.length > 15) {
        throw new Error("Name must be 15 characters or less");
    }

    const ds = await getDataSource();
    const repo = ds.getRepository(Employee);

    const existing = await repo.findOne({ where: { name: formData.name } });
    if (existing) {
        if (existing.status === "archived") {
            existing.status = "active";
            existing.dailyWage = formData.dailyWage;
            existing.phone = formData.phone;
            if (!existing.pin) {
                existing.pin = Math.floor(1000 + Math.random() * 9000).toString();
            }
            await repo.save(existing);
            revalidatePath("/");
            return;
        }
        throw new Error("Employee name already exists");
    }

    const employee = repo.create({
        name: formData.name,
        dailyWage: formData.dailyWage,
        phone: formData.phone,
        status: "active",
        pin: Math.floor(1000 + Math.random() * 9000).toString()
    });

    await repo.save(employee);
    revalidatePath("/");
}

export async function deleteEmployee(id: number) {
    const ds = await getDataSource();
    await ds.getRepository(Employee).update(id, { status: "archived" });
    revalidatePath("/");
}

export async function updateEmployee(id: number, data: Partial<Employee>) {
    const ds = await getDataSource();
    await ds.getRepository(Employee).update(id, data);
    revalidatePath("/");
}
