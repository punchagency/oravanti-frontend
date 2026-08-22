import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      /*
        A leading underscore marks a binding that is deliberately unused —
        a prop accepted to satisfy an interface, a discarded tuple slot.
        Without this the convention is silently wrong and the author's
        intent reads as an oversight.
      */
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],

      /*
        Debt held at "warn" with a known ceiling rather than suppressed.
        Each is scheduled, not forgotten:

        no-explicit-any (43)      — most of these live in the hand-written
                                    API layer and disappear when Phase 4
                                    generates types from OpenAPI. Flip to
                                    "error" at the end of that phase.
        set-state-in-effect (4)   — "sync state when a dialog opens / data
                                    arrives". Not bugs, but each rewrite is
                                    a behaviour risk, so they want a focused
                                    pass with tests in place (P0.4). One of
                                    the four is in consultation-view.tsx,
                                    which Phase 5 deletes outright.
        purity (1)                — Date.now() during render in my-tasks.
                                    Correct fix is a ticking clock value,
                                    not a one-line edit.

        These counts are the ceiling. If a number goes up, the gate should
        be treated as broken even though CI stays green.
      */
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
    },
  },
]);
