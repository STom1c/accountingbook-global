import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const t = await getTranslations("common");
  const authT = await getTranslations("auth");
  const session = await auth();

  // 若已登入，直接跳轉到儀表板
  if (session?.user) {
    redirect("/zh-TW/dashboard");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <h1>{t("appName")} 🚀</h1>
      <p>{authT("signInSubtitle")}</p>
      
      <div style={{ marginTop: "2rem" }}>
        <a href="/api/auth/signin" style={{ padding: "0.8rem 1.5rem", background: "#4285F4", color: "white", borderRadius: "8px", textDecoration: "none", fontWeight: "bold" }}>
          {authT("signInWithGoogle")}
        </a>
      </div>
    </div>
  );
}
