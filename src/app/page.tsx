import Dashboard from "@/components/Dashboard";
import { getRole, getUserId } from "@/actions/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const role = await getRole();
  const userId = await getUserId();
  if (!role) {
    redirect("/login");
  }
  return <Dashboard role={role} userId={userId} />;
}
