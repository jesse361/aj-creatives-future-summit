import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "@/components/admin/AdminChrome";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <main className="page-wrap py-10">
      <AdminNav />
      {children}
    </main>
  );
}
