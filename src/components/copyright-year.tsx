import { connection } from "next/server";
import { Suspense } from "react";

async function CurrentYear() {
  await connection();
  return <span>{new Date().getFullYear()}</span>;
}

export function CopyrightYear() {
  return (
    <Suspense fallback={<span />}>
      <CurrentYear />
    </Suspense>
  );
}
