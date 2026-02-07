"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getDataSource } from "@/lib/typeorm/data-source";
import { Employee } from "@/lib/typeorm/entities/Employee";

const ADMIN_PIN = "6969";

export async function login(pin: string) {
    const ds = await getDataSource();
    const repo = ds.getRepository(Employee);

    let role = "";
    let employeeId = "";

    if (pin === ADMIN_PIN) {
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
