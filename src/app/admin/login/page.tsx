import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { readAdminSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

export default async function AdminLoginPage() {
  if (await readAdminSession()) redirect("/admin");
  return (
    <main className="page-wrap max-w-md py-16">
      <h1 className="text-4xl">Organizer sign in</h1>
      <p className="mt-3 text-sm text-muted">This area is for the AJ Creatives organizer. Attendee records are not public.</p>
      <div className="mt-6">
        <LoginForm />
      </div>
    </main>
  );
}
