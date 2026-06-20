import {
  ButtonGroup,
  Flex,
  HStack,
  IconButton,
  Pagination,
  Portal,
  Select,
  Text,
  createListCollection,
} from "@chakra-ui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const itemCounts = createListCollection({
  items: [
    { label: "10", value: "10" },
    { label: "25", value: "25" },
    { label: "50", value: "50" },
  ],
});

interface PaginationControlsProps {
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function PaginationControls({
  total,
  page,
  limit,
  onPageChange,
  onLimitChange,
}: PaginationControlsProps) {
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit + 1;
  const endIndex = Math.min(page * limit, total);

  return (
    <>
      <Pagination.Root
        count={total}
        pageSize={limit}
        page={page}
        defaultPage={1}
        mt={6}
        as={Flex}
        flexDir={{ base: "column-reverse", lg: "row" }}
        alignItems={{ base: "start", lg: "center" }}
        justifyContent="space-between"
        gap={4}
        display={{ base: "none", md: "flex" }}
      >
        <Text fontSize="sm" color="fg.muted">
          Showing {startIndex} of {total} matters
        </Text>

        <ButtonGroup variant="outline" size="xs" flexWrap="wrap">
          <Pagination.PrevTrigger asChild>
            <IconButton
              onClick={() => onPageChange(Math.max(1, page - 1))}
              rounded="md"
              borderColor="border"
              color="fg"
              disabled={page === 1}
            >
              <ChevronLeft size={16} />
            </IconButton>
          </Pagination.PrevTrigger>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(
            (pageNum) => (
              <IconButton
                key={pageNum}
                rounded="md"
                borderColor="border"
                color={pageNum === page ? "brand.solid" : "fg"}
                bg={pageNum === page ? "rgba(186, 117, 23, 0.08)" : "transparent"}
                fontWeight={pageNum === page ? "600" : "400"}
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum}
              </IconButton>
            ),
          )}

          <Pagination.NextTrigger asChild>
            <IconButton
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              rounded="md"
              borderColor="border"
              color="fg"
              disabled={page === totalPages}
            >
              <ChevronRight size={16} />
            </IconButton>
          </Pagination.NextTrigger>
        </ButtonGroup>
      </Pagination.Root>

      <Pagination.Root
        count={total}
        pageSize={limit}
        page={page}
        defaultPage={1}
        display={{ base: "flex", md: "none" }}
        mt={6}
        as={Flex}
        flexDir="column"
        gap={4}
      >
        <HStack gap={4} justify="center">
          <Pagination.PrevTrigger asChild>
            <IconButton
              onClick={() => onPageChange(Math.max(1, page - 1))}
              variant="outline"
              rounded="md"
              borderColor="border"
              color="fg"
              disabled={page === 1}
            >
              <ChevronLeft size={16} />
            </IconButton>
          </Pagination.PrevTrigger>
          <Text fontSize="sm" color="fg.muted">
            {startIndex} of {total}
          </Text>
          <Pagination.NextTrigger asChild>
            <IconButton
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              variant="outline"
              rounded="md"
              borderColor="border"
              color="fg"
              disabled={page === totalPages}
            >
              <ChevronRight size={16} />
            </IconButton>
          </Pagination.NextTrigger>
        </HStack>

        <HStack gap={4} justify="center" flexWrap="wrap">
          <Text fontSize="sm" color="fg.muted">
            Items per page
          </Text>

          <Select.Root
            collection={itemCounts}
            size="xs"
            width="70px"
            value={[limit.toString()]}
            onValueChange={(value) =>
              onLimitChange(parseInt(value.value[0], 10))
            }
          >
            <Select.HiddenSelect />
            <Select.Control>
              <Select.Trigger rounded="md">
                <Select.ValueText placeholder="Select item count" />
              </Select.Trigger>
              <Select.IndicatorGroup>
                <Select.Indicator />
              </Select.IndicatorGroup>
            </Select.Control>
            <Portal>
              <Select.Positioner>
                <Select.Content rounded="md">
                  {itemCounts.items.map((itemCount) => (
                    <Select.Item
                      item={itemCount}
                      key={itemCount.value}
                      rounded="sm"
                    >
                      {itemCount.label}
                      <Select.ItemIndicator />
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Portal>
          </Select.Root>
        </HStack>
      </Pagination.Root>
    </>
  );
}
