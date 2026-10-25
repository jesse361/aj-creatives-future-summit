import { Suspense } from "react";
import { connection } from "next/server";

async function Connected() {
  await connection();
  return null;
}

export function DynamicMarker() {
  return (
    <Suspense fallback={null}>
      <Connected />
    </Suspense>
  );
}
