import "reflect-metadata";
import { DataSource } from "typeorm";
import { Employee } from "./entities/Employee";
import { Client } from "./entities/Client";
import { Attendance } from "./entities/Attendance";
import { Advance } from "./entities/Advance";
import { WorkAssignment } from "./entities/WorkAssignment";
import { MoneyTaken } from "./entities/MoneyTaken";
import { MonthlyAdvance } from "./entities/MonthlyAdvance";
export const AppDataSource = new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/ak-attendance",
    synchronize: true, // Auto-create tables for dev
    logging: false,
    entities: [Employee, Attendance, Advance, Client, WorkAssignment, MoneyTaken, MonthlyAdvance],
    migrations: [],
    subscribers: [],
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

let dataSource: DataSource | null = null;

export const getDataSource = async () => {
    if (dataSource?.isInitialized) return dataSource;
    dataSource = await AppDataSource.initialize();
    return dataSource;
};
