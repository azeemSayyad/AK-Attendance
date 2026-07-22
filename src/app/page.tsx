import Dashboard from "@/components/Dashboard";
import { getRole, getUserId, getTenantName } from "@/actions/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const role = await getRole();
  const userId = await getUserId();
  if (!role) {
    redirect("/login");
  }
  if (role === "superadmin") {
    redirect("/admin");
  }
  const tenantName = await getTenantName();
  return <Dashboard role={role} userId={userId} tenantName={tenantName} />;
}
