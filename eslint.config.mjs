import next from "eslint-config-next";

/** Flat config nativo do Next 16 (core-web-vitals + typescript já inclusos). */
const eslintConfig = [
  ...next,
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts"],
  },
];

export default eslintConfig;
