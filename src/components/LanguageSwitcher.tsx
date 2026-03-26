"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLanguage = (newLocale: string) => {
    if (typeof window === "undefined") return;
    const currentPath = window.location.pathname;
    let nextPath = currentPath;
    
    // 如果路徑包含原先的語系，替換掉；若不包含，就直接前綴掛上去
    if (currentPath.startsWith(`/${locale}/`) || currentPath === `/${locale}`) {
      nextPath = currentPath.replace(`/${locale}`, `/${newLocale}`);
    } else {
      nextPath = `/${newLocale}${currentPath === "/" ? "" : currentPath}`;
    }
    
    // 為了徹底打破可能的快取問題，直接強迫瀏覽器導向
    window.location.href = nextPath;
  };

  return (
    <select
      value={locale}
      onChange={(e) => switchLanguage(e.target.value)}
      className="lang-switcher"
    >
      <option value="zh-TW">🇹🇼 繁</option>
      <option value="zh-CN">🇨🇳 简</option>
      <option value="ja">🇯🇵 日本語</option>
      <option value="ms">🇲🇾 Malay</option>
      <option value="th">🇹🇭 ไทย</option>
    </select>
  );
}
