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
    rules: {
      // تحويل الأخطاء إلى تحذيرات أو إيقافها
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off", 
      "@typescript-eslint/no-unused-expressions": "off",
      "jsx-a11y/alt-text": "off",
      "@next/next/no-img-element": "off",
      
      // إيقاف بعض القواعد تماماً
      // "@typescript-eslint/no-unused-vars": "off",
      // "@typescript-eslint/no-explicit-any": "off",
    }
  }
];

export default eslintConfig;