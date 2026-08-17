import tseslintParser from "@typescript-eslint/parser";
import qwikPlugin from "eslint-plugin-qwik";

export default [
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslintParser,
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        fetch: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        CustomEvent: "readonly",
        Event: "readonly",
        FormData: "readonly",
        File: "readonly",
        URL: "readonly",
        Intl: "readonly",
        navigator: "readonly",
        Request: "readonly",
        Response: "readonly",
        Headers: "readonly",
        import: "readonly",
        console: "readonly",
        process: "readonly",
      },
    },
    plugins: { qwik: qwikPlugin },
    rules: {
      "no-unused-vars": "off",
      "no-undef": "off",
      "no-empty": "off",
    },
  },
  {
    ignores: ["dist", "server", "node_modules", "tmp"],
  },
];
