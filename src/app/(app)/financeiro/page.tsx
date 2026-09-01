import { FinanceSummaryCards } from "@/components/financeiro/finance-summary-cards";
import { TransactionsTable } from "@/components/financeiro/transactions-table";
import { Topbar } from "@/components/layout/topbar";
import { FINANCE_SUMMARY, TRANSACTIONS } from "@/lib/mock-data";

export const metadata = { title: "Financeiro · Central Emerge" };

export default function FinanceiroPage() {
  return (
    <>
      <Topbar
        title="Financeiro"
        description="Resumo de caixa e movimentações"
      />
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 md:p-6">
        <FinanceSummaryCards summary={FINANCE_SUMMARY} />
        <TransactionsTable transactions={TRANSACTIONS} />
      </div>
    </>
  );
}
