import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["zh-TW", "zh-CN", "ja", "ms", "th"],
  defaultLocale: "zh-TW",
});
