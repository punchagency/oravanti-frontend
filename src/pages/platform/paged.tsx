import {
  Box,
  HStack,
  Input,
  InputGroup,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { Search } from "lucide-react";

import { PaginationControls } from "@/components/ui/pagination-controls";
import type { PagedList } from "./use-paged-list";

/*
  The list chrome the CRM repeats: a search box, a pager, and the two things a
  list shows instead of rows. Page *state* lives in `use-paged-list.ts` — see
  the note there for why the two are apart.
*/

export function SearchBox({
  list,
  placeholder,
}: {
  list: PagedList;
  placeholder: string;
}) {
  return (
    <InputGroup
      startElement={<Search size={13} />}
      // Grows to fill a phone-width row and caps at 320px beside a heading.
      // A fixed width here is what makes a stacked header look like a mistake.
      flex="1 1 180px"
      maxW={{ base: "none", md: "320px" }}
    >
      <Input
        size="sm"
        fontSize="13px"
        placeholder={placeholder}
        value={list.search}
        onChange={(event) => list.setSearch(event.target.value)}
      />
    </InputGroup>
  );
}

/**
 * The footer, shown only when there is more than one page of anything.
 *
 * A pager under three rows is furniture that says "there is more" when there
 * is not.
 */
export function PagedFooter({
  list,
  total,
}: {
  list: PagedList;
  total: number;
}) {
  if (total <= list.limit) return null;

  return (
    <Box mt={4}>
      <PaginationControls
        total={total}
        currentPage={list.page}
        limit={list.limit}
        onPageChange={list.setPage}
        onLimitChange={list.setLimit}
      />
    </Box>
  );
}

/**
 * What a list shows instead of rows.
 *
 * One component for both states because they are one decision — a list is
 * loading, empty, or neither — and splitting it is how a page ends up
 * rendering "Nothing here" for a moment before its first row arrives.
 */
export function ListState({
  isLoading,
  isEmpty,
  empty,
}: {
  isLoading: boolean;
  isEmpty: boolean;
  empty: string;
}) {
  if (isLoading) {
    return (
      <HStack gap={2} py={6}>
        <Spinner size="sm" />
        <Text fontSize="13px" color="fg.muted">
          Loading…
        </Text>
      </HStack>
    );
  }

  if (isEmpty) {
    return (
      <Text fontSize="13px" color="fg.muted" py={6}>
        {empty}
      </Text>
    );
  }

  return null;
}
