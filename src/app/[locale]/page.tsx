import { getTranslations, getLocale } from "next-intl/server";
import { auth, signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default async function HomePage() {
  const t = await getTranslations("common");
  const authT = await getTranslations("auth");
  const locale = await getLocale();
  const session = await auth();

  // 若已登入，動態跳轉到目前語系的儀表板
  if (session?.user) {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <header style={{ padding: "1rem 2rem", display: "flex", justifyContent: "flex-end" }}>
        <LanguageSwitcher />
      </header>
      
      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <h1 style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>{t("appName")} 🚀</h1>
        <p style={{ fontSize: "1.2rem", color: "gray", marginBottom: "3rem" }}>{authT("signInSubtitle")}</p>
        
        <form action={async () => {
          "use server";
          await signIn("google", { redirectTo: `/${locale}/dashboard` });
        }}>
          <button type="submit" style={{ padding: "1rem 2rem", fontSize: "1.1rem", background: "#4285F4", color: "white", border: "none", cursor: "pointer", borderRadius: "8px", fontWeight: "bold", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
            {authT("signInWithGoogle")}
          </button>
        </form>
      </main>
    </div>
  );
}
