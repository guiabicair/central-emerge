import type { CronogramaTree } from "@/lib/cronogramas/types";
import { SEED_REF } from "@/lib/cronogramas/seed-ref";

type Skeleton = Pick<CronogramaTree, "fases" | "checklists" | "secoes"> & {
  title: string;
};

const fase = (
  title: string,
  intervalLabel: string,
  items: string[],
): CronogramaTree["fases"][number] => ({
  title,
  note: null,
  intervalLabel,
  startDate: null,
  endDate: null,
  items: items.map((text) => ({
    text,
    status: "a_fazer" as const,
    date: null,
    taskId: null,
  })),
});

/** Modelos hardcoded (Régie: sem tabela de templates por ora). */
export const TEMPLATES: Record<string, Skeleton> = {
  lancamento: {
    title: "Lançamento",
    fases: [
      fase("Pré-lançamento", "Semanas 1–2", [
        "Definição de oferta e público.",
        "Estrutura da campanha (funil, canais, datas).",
        "Produção de criativos e copy.",
      ]),
      fase("Aquecimento", "Semana 3", [
        "Conteúdo de aquecimento no ar.",
        "Captação de leads / lista de interesse.",
        "Ajustes de mensagem conforme engajamento.",
      ]),
      fase("Abertura de carrinho", "Semana 4", [
        "Página de vendas + checkout ativos.",
        "Sequência de e-mails / mensagens de venda.",
        "Acompanhamento diário de métricas.",
      ]),
      fase("Fechamento e pós", "Semana 5", [
        "Última chamada + fechamento.",
        "Onboarding dos novos clientes.",
        "Relatório de resultados e aprendizados.",
      ]),
    ],
    checklists: [
      {
        title: "Checklist de go-live",
        items: [
          "Página de vendas revisada",
          "Checkout testado (ponta a ponta)",
          "E-mails agendados",
          "Criativos aprovados",
          "Suporte de plantão definido",
        ].map((text) => ({ text, done: false })),
      },
    ],
    secoes: [],
  },
  site: {
    title: "Site / Landing",
    fases: [
      fase("Alinhamento", "Semana 1", [
        "Reunião de kickoff e objetivos.",
        "Referências e moodboard.",
        "Arquitetura de informação e conteúdo.",
      ]),
      fase("Protótipo de baixa fidelidade", "Semanas 2–3", [
        "Wireframes das páginas principais.",
        "Fluxo de navegação validado com o cliente.",
      ]),
      fase("Protótipo de alta fidelidade", "Semanas 4–5", [
        "Design visual completo no Figma.",
        "Rodada de ajustes conforme feedback.",
      ]),
      fase("Entrega", "Semana 6", [
        "Reunião de entrega + handoff.",
        "Especificações (cores, tipografia, componentes).",
        "Apoio à implementação, se necessário.",
      ]),
    ],
    checklists: [
      {
        title: "Checklist de handoff",
        items: [
          "Arquivo Figma organizado",
          "Componentes e tokens documentados",
          "Anotações de interação",
          "Link de apresentação",
          "Aprovação final do cliente",
        ].map((text) => ({ text, done: false })),
      },
    ],
    secoes: [],
  },
};

export const TEMPLATE_OPTIONS = [
  { key: "", label: "Do zero (vazio)" },
  { key: "lancamento", label: "Template: Lançamento" },
  { key: "site", label: "Template: Site / Landing" },
  { key: "ref:dsec", label: "Importar: Cronograma DominiPay (ref)" },
  { key: "ref:rehabiliteMe", label: "Importar: Rehabilite-me (ref)" },
];

/** Resolve uma key de template/import numa árvore pronta pra inserir. */
export function resolveTemplate(key: string): {
  title: string;
  tree: Pick<CronogramaTree, "fases" | "checklists" | "secoes" | "description">;
} | null {
  if (!key) return null;
  if (key.startsWith("ref:")) {
    const ref = SEED_REF[key.slice(4) as keyof typeof SEED_REF];
    if (!ref) return null;
    return {
      title: ref.title,
      tree: {
        description: ref.description,
        fases: ref.fases,
        checklists: ref.checklists,
        secoes: ref.secoes,
      },
    };
  }
  const t = TEMPLATES[key];
  if (!t) return null;
  return {
    title: t.title,
    tree: { description: null, fases: t.fases, checklists: t.checklists, secoes: t.secoes },
  };
}
