"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export default function ThemeToggle() {
  const t = useTranslations("settings");
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme as "light" | "dark");
    document.documentElement.dataset.theme = savedTheme;
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.dataset.theme = newTheme;
  };

  return (
    <button
      onClick={toggleTheme}
      title={theme === "light" ? t("themeLight") : t("themeDark")}
      aria-label={theme === "light" ? t("themeLight") : t("themeDark")}
      className="btn-theme-toggle"
    >
      {theme === "light" ? "🌙" : "☀️"}
    </button>
  );
}
