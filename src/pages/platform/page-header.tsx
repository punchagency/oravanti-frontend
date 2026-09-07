import { Box, Flex, HStack, Text } from "@chakra-ui/react";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";

import { PageTitle } from "@/components/layout/shared/nav-context";

/**
 * The heading every page in the CRM opens with.
 *
 * ─── Why this is shared rather than typed out per page ──────────────────────
 *
 * It is the same heading the firm app uses — `StaffPageHeader` in
 * `src/pages/admin/staff-and-users/components/` is the reference: the 28px of
 * air above, the 22px title at weight 500, the 13px muted line under it. Every
 * platform page had written its own slightly different version of that, which
 * is how a tier ends up looking like a different product from the one it is
 * part of.
 *
 * ─── The trail belongs to the header, not to the page ───────────────────────
 *
 * It used to sit above as a separate `<Crumbs>` element on the taxonomy pages
 * and an `← All forms` link on the form page, each with its own margin — so the
 * three pages had three different amounts of air at the top and two different
 * ways of saying "up". Both are one prop now, and the 28px of top padding is on
 * the trail rather than the title, because whichever comes first is the thing
 * the page opens with.
 *
 * ─── What goes where, under the title ───────────────────────────────────────
 *
 * `children` first, then `description`. The identifiers — a code, a count, a
 * stage — belong against the name they identify; prose comes after. The other
 * order reads as though the description were a caption for the counts.
 *
 * ─── Search is a toolbar, not an action ─────────────────────────────────────
 *
 * `actions` is what acts on the *page* — New, Edit, Archive — and sits on the
 * title row. `toolbar` is what acts on the *list below*, which is search, and it
 * gets its own full-width row underneath.
 *
 * They were one row to begin with and it was wrong in both directions: the
 * search box and the button fought over the space left by a long title, and on
 * a phone a search field squeezed into what a 360px row has spare is three
 * characters wide. Separating them also puts the search where it belongs —
 * immediately above the thing it filters, rather than up beside a heading that
 * has nothing to do with it.
 *
 * The title row still stacks below `md`, because a long title and three
 * labelled buttons do not fit side by side either.
 */
export function PlatformPageHeader({
  trail,
  title,
  description,
  actions,
  toolbar,
  children,
}: {
  /** The way back up, innermost last. The current page is not in it. */
  trail?: Crumb[];
  title: ReactNode;
  /** One line on what the page is for. Skipped where the heading says it all. */
  description?: ReactNode;
  /** New, Edit, Archive — what acts on this page. Sits on the title row. */
  actions?: ReactNode;
  /** Search and filters for the list below. Gets its own row, full width. */
  toolbar?: ReactNode;
  /** Codes, counts, badges: what identifies this page, under its name. */
  children?: ReactNode;
}) {
  return (
    <Box pt="28px" pb="16px">
      {trail && trail.length > 0 && <Crumbs trail={trail} />}

      <Flex
        direction={{ base: "column", md: "row" }}
        justify="space-between"
        align={{ base: "stretch", md: "flex-start" }}
        gap={{ base: 3, md: 4 }}
      >
        <Box minW={0}>
          <PageTitle>
            <Text
              as="h1"
              m="0"
              color="fg"
              fontSize="22px"
              fontWeight="500"
              lineHeight="1.2"
            >
              {title}
            </Text>
          </PageTitle>

          {children && (
            <HStack gap={2} mt={2} flexWrap="wrap">
              {children}
            </HStack>
          )}

          {description && (
            <Text m="8px 0 0" color="fg.muted" fontSize="13px" maxW="70ch">
              {description}
            </Text>
          )}
        </Box>

        {actions && (
          <Flex
            gap={1}
            align="center"
            // `wrap` rather than a second breakpoint: the actions are a search
            // box and one to three buttons, and how many fit depends on how
            // long the labels are, not on the viewport.
            wrap="wrap"
            flexShrink={0}
            w={{ base: "full", md: "auto" }}
            justify={{ base: "flex-start", md: "flex-end" }}
            // Nudged down so a row of small buttons reads as level with a 22px
            // title rather than hanging off its cap height.
            mt={{ base: 0, md: "2px" }}
          >
            {actions}
          </Flex>
        )}
      </Flex>

      {toolbar && (
        <Flex gap={2} align="center" wrap="wrap" mt={4}>
          {toolbar}
        </Flex>
      )}
    </Box>
  );
}

export type Crumb = { label: string; to: string };

/**
 * Where you are in the tree, and the way back up.
 *
 * Four levels deep is enough that the browser's Back button stops being an
 * answer — an operator who reached a case type through a search wants to get to
 * its siblings, not to their own history. Each level is a link because each
 * level is a real page.
 *
 * Rendered only through `PlatformPageHeader`, which is what keeps the air above
 * it the same on every page.
 */
function Crumbs({ trail }: { trail: Crumb[] }) {
  return (
    <HStack gap={1.5} mb={3} fontSize="12px" color="fg.muted" wrap="wrap">
      {trail.map((crumb, index) => (
        <HStack key={crumb.to} gap={1.5}>
          {index > 0 && <ChevronRight size={12} />}
          <Link to={crumb.to}>
            <Text
              _hover={{ color: "fg", textDecoration: "underline" }}
              truncate
              maxW="28ch"
            >
              {crumb.label}
            </Text>
          </Link>
        </HStack>
      ))}
    </HStack>
  );
}

/**
 * The heading over a list inside a page — Case types, Contents, Filing package.
 *
 * A smaller version of the same shape, and shared for the same reason: six
 * pages had each written a `Flex justify="space-between"` with a search box and
 * a New button in it, and every one of them squashed the search box on a phone
 * because a two-item row has nowhere to go. This one stacks below `sm`.
 *
 * It is a `h2` because it is one — the page has a single `h1` above it, and a
 * screen reader announcing "Case types, heading level 2" is the whole outline.
 */
export function PlatformSectionHeader({
  title,
  description,
  actions,
  toolbar,
}: {
  title: ReactNode;
  description?: ReactNode;
  /** What acts on the section — New, mostly. Sits on the title row. */
  actions?: ReactNode;
  /** Search for the list below. Its own full-width row, same as the page header. */
  toolbar?: ReactNode;
}) {
  return (
    <Box mb={4}>
      <Flex
        direction={{ base: "column", sm: "row" }}
        justify="space-between"
        align={{ base: "stretch", sm: "center" }}
        gap={{ base: 2.5, sm: 3 }}
      >
        <Box minW={0}>
          <Text as="h2" m="0" fontSize="13px" fontWeight="600" color="fg">
            {title}
          </Text>
          {description && (
            <Text
              fontSize="12px"
              color="fg.muted"
              lineHeight="17px"
              mt={0.5}
              maxW="70ch"
            >
              {description}
            </Text>
          )}
        </Box>

        {actions && (
          <Flex
            gap={2}
            align="center"
            wrap="wrap"
            flexShrink={0}
            w={{ base: "full", sm: "auto" }}
          >
            {actions}
          </Flex>
        )}
      </Flex>

      {toolbar && (
        <Flex gap={2} align="center" wrap="wrap" mt={3}>
          {toolbar}
        </Flex>
      )}
    </Box>
  );
}
