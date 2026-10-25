import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";
import { safeNextPath } from "@/lib/safe-url";

export default function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center bg-paper px-4">Loading…</div>}>
      <LoginGate searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginGate({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams;
  return (
    <div className="grid min-h-screen place-items-center bg-navy px-4 py-16">
      <LoginForm nextPath={safeNextPath(params.next)} />
    </div>
  );
}
