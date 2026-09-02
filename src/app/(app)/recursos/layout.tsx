import type { ReactNode } from "react";

import { requirePermission } from "@/lib/auth/roles";

export default async function RecursosLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requirePermission("recursos.view");
  return <>{children}</>;
}
