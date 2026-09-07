import {
  Navigate,
  Route,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router";

import { PlatformLayout } from "@/components/layout/platform-layout";
import { RouteErrorBoundary } from "@/components/ui/error-boundary";
import { NotFoundPage } from "@/pages/not-found";
import { PlatformGuard } from "@/routers/platform/guard";
import { lazyPage } from "@/routers/lazy";

/**
 * Oravanti's own CRM.
 *
 * Everything here operates the *platform's* content — the form catalogue, the
 * field vocabulary, the PDF box mappings, the questionnaire backbone. A firm
 * never reaches this router: `AppRouter` picks it by account type and
 * `PlatformGuard` re-derives that, with `requirePlatformAdmin` on the server
 * as the check that actually matters.
 *
 * Routes are prefixed `/platform` even though this router owns the whole
 * origin while it is mounted, unlike the client portal which roots at `/`.
 * Two reasons: a bookmarked or pasted URL says which app it belongs to, and
 * `known-paths.ts` — which the *public* router consults to tell "a real route
 * behind login" from "no such page" — gets one prefix to recognise rather than
 * a list of generic words like `/forms` that the firm app might also want.
 */
const PlatformOverviewPage = lazyPage(() =>
  import("@/pages/platform").then((m) => ({ default: m.PlatformOverviewPage })),
);
const PlatformFormsPage = lazyPage(() =>
  import("@/pages/platform/forms").then((m) => ({
    default: m.PlatformFormsPage,
  })),
);
const PlatformFormDetailPage = lazyPage(() =>
  import("@/pages/platform/forms/form-detail").then((m) => ({
    default: m.PlatformFormDetailPage,
  })),
);
const PlatformPracticeAreasPage = lazyPage(() =>
  import("@/pages/platform/practice-areas").then((m) => ({
    default: m.PlatformPracticeAreasPage,
  })),
);
const PlatformPracticeAreaDetailPage = lazyPage(() =>
  import("@/pages/platform/practice-areas/practice-area-detail").then((m) => ({
    default: m.PlatformPracticeAreaDetailPage,
  })),
);
const PlatformSubcategoryDetailPage = lazyPage(() =>
  import("@/pages/platform/practice-areas/subcategory-detail").then((m) => ({
    default: m.PlatformSubcategoryDetailPage,
  })),
);
const PlatformCaseTypeDetailPage = lazyPage(() =>
  import("@/pages/platform/practice-areas/case-type-detail").then((m) => ({
    default: m.PlatformCaseTypeDetailPage,
  })),
);
const PlatformQuestionnairesPage = lazyPage(() =>
  import("@/pages/platform/questionnaires").then((m) => ({
    default: m.PlatformQuestionnairesPage,
  })),
);
const PlatformQuestionnaireDetailPage = lazyPage(() =>
  import("@/pages/platform/questionnaires/questionnaire-detail").then((m) => ({
    default: m.PlatformQuestionnaireDetailPage,
  })),
);

export function createPlatformRouter() {
  return createBrowserRouter(
    createRoutesFromElements(
      <Route errorElement={<RouteErrorBoundary />}>
        {/*
          An operator who follows a stale link to the sign-in page is already
          signed in — this router would not be mounted otherwise — so send them
          to the CRM rather than rendering a login form that has nothing to do.
        */}
        <Route path="/login" element={<Navigate to="/platform" replace />} />
        <Route path="/" element={<Navigate to="/platform" replace />} />

        <Route element={<PlatformGuard />}>
          <Route path="/platform" element={<PlatformLayout />}>
            <Route index element={<PlatformOverviewPage />} />

            {/* A form is addressed by its code, not by a database id: the code
                is what a person knows it by, and what every mapping is keyed
                on. A pasted `/platform/forms/I-485` is a working link. */}
            <Route path="forms" element={<PlatformFormsPage />} />
            <Route
              path="forms/:formCode"
              element={<PlatformFormDetailPage />}
            />

            {/*
                The taxonomy, walked one level at a time: practice area →
                subcategory → case type → what it files and what it asks.

                Subcategories and case types are addressed from the root rather
                than nested under their parent's path. A case type is reached
                from a search as often as from its parent, and a nested path
                would mean carrying two ids that the one id already determines
                — with nothing keeping them honest if they disagreed.
            */}
            <Route path="practice-areas" element={<PlatformPracticeAreasPage />} />
            <Route
              path="practice-areas/:practiceAreaId"
              element={<PlatformPracticeAreaDetailPage />}
            />
            <Route
              path="subcategories/:subcategoryId"
              element={<PlatformSubcategoryDetailPage />}
            />
            <Route
              path="case-types/:caseTypeId"
              element={<PlatformCaseTypeDetailPage />}
            />

            <Route
              path="questionnaires"
              element={<PlatformQuestionnairesPage />}
            />
            <Route
              path="questionnaires/:questionnaireId"
              element={<PlatformQuestionnaireDetailPage />}
            />

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/platform" replace />} />
      </Route>,
    ),
  );
}
