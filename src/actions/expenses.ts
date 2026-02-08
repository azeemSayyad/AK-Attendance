"use server";

import { getDataSource } from "@/lib/typeorm/data-source";
import { ProjectExpense } from "@/lib/typeorm/entities/ProjectExpense";
import { revalidatePath } from "next/cache";

export async function addProjectExpense(clientId: number, date: string, name: string, amount: number) {
    const ds = await getDataSource();
    const repo = ds.getRepository(ProjectExpense);

    const expense = repo.create({
        clientId,
        date,
        name,
        amount
    });

    await repo.save(expense);
    revalidatePath("/");
    return { success: true, expense: JSON.parse(JSON.stringify(expense)) };
}

export async function deleteProjectExpense(id: number) {
    const ds = await getDataSource();
    const repo = ds.getRepository(ProjectExpense);
    await repo.delete(id);
    revalidatePath("/");
    return { success: true };
}

export async function getProjectExpenses(clientId: number) {
    const ds = await getDataSource();
    const repo = ds.getRepository(ProjectExpense);
    const expenses = await repo.find({ where: { clientId }, order: { date: "DESC" } });
    return JSON.parse(JSON.stringify(expenses));
}
