"use server";

import { getDataSource } from "@/lib/typeorm/data-source";
import { Client } from "@/lib/typeorm/entities/Client";
import { WorkAssignment } from "@/lib/typeorm/entities/WorkAssignment";
import { MoneyTaken } from "@/lib/typeorm/entities/MoneyTaken";
import { Employee } from "@/lib/typeorm/entities/Employee";
import { revalidatePath } from "next/cache";

export async function getClients() {
    const ds = await getDataSource();
    const clients = await ds.getRepository(Client).find({
        order: { updatedAt: "DESC" }
    });
    return JSON.parse(JSON.stringify(clients));
}

export async function addClient(name: string, location: string) {
    if (!name || name.length > 15) throw new Error("Name is required and max 15 chars");
    if (!location || location.length > 15) throw new Error("Location is required and max 15 chars");

    const ds = await getDataSource();
    const client = ds.getRepository(Client).create({ name, location });
    await ds.getRepository(Client).save(client);
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
    const start = new Date(year, month, 2).toISOString().split("T")[0];
    const end = new Date(year, month + 1, 1).toISOString().split("T")[0];

    const assignments = await ds.getRepository(WorkAssignment).createQueryBuilder("wa")
        .leftJoinAndSelect("wa.employee", "emp")
        .where("wa.date >= :start AND wa.date <= :end", { start, end })
        .getMany();

    const moneyTaken = await ds.getRepository(MoneyTaken).createQueryBuilder("mt")
        .where("mt.date >= :start AND mt.date <= :end", { start, end })
        .getMany();

    return JSON.parse(JSON.stringify({ assignments, moneyTaken }));
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
