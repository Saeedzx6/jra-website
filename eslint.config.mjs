import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

/**
 * ESLint was in devDependencies and `npm run lint` was `next lint`, but no
 * config file existed -- so the script prompted for setup and exited without
 * checking anything. It had never run. This is that config.
 *
 * `next/core-web-vitals` carries the rules that catch real Next.js mistakes
 * (an <img> where next/image belongs, a missing key, a hook called
 * conditionally); `next/typescript` adds the TypeScript set.
 */
const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const config = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "next-env.d.ts",
      "src/generated/**",
      "prisma/migrations/**",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      /**
       * A leading underscore is this codebase's existing way of saying "the
       * signature requires this parameter and the body does not use it" --
       * which is every server action's `_prev`, required by React's
       * `useActionState` contract. Renaming them to satisfy the linter would
       * lose that meaning.
       */
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
];

export default config;
