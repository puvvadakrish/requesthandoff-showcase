import { FlatCompat } from "@eslint/eslintrc";
import tsParser from "@typescript-eslint/parser";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

/**
 * Service-role import boundary (per plan U4 + round 2 SG-08):
 *
 *   - `@requesthandoff/supabase-client-service` (RLS-bypassing service-role
 *      JWT) is allowed ONLY in `services/*`, `apps/dashboard/app/(admin)/*`,
 *      admin API routes, and the public demo connect route that gates Retell
 *      token issuance before reserving sessions server-side.
 *   - `@requesthandoff/supabase-client-rls` (anon/user JWT) is the default
 *      everywhere else, including `apps/dashboard` non-admin routes.
 *
 * This ESLint rule is the belt to the suspenders that RLS already provides:
 * a copy-paste of a service-role import into an owner-facing route would
 * silently bypass RLS without it.
 */
export default [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["apps/dashboard/**/*.{ts,tsx}"],
    ignores: [
      "apps/dashboard/app/(admin)/**",
      "apps/dashboard/app/api/admin/**",
      "apps/dashboard/app/api/demo/**",
    ],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    rules: {
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            {
              target: "./apps/dashboard",
              from: "./packages/supabase-client-service",
              message:
                "supabase-client-service (service role / RLS bypass) is forbidden outside apps/dashboard/app/(admin)/* and services/*. Use supabase-client-rls instead.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["packages/schema/**/*.ts", "packages/supabase-client-rls/**/*.ts", "packages/supabase-client-service/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    rules: {
      // shared packages are stack-agnostic
    },
  },
];
