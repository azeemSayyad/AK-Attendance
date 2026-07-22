"use server";

import { getDataSource } from "@/lib/typeorm/data-source";
import { Attendance } from "@/lib/typeorm/entities/Attendance";
import { Advance } from "@/lib/typeorm/entities/Advance";
import { MonthlyAdvance } from "@/lib/typeorm/entities/MonthlyAdvance";
import { revalidatePath } from "next/cache";
import { requireTenant } from "./auth";

export async function toggleAttendance(employeeId: number, date: string, present: boolean, multiplier: number = 1.0) {
    const tenantId = await requireTenant();
    const ds = await getDataSource();
    const repo = ds.getRepository(Attendance);

    let record = await repo.findOne({ where: { employeeId, date, tenantId } });

    if (record) {
        record.present = present;
        record.multiplier = multiplier;
        await repo.save(record);
    } else {
        record = repo.create({ employeeId, date, present, multiplier, tenantId });
        await repo.save(record);
    }

    revalidatePath("/");
}

export async function logAdvance(employeeId: number, date: string, amount: number, note?: string) {
    const tenantId = await requireTenant();
    const ds = await getDataSource();
    const repo = ds.getRepository(Advance);

    let record = await repo.findOne({ where: { employeeId, date, tenantId } });

    if (record) {
        record.amount = amount;
        record.note = note;
        await repo.save(record);
    } else {
        record = repo.create({ employeeId, date, amount, note, tenantId });
        await repo.save(record);
    }

    revalidatePath("/");
}

export async function logMonthlyAdvance(employeeId: number, year: number, month: number, amount: number) {
    const tenantId = await requireTenant();
    const ds = await getDataSource();
    const repo = ds.getRepository(MonthlyAdvance);

    let record = await repo.findOne({ where: { employeeId, year, month, tenantId } });

    if (record) {
        record.amount = amount;
        await repo.save(record);
    } else {
        record = repo.create({ employeeId, year, month, amount, tenantId });
        await repo.save(record);
    }

    revalidatePath("/");
}

export async function getMonthlyData(year: number, month: number) {
    const tenantId = await requireTenant();
    const ds = await getDataSource();
    // Month starts on 2nd of CURRENT month
    const start = new Date(year, month, 2).toISOString().split("T")[0];
    // Month ends on 1st of NEXT month
    const end = new Date(year, month + 1, 1).toISOString().split("T")[0];

    const attendance = await ds.getRepository(Attendance).createQueryBuilder("att")
        .where("att.date >= :start AND att.date <= :end", { start, end })
        .andWhere("att.tenant_id = :tenantId", { tenantId })
        .getMany();

    const advances = await ds.getRepository(Advance).createQueryBuilder("adv")
        .where("adv.date >= :start AND adv.date <= :end", { start, end })
        .andWhere("adv.tenant_id = :tenantId", { tenantId })
        .getMany();

    const monthlyAdvances = await ds.getRepository(MonthlyAdvance).find({
        where: { year, month, tenantId }
    });

    return JSON.parse(JSON.stringify({ attendance, advances, monthlyAdvances }));
}

export async function saveBatchChanges(data: {
    attendance: { employeeId: number; date: string; present: boolean; multiplier: number }[];
    advances: { employeeId: number; date: string; amount: number }[];
    monthlyAdvances: { employeeId: number; year: number; month: number; amount: number }[];
}) {
    const tenantId = await requireTenant();
    const ds = await getDataSource();

    try {
        await ds.transaction(async (manager) => {
        // 1. Process Attendance Updates
        for (const update of data.attendance) {
            const { employeeId, date, present, multiplier } = update;
            let record = await manager.findOne(Attendance, { where: { employeeId, date, tenantId } });

            if (record) {
                record.present = present;
                record.multiplier = multiplier;
                await manager.save(record);
            } else {
                const newRecord = manager.create(Attendance, { employeeId, date, present, multiplier, tenantId });
                await manager.save(newRecord);
            }
        }

        // 2. Process Advance Updates
        for (const update of data.advances) {
            const { employeeId, date, amount } = update;
            let record = await manager.findOne(Advance, { where: { employeeId, date, tenantId } });

            if (record) {
                record.amount = amount;
                await manager.save(record);
            } else {
                const newRecord = manager.create(Advance, { employeeId, date, amount, tenantId });
                await manager.save(newRecord);
            }
        }

        // 3. Process Monthly Advance Updates
        for (const update of data.monthlyAdvances) {
            const { employeeId, year, month, amount } = update;
            let record = await manager.findOne(MonthlyAdvance, { where: { employeeId, year, month, tenantId } });

            if (record) {
                record.amount = amount;
                await manager.save(record);
            } else {
                const newRecord = manager.create(MonthlyAdvance, { employeeId, year, month, amount, tenantId });
                await manager.save(newRecord);
            }
        }
        });
    } catch (err) {
        console.error("Error in saveBatchChanges transaction:", err);
        throw err;
    }

    revalidatePath("/");
    return { success: true };
}
