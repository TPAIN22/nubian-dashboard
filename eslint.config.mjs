import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",        // ❌ يمنع any
      "@typescript-eslint/no-unused-vars": "warn",        // ⚠️ فقط تحذير بدل خطأ
      "@next/next/no-img-element": "off",                  // ❌ للسماح باستخدام <img>
      "react/no-unescaped-entities": "warn",               // ⚠️ اقتباسات غير محمية
    },
  },
];

export default eslintConfig;
