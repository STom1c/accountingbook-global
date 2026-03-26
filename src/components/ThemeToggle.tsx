"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
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
      style={{
        background: "transparent",
        border: "1px solid var(--foreground)",
        color: "var(--foreground)",
        padding: "0.4rem 0.8rem",
        borderRadius: "20px",
        cursor: "pointer",
        fontSize: "0.9rem"
      }}
    >
      {theme === "light" ? "🌙 淺色模式" : "☀️ 深色模式"}
    </button>
  );
}
