import { Topbar } from "@/components/layout/topbar";
import { RecursosTabs } from "@/components/equipe/recursos-tabs";
import { CoursesList, type CourseItem } from "@/components/equipe/courses-list";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/lib/auth/roles";

export const metadata = { title: "Cursos · Central Emerge" };

export default async function CursosPage() {
  const supabase = await createClient();
  const [{ data }, canManage] = await Promise.all([
    supabase
      .from("courses")
      .select("id, title, description, link, email, password")
      .order("title"),
    can("recursos.manage"),
  ]);

  const items = (data ?? []) as CourseItem[];

  return (
    <>
      <Topbar title="Recursos" description={`Cursos — ${items.length} na biblioteca`} />
      <RecursosTabs />
      <div className="flex-1 overflow-y-auto">
        <CoursesList items={items} canManage={canManage} />
      </div>
    </>
  );
}
