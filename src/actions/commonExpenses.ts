"use server";

import { getDataSource } from "@/lib/typeorm/data-source";
import { CommonExpense } from "@/lib/typeorm/entities/CommonExpense";
import { revalidatePath } from "next/cache";
import { requireTenant } from "./auth";

export async function getCommonExpenses() {
    const tenantId = await requireTenant();
    const ds = await getDataSource();
    const repo = ds.getRepository(CommonExpense);
    const expenses = await repo.find({ where: { tenantId }, order: { name: "ASC" } });
    return JSON.parse(JSON.stringify(expenses));
}

export async function addCommonExpense(name: string, amount: number) {
    const tenantId = await requireTenant();
    const ds = await getDataSource();
    const repo = ds.getRepository(CommonExpense);
    const expense = repo.create({ name, amount, tenantId });
    await repo.save(expense);
    revalidatePath("/");
    return { success: true, expense: JSON.parse(JSON.stringify(expense)) };
}

export async function updateCommonExpense(id: number, name: string, amount: number) {
    const tenantId = await requireTenant();
    const ds = await getDataSource();
    const repo = ds.getRepository(CommonExpense);
    await repo.update({ id, tenantId }, { name, amount });
    revalidatePath("/");
    return { success: true };
}

export async function deleteCommonExpense(id: number) {
    const tenantId = await requireTenant();
    const ds = await getDataSource();
    const repo = ds.getRepository(CommonExpense);
    await repo.delete({ id, tenantId });
    revalidatePath("/");
    return { success: true };
}
