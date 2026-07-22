"use server";

import { getDataSource } from "@/lib/typeorm/data-source";
import { ProjectExpense } from "@/lib/typeorm/entities/ProjectExpense";
import { revalidatePath } from "next/cache";
import { requireTenant } from "./auth";

export async function addProjectExpense(clientId: number, date: string, name: string, amount: number) {
    const tenantId = await requireTenant();
    const ds = await getDataSource();
    const repo = ds.getRepository(ProjectExpense);

    const expense = repo.create({
        clientId,
        date,
        name,
        amount,
        tenantId,
    });

    await repo.save(expense);
    revalidatePath("/");
    return { success: true, expense: JSON.parse(JSON.stringify(expense)) };
}

export async function deleteProjectExpense(id: number) {
    const tenantId = await requireTenant();
    const ds = await getDataSource();
    const repo = ds.getRepository(ProjectExpense);
    await repo.delete({ id, tenantId });
    revalidatePath("/");
    return { success: true };
}

export async function getProjectExpenses(clientId: number) {
    const tenantId = await requireTenant();
    const ds = await getDataSource();
    const repo = ds.getRepository(ProjectExpense);
    const expenses = await repo.find({ where: { clientId, tenantId }, order: { date: "DESC" } });
    return JSON.parse(JSON.stringify(expenses));
}
