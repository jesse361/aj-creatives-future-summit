import { ResetForm } from "@/components/reset-form";

export const instant = false;

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center bg-paper px-4">
      <ResetForm token={params.token ?? ""} />
    </main>
  );
}
