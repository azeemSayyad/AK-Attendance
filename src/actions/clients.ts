"use server";

import { getDataSource } from "@/lib/typeorm/data-source";
import { Client } from "@/lib/typeorm/entities/Client";
import { WorkAssignment } from "@/lib/typeorm/entities/WorkAssignment";
import { MoneyTaken } from "@/lib/typeorm/entities/MoneyTaken";
import { Employee } from "@/lib/typeorm/entities/Employee";
import { ProjectExpense } from "@/lib/typeorm/entities/ProjectExpense";
import { revalidatePath } from "next/cache";

export async function getClients() {
    const ds = await getDataSource();
    const clients = await ds.getRepository(Client).find({
        order: { updatedAt: "DESC" }
    });
    return JSON.parse(JSON.stringify(clients));
}

import { ILike } from "typeorm";

export async function addClient(name: string, location: string) {
    if (!name || name.length > 15) throw new Error("Name is required and max 15 chars");
    if (!location || location.length > 15) throw new Error("Location is required and max 15 chars");

    const ds = await getDataSource();
    const repo = ds.getRepository(Client);

    // Check for duplicate name (case-insensitive)
    const existing = await repo.findOne({
        where: { name: ILike(name) }
    });

    if (existing) {
        throw new Error("Project site with this name already exists");
    }

    const client = repo.create({ name, location });
    await repo.save(client);
    revalidatePath("/");
}

export async function updateClient(id: number, data: Partial<Client>) {
    const ds = await getDataSource();
    await ds.getRepository(Client).update(id, data);
    revalidatePath("/");
}

export async function deleteClient(id: number) {
    const ds = await getDataSource();

    // Manually delete related records as a fallback for cascade
    await ds.getRepository(WorkAssignment).delete({ clientId: id });
    await ds.getRepository(MoneyTaken).delete({ clientId: id });

    // Delete the client
    await ds.getRepository(Client).delete(id);

    revalidatePath("/");
}

export async function assignWork(employeeId: number, clientId: number, date: string) {
    const ds = await getDataSource();
    const repo = ds.getRepository(WorkAssignment);

    // Check if already assigned to THIS client on THIS date
    const existing = await repo.findOne({ where: { employeeId, clientId, date } });
    if (!existing) {
        const assignment = repo.create({ employeeId, clientId, date });
        await repo.save(assignment);
    }
    revalidatePath("/");
}

export async function unassignWork(employeeId: number, clientId: number, date: string) {
    const ds = await getDataSource();
    await ds.getRepository(WorkAssignment).delete({ employeeId, clientId, date });
    revalidatePath("/");
}

export async function logClientMoney(clientId: number, date: string, amount: number) {
    const ds = await getDataSource();
    const repo = ds.getRepository(MoneyTaken);
    let record = await repo.findOne({ where: { clientId, date } });
    if (record) {
        record.amount = amount;
        await repo.save(record);
    } else {
        record = repo.create({ clientId, date, amount });
    }
    await repo.save(record);

    // Touch the client to update updatedAt
    await ds.getRepository(Client).update(clientId, { updatedAt: new Date() });

    revalidatePath("/");
}

export async function getClientMonthlyData(year: number, month: number) {
    const ds = await getDataSource();

    // Fetch all data regardless of date to support entries from any time period
    const assignments = await ds.getRepository(WorkAssignment).createQueryBuilder("wa")
        .leftJoinAndSelect("wa.employee", "emp")
        .getMany();

    const moneyTaken = await ds.getRepository(MoneyTaken).createQueryBuilder("mt")
        .getMany();

    const expenses = await ds.getRepository(ProjectExpense).createQueryBuilder("pe")
        .getMany();

    return JSON.parse(JSON.stringify({ assignments, moneyTaken, expenses }));
}
export async function updateWorkforce(clientId: number, date: string, employeeIds: number[]) {
    const ds = await getDataSource();
    const repo = ds.getRepository(WorkAssignment);

    // Delete existing assignments for this client and date
    await repo.delete({ clientId, date });

    // Insert new assignments
    if (employeeIds.length > 0) {
        const newAssignments = employeeIds.map(empId =>
            repo.create({ employeeId: empId, clientId, date })
        );
        await repo.save(newAssignments);
    }

    // Touch the client to update updatedAt
    await ds.getRepository(Client).update(clientId, { updatedAt: new Date() });

    revalidatePath("/");
}

export async function deleteProjectEntry(clientId: number, date: string) {
    const ds = await getDataSource();

    // Delete all data for this project entry
    await ds.getRepository(WorkAssignment).delete({ clientId, date });
    await ds.getRepository(MoneyTaken).delete({ clientId, date });
    await ds.getRepository(ProjectExpense).delete({ clientId, date });

    // Touch the client to update updatedAt
    await ds.getRepository(Client).update(clientId, { updatedAt: new Date() });

    revalidatePath("/");
}
