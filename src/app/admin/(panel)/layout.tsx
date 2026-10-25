import type { Metadata } from "next";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "@/components/admin-nav";

export const instant = false;

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Admin · AJ CREATIVES",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await connection();
  const admin = await requireAdmin();
  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[16rem_1fr]">
      <AdminNav email={admin.email} />
      <div className="px-4 py-8 sm:px-8">{children}</div>
    </div>
  );
}
