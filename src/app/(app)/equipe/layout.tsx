import type { ReactNode } from "react";

import { requirePermission } from "@/lib/auth/roles";

export default async function EquipeLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requirePermission("equipe.view");
  return <>{children}</>;
}
