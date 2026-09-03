// GERADO por scripts/parse-cronogramas-ref.mjs a partir de docs/cronogramas-ref/*.html
// Não edite à mão — rode o script de novo. Consumido pelo seed dos 2 cronogramas.
import type { CronogramaTree } from "@/lib/cronogramas/types";

export const SEED_REF: Record<string, CronogramaTree & { pointer: string | null }> = {
  "dsec": {
    "title": "Cronograma — DominiPay",
    "description": "Mapa completo do design UX/UI do site institucional da DominiPay: alinhamento, protótipos, entrega e início da manutenção mensal.",
    "startDate": null,
    "endDate": null,
    "pointer": "Estamos aqui agora — Contrato assinado — 1ª reunião de alinhamento quinta-feira, 03/09, às 10h",
    "currentFaseIndex": 0,
    "fases": [
      {
        "title": "Alinhamento",
        "note": null,
        "intervalLabel": "Semana 1 02–07 set",
        "startDate": null,
        "endDate": null,
        "items": [
          {
            "text": "Contrato assinado e aprovado.",
            "status": "concluido",
            "date": null,
            "taskId": null
          },
          {
            "text": "1ª reunião de alinhamento — quinta-feira, 03/09, às 10h.",
            "status": "agendado",
            "date": null,
            "taskId": null
          },
          {
            "text": "Pesquisa de referências e moodboard.",
            "status": "a_fazer",
            "date": null,
            "taskId": null
          },
          {
            "text": "2ª reunião de alinhamento — apresentação e validação do moodboard antes de partir pro protótipo.",
            "status": "a_fazer",
            "date": null,
            "taskId": null
          }
        ]
      },
      {
        "title": "Protótipo de baixa fidelidade",
        "note": null,
        "intervalLabel": "Semanas 2–3 08–18 set",
        "startDate": null,
        "endDate": null,
        "items": [
          {
            "text": "Wireframes das páginas principais do site institucional.",
            "status": "a_fazer",
            "date": null,
            "taskId": null
          },
          {
            "text": "Estrutura de navegação e fluxo definidos.",
            "status": "a_fazer",
            "date": null,
            "taskId": null
          },
          {
            "text": "Validação inicial com a DominiPay antes de avançar pro visual.",
            "status": "a_fazer",
            "date": null,
            "taskId": null
          }
        ]
      },
      {
        "title": "Protótipo de alta fidelidade",
        "note": null,
        "intervalLabel": "Semanas 4–5 21 set – 02 out",
        "startDate": null,
        "endDate": null,
        "items": [
          {
            "text": "Design visual completo, com identidade visual da DominiPay aplicada, no Figma.",
            "status": "a_fazer",
            "date": null,
            "taskId": null
          },
          {
            "text": "Rodada de ajustes finos conforme feedback da DominiPay.",
            "status": "a_fazer",
            "date": null,
            "taskId": null
          }
        ]
      },
      {
        "title": "Entrega e início da manutenção",
        "note": null,
        "intervalLabel": "Até 15/10 prazo contratual",
        "startDate": null,
        "endDate": null,
        "items": [
          {
            "text": "Reunião de entrega e apresentação do protótipo final — ver checklist de handoff abaixo.",
            "status": "a_fazer",
            "date": null,
            "taskId": null
          },
          {
            "text": "Quitação da parcela final referente à entrega.",
            "status": "a_fazer",
            "date": null,
            "taskId": null
          },
          {
            "text": "Apoio técnico de implementação front-end, se a DominiPay precisar.",
            "status": "a_fazer",
            "date": null,
            "taskId": null
          },
          {
            "text": "Manutenção mensal ativada a partir do mês seguinte à entrega (vencimento todo dia 10).",
            "status": "a_fazer",
            "date": null,
            "taskId": null
          }
        ]
      }
    ],
    "checklists": [
      {
        "title": "Checklist de entrega do protótipo",
        "items": [
          {
            "text": "Wireframes de baixa fidelidade aprovados pela DominiPay.",
            "done": false
          },
          {
            "text": "Protótipo de alta fidelidade com identidade visual da DominiPay aplicada.",
            "done": false
          },
          {
            "text": "Arquivo Figma organizado por página e fluxo de navegação.",
            "done": false
          },
          {
            "text": "Especificações de cores, tipografia e componentes documentadas.",
            "done": false
          },
          {
            "text": "Anotações de interação nas telas principais (o que acontece ao clicar/rolar).",
            "done": false
          },
          {
            "text": "Link de apresentação compartilhável do protótipo navegável.",
            "done": false
          },
          {
            "text": "Reunião de entrega realizada, com apresentação do protótipo final.",
            "done": false
          },
          {
            "text": "Aprovação final da DominiPay registrada.",
            "done": false
          },
          {
            "text": "1º ciclo de manutenção mensal agendado (vencimento dia 10 do mês seguinte).",
            "done": false
          }
        ]
      }
    ],
    "secoes": []
  },
  "rehabiliteMe": {
    "title": "Cronograma e roteiros — Rehabilite-me",
    "description": "Mapa completo do que vamos produzir e publicar de setembro a dezembro de 2026: cronograma macro, roteiro da diária de captação, calendário de postagens e a checklist do Google Meu Negócio.",
    "startDate": null,
    "endDate": null,
    "pointer": "Estamos aqui agora — Proposta aprovada — aguardando a 1ª diária de captação (semana de 01/09)",
    "currentFaseIndex": 0,
    "fases": [
      {
        "title": "Setup do ciclo",
        "note": null,
        "intervalLabel": "Semana 1 01–07 set",
        "startDate": null,
        "endDate": null,
        "items": [
          {
            "text": "Aprovação da proposta e do contrato.",
            "status": "concluido",
            "date": null,
            "taskId": null
          },
          {
            "text": "Reunião de kickoff — tom de voz, objetivos e alinhamento de expectativas.",
            "status": "em_andamento",
            "date": null,
            "taskId": null
          },
          {
            "text": "Visita de reconhecimento do local — quinta-feira, 03/09. Visita técnica prévia (avaliar luz, espaço, rotina da clínica) — não é a diária de captação em si.",
            "status": "agendado",
            "date": null,
            "taskId": null
          },
          {
            "text": "1ª diária de captação — ver roteiro completo abaixo.",
            "status": "a_fazer",
            "date": null,
            "taskId": null
          },
          {
            "text": "Atualização do site institucional.",
            "status": "a_fazer",
            "date": null,
            "taskId": null
          },
          {
            "text": "Otimização inicial do Google Meu Negócio — ver checklist abaixo.",
            "status": "a_fazer",
            "date": null,
            "taskId": null
          }
        ]
      },
      {
        "title": "Mês 1 — Lançamento do conteúdo",
        "note": null,
        "intervalLabel": "Semanas 2–4 08–30 set",
        "startDate": null,
        "endDate": null,
        "items": [
          {
            "text": "Calendário editorial do mês 1 fechado com base no material da 1ª diária.",
            "status": "a_fazer",
            "date": null,
            "taskId": null
          },
          {
            "text": "8 publicações no ar (2 por semana) — ver calendário de postagem abaixo.",
            "status": "a_fazer",
            "date": null,
            "taskId": null
          },
          {
            "text": "Ficha do Google Meu Negócio 100% otimizada, com as primeiras postagens no ar.",
            "status": "a_fazer",
            "date": null,
            "taskId": null
          },
          {
            "text": "Modelo de IA ativado, treinado no acervo do Dr. Rodrigo, pra preencher os intervalos entre diárias.",
            "status": "a_fazer",
            "date": null,
            "taskId": null
          }
        ]
      },
      {
        "title": "Ritmo e ajustes",
        "note": null,
        "intervalLabel": "Meses 2 e 3 out–nov",
        "startDate": null,
        "endDate": null,
        "items": [
          {
            "text": "8 publicações/mês mantidas, combinando banco de imagens + IA.",
            "status": "a_fazer",
            "date": null,
            "taskId": null
          },
          {
            "text": "Avaliação de performance do mês 1 — quais formatos engajaram mais.",
            "status": "a_fazer",
            "date": null,
            "taskId": null
          },
          {
            "text": "2ª diária de captação, sob demanda, se o banco de conteúdo precisar de reforço.",
            "status": "a_fazer",
            "date": null,
            "taskId": null
          },
          {
            "text": "Relatório parcial de resultados (3 meses) e ajuste de estratégia pro fechamento do ciclo.",
            "status": "a_fazer",
            "date": null,
            "taskId": null
          }
        ]
      },
      {
        "title": "Fechamento do ciclo",
        "note": null,
        "intervalLabel": "Mês 4 dezembro",
        "startDate": null,
        "endDate": null,
        "items": [
          {
            "text": "8 publicações finais do ciclo de 4 meses.",
            "status": "a_fazer",
            "date": null,
            "taskId": null
          },
          {
            "text": "Relatório final com resultados dos 4 meses.",
            "status": "a_fazer",
            "date": null,
            "taskId": null
          },
          {
            "text": "Planejamento de continuidade — renovação da estratégia de conteúdo.",
            "status": "a_fazer",
            "date": null,
            "taskId": null
          }
        ]
      }
    ],
    "checklists": [
      {
        "title": "Checklist de otimização",
        "items": [
          {
            "text": "Reivindicar e verificar o perfil da Rehabilite-me no Google.",
            "done": false
          },
          {
            "text": "Categoria principal + secundárias corretas (reabilitação oncológica, prótese buco-maxilo-facial — confirmar nome exato disponível no Google com o Dr. Rodrigo).",
            "done": false
          },
          {
            "text": "Descrição otimizada com palavras-chave locais (bairro/cidade).",
            "done": false
          },
          {
            "text": "Endereço, horário e telefone confirmados e atualizados.",
            "done": false
          },
          {
            "text": "~20 fotos do Bloco 6 publicadas, organizadas por categoria.",
            "done": false
          },
          {
            "text": "Lista de serviços preenchida com todos os atendimentos oferecidos.",
            "done": false
          },
          {
            "text": "Perguntas frequentes (Q&A) respondidas preventivamente.",
            "done": false
          },
          {
            "text": "Posts semanais no GMN reaproveitando o conteúdo já publicado no Instagram.",
            "done": false
          },
          {
            "text": "Protocolo de resposta a avaliações — positivas e negativas — definido com a clínica.",
            "done": false
          },
          {
            "text": "Monitoramento mensal de visualizações, cliques e ligações pelo painel do Google.",
            "done": false
          }
        ]
      }
    ],
    "secoes": [
      {
        "kind": "roteiro",
        "title": "Roteiro de gravação — 1ª diária",
        "blocks": [
          {
            "heading": "Bloco 1 — Apresentação institucional",
            "meta": null,
            "notes": [
              "Dr. Rodrigo se apresenta: quem é, formação, especialidade em reabilitação oncológica de cabeça e pescoço.",
              "O que a Rehabilite-me faz: reabilitação oncooral completa, próteses de cabeça e pescoço, atendimento multidisciplinar personalizado.",
              "Um plano geral da recepção e um plano médio do Dr. Rodrigo falando direto pra câmera."
            ]
          },
          {
            "heading": "Bloco 2 — Conteúdo educativo — reabilitação oncológica",
            "meta": null,
            "notes": [
              "⚠️ Temas e explicações precisam ser definidos e validados com o Dr. Rodrigo antes da gravação — conteúdo médico sensível, não dá pra improvisar na hora.",
              "Sugestão de pauta: o que é reabilitação buco-maxilo-facial, como funciona uma prótese de cabeça/pescoço, o papel de cada especialista da equipe multidisciplinar, o que esperar da recuperação e reinserção social.",
              "Pra cada tema: Dr. Rodrigo explica de forma acessível, sem jargão técnico (30–45s por tema).",
              "Gravar cada tema isolado — cada um vira um Reel próprio, não corta de um vídeo só."
            ]
          },
          {
            "heading": "Bloco 3 — Depoimentos de pacientes",
            "meta": null,
            "notes": [
              "Agendar 2–3 pacientes que topem compartilhar a jornada (autorização de imagem assinada + ciência de que o tema é sensível: cirurgia oncológica, trauma, reconstrução).",
              "Perguntas-guia: como foi descobrir a necessidade da cirurgia/prótese, como foi o processo de reabilitação, o que mudou na volta à vida em sociedade.",
              "Gravar com acolhimento extra — ambiente calmo, sem pressa, liberdade pro paciente pausar ou parar quando quiser."
            ]
          },
          {
            "heading": "Bloco 4 — Bastidores da clínica",
            "meta": null,
            "notes": [
              "B-roll solto: recepção, salas de atendimento multidisciplinar, ambiente de confecção/ajuste de prótese (se houver), equipe circulando.",
              "Um plano do Dr. Rodrigo ou de outro especialista em atendimento (ação, não posado).",
              "Detalhes: placas, identidade visual da clínica, ambiente acolhedor."
            ]
          },
          {
            "heading": "Bloco 5 — Mitos vs. verdades",
            "meta": null,
            "notes": [
              "⚠️ Mitos e respostas precisam vir do Dr. Rodrigo, não inventados pela produção — é conteúdo médico sensível (reabilitação oncológica, próteses de cabeça e pescoço).",
              "Exemplos de ponto de partida pra ele validar: \"reabilitação oncológica é só estética\", \"prótese de cabeça e pescoço não recupera função\", \"depois do câncer não dá pra voltar à rotina normal\".",
              "Gravar cada mito/verdade como um take curto e isolado (5–8s cada), fala direta pro texto na tela.",
              "Pausa de 1s entre cada take pra facilitar o corte seco na edição."
            ]
          },
          {
            "heading": "Bloco 6 — Fotos para o Google Meu Negócio",
            "meta": null,
            "notes": [
              "Fachada da clínica (dia, boa luz) — 3 ângulos.",
              "Recepção vazia e com alguém atendendo — 2–3 fotos.",
              "Salas de atendimento multidisciplinar — 4–6 fotos.",
              "Equipe (com autorização) — foto de grupo + individuais dos principais especialistas.",
              "Dr. Rodrigo atendendo (ação, não posado) — 2–3 fotos."
            ]
          },
          {
            "heading": "Bloco 7 — Chamada para agendamento",
            "meta": null,
            "notes": [
              "Dr. Rodrigo fala direto pra câmera convidando quem passou por cirurgia oncológica de cabeça/pescoço ou tem deformidade a buscar uma avaliação.",
              "Tom acolhedor, reforçando a reinserção à vida em sociedade — não um convite genérico de \"agende sua consulta\".",
              "Deixar espaço de 2s no início e no fim pra inserir texto/CTA na edição.",
              "Gravar 2 variações de fala — uma mais direta, uma mais acolhedora — pra reaproveitar em meses diferentes."
            ]
          }
        ]
      }
    ]
  }
} as const;
