"use server";

import { getDataSource } from "@/lib/typeorm/data-source";
import { Attendance } from "@/lib/typeorm/entities/Attendance";
import { Advance } from "@/lib/typeorm/entities/Advance";
import { MonthlyAdvance } from "@/lib/typeorm/entities/MonthlyAdvance";
import { revalidatePath } from "next/cache";

export async function toggleAttendance(employeeId: number, date: string, present: boolean, multiplier: number = 1.0) {
    const ds = await getDataSource();
    const repo = ds.getRepository(Attendance);

    let record = await repo.findOne({ where: { employeeId, date } });

    if (record) {
        record.present = present;
        record.multiplier = multiplier;
        await repo.save(record);
    } else {
        record = repo.create({ employeeId, date, present, multiplier });
        await repo.save(record);
    }

    revalidatePath("/");
}

export async function logAdvance(employeeId: number, date: string, amount: number, note?: string) {
    const ds = await getDataSource();
    const repo = ds.getRepository(Advance);

    let record = await repo.findOne({ where: { employeeId, date } });

    if (record) {
        record.amount = amount;
        record.note = note;
        await repo.save(record);
    } else {
        record = repo.create({ employeeId, date, amount, note });
        await repo.save(record);
    }

    revalidatePath("/");
}

export async function logMonthlyAdvance(employeeId: number, year: number, month: number, amount: number) {
    const ds = await getDataSource();
    const repo = ds.getRepository(MonthlyAdvance);

    let record = await repo.findOne({ where: { employeeId, year, month } });

    if (record) {
        record.amount = amount;
        await repo.save(record);
    } else {
        record = repo.create({ employeeId, year, month, amount });
        await repo.save(record);
    }

    revalidatePath("/");
}

export async function getMonthlyData(year: number, month: number) {
    const ds = await getDataSource();
    // Month starts on 2nd of CURRENT month
    const start = new Date(year, month, 2).toISOString().split("T")[0];
    // Month ends on 1st of NEXT month
    const end = new Date(year, month + 1, 1).toISOString().split("T")[0];

    const attendance = await ds.getRepository(Attendance).createQueryBuilder("att")
        .where("att.date >= :start AND att.date <= :end", { start, end })
        .getMany();

    const advances = await ds.getRepository(Advance).createQueryBuilder("adv")
        .where("adv.date >= :start AND adv.date <= :end", { start, end })
        .getMany();

    const monthlyAdvances = await ds.getRepository(MonthlyAdvance).find({
        where: { year, month }
    });

    return JSON.parse(JSON.stringify({ attendance, advances, monthlyAdvances }));
}
