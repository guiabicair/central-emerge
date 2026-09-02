import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade · Central Emerge",
  description:
    "Como a Central Emerge trata dados de acesso e integrações da equipe Emerge.",
};

const UPDATED = "2 de setembro de 2026";

export default function PrivacidadePage() {
  return (
    <main className="bg-background text-foreground mx-auto min-h-dvh max-w-2xl px-6 py-16">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        Central Emerge
      </p>
      <h1 className="mt-2 text-2xl font-semibold">Política de Privacidade</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Atualizada em {UPDATED}
      </p>

      <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-base font-semibold">O que é a Central Emerge</h2>
          <p className="text-muted-foreground mt-1">
            A Central Emerge é um sistema interno de uso restrito da equipe da
            Emerge (agência), para gestão de operação: clientes, propostas,
            projetos, tarefas, financeiro e conteúdo. Não é um produto aberto ao
            público e não há cadastro externo.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">Dados que tratamos</h2>
          <ul className="text-muted-foreground mt-1 list-disc pl-5">
            <li>
              <strong className="text-foreground">Conta:</strong> nome, e-mail e
              foto de perfil da conta Google usada para entrar, apenas para
              autenticar e identificar quem fez cada ação.
            </li>
            <li>
              <strong className="text-foreground">Operação:</strong> dados que a
              própria equipe cadastra no sistema (clientes, propostas, tarefas
              etc.).
            </li>
            <li>
              <strong className="text-foreground">
                Integrações do Google (quando ativadas):
              </strong>{" "}
              acesso ao Google Calendar e ao Google Drive de uma conta única da
              empresa, para sincronizar reuniões e arquivar documentos de
              projeto. Só acessamos itens criados ou vinculados pela própria
              Central.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold">Como usamos</h2>
          <p className="text-muted-foreground mt-1">
            Exclusivamente para operar o sistema interno. Não vendemos, alugamos
            nem compartilhamos dados com terceiros para publicidade. O uso de
            informações recebidas das APIs do Google segue a{" "}
            <a
              className="text-foreground underline"
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Política de Dados do Usuário dos Serviços de API do Google
            </a>
            , incluindo os requisitos de Uso Limitado.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">Armazenamento e segurança</h2>
          <p className="text-muted-foreground mt-1">
            Os dados ficam em banco Supabase (PostgreSQL) com controle de acesso
            por papel. Credenciais de plataformas cadastradas no sistema são
            visíveis apenas a quem tem permissão para isso.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">Retenção e exclusão</h2>
          <p className="text-muted-foreground mt-1">
            Dados são mantidos enquanto a pessoa faz parte da equipe e o sistema
            está em uso. Para revogar o acesso do app à sua conta Google, use{" "}
            <a
              className="text-foreground underline"
              href="https://myaccount.google.com/permissions"
              target="_blank"
              rel="noopener noreferrer"
            >
              as permissões da Conta Google
            </a>
            . Para remoção de dados, fale com o administrador.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">Contato</h2>
          <p className="text-muted-foreground mt-1">
            contato.emergetech@gmail.com
          </p>
        </section>
      </div>
    </main>
  );
}
