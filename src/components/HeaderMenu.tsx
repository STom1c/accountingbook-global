"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale } from "next-intl";

const LOCALES = [
  { value: "zh-TW", label: "🇹🇼 繁中" },
  { value: "zh-CN", label: "🇨🇳 简中" },
  { value: "ja",    label: "🇯🇵 日本語" },
  { value: "ms",    label: "🇲🇾 Malay" },
  { value: "th",    label: "🇹🇭 ไทย" },
];

export default function HeaderMenu({
  userName,
  signOutAction,
}: {
  userName: string | null | undefined;
  signOutAction: () => Promise<void>;
}) {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const switchLocale = (newLocale: string) => {
    const path = window.location.pathname;
    const next = path.startsWith(`/${locale}`)
      ? path.replace(`/${locale}`, `/${newLocale}`)
      : `/${newLocale}${path === "/" ? "" : path}`;
    window.location.href = next;
  };

  return (
    <div className="header-menu-wrap" ref={ref}>
      <button
        className="btn-header-menu"
        onClick={() => setOpen(o => !o)}
        aria-label="Menu"
        aria-expanded={open}
      >
        &#8943;
      </button>

      {open && (
        <div className="header-menu-dropdown">
          {userName && (
            <div className="header-menu-user">{userName}</div>
          )}

          <div className="header-menu-section-label">語言 / Language</div>
          <div className="header-menu-lang-grid">
            {LOCALES.map(l => (
              <button
                key={l.value}
                className={`header-menu-lang-btn${locale === l.value ? " active" : ""}`}
                onClick={() => { setOpen(false); switchLocale(l.value); }}
              >
                {l.label}
              </button>
            ))}
          </div>

          <div className="header-menu-divider" />

          <a href="import" className="header-menu-item" onClick={() => setOpen(false)}>
            ↑ Import data
          </a>

          <div className="header-menu-divider" />

          <form action={signOutAction}>
            <button type="submit" className="header-menu-item header-menu-signout">
              登出帳號
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
