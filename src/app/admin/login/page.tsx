import { LoginForm } from "@/components/login-form";
import { safeNextPath } from "@/lib/safe-url";

export const instant = false;

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center bg-navy px-4">
      <LoginForm nextPath={safeNextPath(params.next)} />
    </main>
  );
}
