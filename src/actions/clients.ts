"use server";

import { getDataSource } from "@/lib/typeorm/data-source";
import { Client } from "@/lib/typeorm/entities/Client";
import { WorkAssignment } from "@/lib/typeorm/entities/WorkAssignment";
import { MoneyTaken } from "@/lib/typeorm/entities/MoneyTaken";
import { ProjectExpense } from "@/lib/typeorm/entities/ProjectExpense";
import { revalidatePath } from "next/cache";
import { ILike } from "typeorm";
import { requireTenant } from "./auth";

export async function getClients() {
    const tenantId = await requireTenant();
    const ds = await getDataSource();
    const clients = await ds.getRepository(Client).find({
        where: { tenantId },
        order: { updatedAt: "DESC" }
    });
    return JSON.parse(JSON.stringify(clients));
}

export async function addClient(name: string, location: string) {
    if (!name || name.length > 15) throw new Error("Name is required and max 15 chars");
    if (!location || location.length > 15) throw new Error("Location is required and max 15 chars");

    const tenantId = await requireTenant();
    const ds = await getDataSource();
    const repo = ds.getRepository(Client);

    // Check for duplicate name (case-insensitive) WITHIN this tenant
    const existing = await repo.findOne({
        where: { name: ILike(name), tenantId }
    });

    if (existing) {
        throw new Error("Project site with this name already exists");
    }

    const client = repo.create({ name, location, tenantId });
    await repo.save(client);
    revalidatePath("/");
}

export async function updateClient(id: number, data: Partial<Client>) {
    const tenantId = await requireTenant();
    const ds = await getDataSource();
    const { tenantId: _t, id: _i, ...safe } = data as any;
    await ds.getRepository(Client).update({ id, tenantId }, safe);
    revalidatePath("/");
}

export async function deleteClient(id: number) {
    const tenantId = await requireTenant();
    const ds = await getDataSource();

    // Manually delete related records as a fallback for cascade (tenant-scoped)
    await ds.getRepository(WorkAssignment).delete({ clientId: id, tenantId });
    await ds.getRepository(MoneyTaken).delete({ clientId: id, tenantId });
    await ds.getRepository(ProjectExpense).delete({ clientId: id, tenantId });

    // Delete the client
    await ds.getRepository(Client).delete({ id, tenantId });

    revalidatePath("/");
}

export async function assignWork(employeeId: number, clientId: number, date: string) {
    const tenantId = await requireTenant();
    const ds = await getDataSource();
    const repo = ds.getRepository(WorkAssignment);

    // Check if already assigned to THIS client on THIS date
    const existing = await repo.findOne({ where: { employeeId, clientId, date, tenantId } });
    if (!existing) {
        const assignment = repo.create({ employeeId, clientId, date, tenantId });
        await repo.save(assignment);
    }
    revalidatePath("/");
}

export async function unassignWork(employeeId: number, clientId: number, date: string) {
    const tenantId = await requireTenant();
    const ds = await getDataSource();
    await ds.getRepository(WorkAssignment).delete({ employeeId, clientId, date, tenantId });
    revalidatePath("/");
}

export async function logClientMoney(clientId: number, date: string, amount: number) {
    const tenantId = await requireTenant();
    const ds = await getDataSource();
    const repo = ds.getRepository(MoneyTaken);
    let record = await repo.findOne({ where: { clientId, date, tenantId } });
    if (record) {
        record.amount = amount;
        await repo.save(record);
    } else {
        record = repo.create({ clientId, date, amount, tenantId });
    }
    await repo.save(record);

    // Touch the client to update updatedAt
    await ds.getRepository(Client).update({ id: clientId, tenantId }, { updatedAt: new Date() });

    revalidatePath("/");
}

export async function getClientMonthlyData(year: number, month: number) {
    const tenantId = await requireTenant();
    const ds = await getDataSource();

    // Fetch all data regardless of date to support entries from any time period
    const assignments = await ds.getRepository(WorkAssignment).createQueryBuilder("wa")
        .leftJoinAndSelect("wa.employee", "emp")
        .where("wa.tenant_id = :tenantId", { tenantId })
        .getMany();

    const moneyTaken = await ds.getRepository(MoneyTaken).createQueryBuilder("mt")
        .where("mt.tenant_id = :tenantId", { tenantId })
        .getMany();

    const expenses = await ds.getRepository(ProjectExpense).createQueryBuilder("pe")
        .where("pe.tenant_id = :tenantId", { tenantId })
        .getMany();

    return JSON.parse(JSON.stringify({ assignments, moneyTaken, expenses }));
}

export async function updateWorkforce(clientId: number, date: string, employeeIds: number[]) {
    const tenantId = await requireTenant();
    const ds = await getDataSource();
    const repo = ds.getRepository(WorkAssignment);

    // Delete existing assignments for this client and date
    await repo.delete({ clientId, date, tenantId });

    // Insert new assignments
    if (employeeIds.length > 0) {
        const newAssignments = employeeIds.map(empId =>
            repo.create({ employeeId: empId, clientId, date, tenantId })
        );
        await repo.save(newAssignments);
    }

    // Touch the client to update updatedAt
    await ds.getRepository(Client).update({ id: clientId, tenantId }, { updatedAt: new Date() });

    revalidatePath("/");
}

export async function deleteProjectEntry(clientId: number, date: string) {
    const tenantId = await requireTenant();
    const ds = await getDataSource();

    // Delete all data for this project entry (tenant-scoped)
    await ds.getRepository(WorkAssignment).delete({ clientId, date, tenantId });
    await ds.getRepository(MoneyTaken).delete({ clientId, date, tenantId });
    await ds.getRepository(ProjectExpense).delete({ clientId, date, tenantId });

    // Touch the client to update updatedAt
    await ds.getRepository(Client).update({ id: clientId, tenantId }, { updatedAt: new Date() });

    revalidatePath("/");
}
