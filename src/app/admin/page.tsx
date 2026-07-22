import { redirect } from "next/navigation";
import { getRole } from "@/actions/auth";
import { listTenants } from "@/actions/admin";
import AdminPortal from "@/components/AdminPortal";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
    const role = await getRole();
    if (role !== "superadmin") {
        redirect("/login");
    }

    const tenants = await listTenants();
    return <AdminPortal initialTenants={tenants} />;
}
