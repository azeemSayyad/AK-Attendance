"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getDataSource } from "@/lib/typeorm/data-source";
import { Employee } from "@/lib/typeorm/entities/Employee";
import { SystemSettings } from "@/lib/typeorm/entities/SystemSettings";

const ADMIN_PIN = "6969";

export async function login(pin: string) {
    const ds = await getDataSource();
    const repo = ds.getRepository(Employee);

    let role = "";
    let employeeId = "";

    const settingsRepo = ds.getRepository(SystemSettings);

    // Check for Admin PIN
    let adminPin = "6969"; // Default fallback
    const settings = await settingsRepo.findOne({ where: { key: "admin_pin" } });

    if (settings) {
        adminPin = settings.value;
    } else {
        // Seed default if not exists
        await settingsRepo.save({ key: "admin_pin", value: adminPin });
    }

    if (pin === adminPin) {
        role = "admin";
    } else {
        const emp = await repo.findOne({ where: { pin, status: "active" } });
        if (emp) {
            role = "employee";
            employeeId = emp.id.toString();
        } else {
            return { error: "Invalid PIN. Please try again." };
        }
    }

    const cookieStore = await cookies();
    cookieStore.set("user_role", role, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/",
    });

    if (employeeId) {
        cookieStore.set("user_id", employeeId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7,
            path: "/",
        });
    }

    redirect("/");
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete("user_role");
    cookieStore.delete("user_id");
    redirect("/login");
}

export async function getRole() {
    const cookieStore = await cookies();
    return cookieStore.get("user_role")?.value || null;
}

export async function getUserId() {
    const cookieStore = await cookies();
    return cookieStore.get("user_id")?.value || null;
}

export async function updateAdminPin(currentPin: string, newPin: string) {
    const role = await getRole();
    if (role !== "admin") {
        throw new Error("Unauthorized");
    }

    const ds = await getDataSource();
    const settingsRepo = ds.getRepository(SystemSettings);

    const settings = await settingsRepo.findOne({ where: { key: "admin_pin" } });
    const storedPin = settings ? settings.value : "6969";

    if (currentPin !== storedPin) {
        throw new Error("Current PIN is incorrect");
    }

    await settingsRepo.save({ key: "admin_pin", value: newPin });
    return { success: true };
}


