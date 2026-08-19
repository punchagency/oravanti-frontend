import { Center, Spinner } from "@chakra-ui/react";

/**
 * Loading fallback for pages that render without the dashboard chrome —
 * onboarding steps, auth callbacks, and anything else outside `AdminLayout`.
 *
 * `PageSkeleton` is wrong for these: a skeleton works by standing in for a
 * layout the reader already knows, and it reads as broken on a centred,
 * single-card page that looks nothing like a stack of grey bars. A spinner
 * simply says "waiting", which is all these pages need.
 *
 * Fills the viewport so it sits where the page's own content will appear
 * rather than jumping in from the top of an empty document.
 */
export function PageLoader() {
  return (
    <Center minH="100dvh" w="full" aria-busy="true" aria-label="Loading page">
      <Spinner size="lg" colorPalette="brand" borderWidth="2px" />
    </Center>
  );
}
