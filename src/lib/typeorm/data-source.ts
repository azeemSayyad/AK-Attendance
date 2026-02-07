import "reflect-metadata";
import { DataSource } from "typeorm";
import { Employee } from "./entities/Employee";
import { Attendance } from "./entities/Attendance";
import { Advance } from "./entities/Advance";
import { Client } from "./entities/Client";
import { WorkAssignment } from "./entities/WorkAssignment";
import { MoneyTaken } from "./entities/MoneyTaken";
import { MonthlyAdvance } from "./entities/MonthlyAdvance";
console.log(process.env.DB_HOST, process.env.DB_PORT, process.env.DB_USER, process.env.DB_PASSWORD, process.env.DB_NAME)
export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_NAME || "ak-attendance",
    synchronize: true, // Auto-create tables for dev
    logging: false,
    entities: [Employee, Attendance, Advance, Client, WorkAssignment, MoneyTaken, MonthlyAdvance],
    migrations: [],
    subscribers: [],
});

let dataSource: DataSource | null = null;

export const getDataSource = async () => {
    if (dataSource?.isInitialized) return dataSource;
    dataSource = await AppDataSource.initialize();
    return dataSource;
};
