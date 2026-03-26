import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createDefaultLedgerIfNotExists } from "@/lib/actions/ledger";
import ImportWizard from "@/components/ImportWizard";

export default async function ImportPage() {
  const session = await auth();
  if (!session?.user) redirect("/api/auth/signin");

  const ledger = await createDefaultLedgerIfNotExists();

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ marginBottom: "1rem" }}>
        <a href="dashboard" style={{ color: "#4285F4", textDecoration: "none", fontWeight: "bold" }}>← 返回儀表板</a>
      </div>
      <ImportWizard ledgerId={ledger.id} />
    </div>
  );
}
