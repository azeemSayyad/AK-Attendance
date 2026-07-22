import "reflect-metadata";
import { DataSource } from "typeorm";
import { Employee } from "./entities/Employee";
import { Client } from "./entities/Client";
import { Attendance } from "./entities/Attendance";
import { Advance } from "./entities/Advance";
import { WorkAssignment } from "./entities/WorkAssignment";
import { MoneyTaken } from "./entities/MoneyTaken";
import { MonthlyAdvance } from "./entities/MonthlyAdvance";
import { SystemSettings } from "./entities/SystemSettings";
import { ProjectExpense } from "./entities/ProjectExpense";
import { CommonExpense } from "./entities/CommonExpense";
import { Tenant } from "./entities/Tenant";

export const AppDataSource = new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/ak-attendance",
    synchronize: true, // Auto-create tables for dev
    logging: false,
    entities: [Employee, Attendance, Advance, Client, WorkAssignment, MoneyTaken, MonthlyAdvance, SystemSettings, ProjectExpense, CommonExpense, Tenant],
    migrations: [],
    subscribers: [],
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

let dataSource: DataSource | null = null;
let seeded = false;

// Default super-admin PIN (used to onboard/manage tenants from the /admin portal).
const SUPERADMIN_PIN = "1109";
// The tenant that owns all pre-existing single-tenant data.
const LEGACY_TENANT_NAME = "Akram Pasha";
const LEGACY_TENANT_PIN = "9949";

// All tenant-scoped tables that must be backfilled to the legacy tenant.
const TENANT_TABLES = [
    "employees",
    "clients",
    "attendance",
    "advances",
    "work_assignments",
    "money_taken",
    "monthly_advances",
    "project_expenses",
    "common_expenses",
];

/**
 * One-time, idempotent migration from single-tenant to multi-tenant:
 *  1. Seed the super-admin PIN.
 *  2. Create the legacy tenant ("Akram Pasha") for the existing data.
 *  3. Backfill every existing row (tenant_id IS NULL) onto that tenant.
 * Guarded by a settings flag so it runs only once, ever.
 */
async function runSeed(ds: DataSource) {
    if (seeded) return;

    const settingsRepo = ds.getRepository(SystemSettings);

    const flag = await settingsRepo.findOne({ where: { key: "tenant_migration_v1" } });
    if (flag) {
        seeded = true;
        return;
    }

    // 1. Super-admin PIN
    const superRow = await settingsRepo.findOne({ where: { key: "superadmin_pin" } });
    if (!superRow) {
        await settingsRepo.save({ key: "superadmin_pin", value: SUPERADMIN_PIN });
    }

    // 2. Legacy tenant — reuse the existing admin PIN if one was set, else 9949.
    const tenantRepo = ds.getRepository(Tenant);
    let legacy = await tenantRepo.findOne({ where: { name: LEGACY_TENANT_NAME } });
    if (!legacy) {
        const adminRow = await settingsRepo.findOne({ where: { key: "admin_pin" } });
        const adminPin = adminRow?.value || LEGACY_TENANT_PIN;
        legacy = tenantRepo.create({ name: LEGACY_TENANT_NAME, adminPin, status: "active" });
        await tenantRepo.save(legacy);
    }

    // 3. Backfill all existing rows to the legacy tenant.
    for (const table of TENANT_TABLES) {
        await ds.query(`UPDATE ${table} SET tenant_id = $1 WHERE tenant_id IS NULL`, [legacy.id]);
    }

    await settingsRepo.save({ key: "tenant_migration_v1", value: "done" });
    seeded = true;
}

export const getDataSource = async () => {
    if (dataSource?.isInitialized) {
        await runSeed(dataSource);
        return dataSource;
    }
    dataSource = await AppDataSource.initialize();
    await runSeed(dataSource);
    return dataSource;
};
