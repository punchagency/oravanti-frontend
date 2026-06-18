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
    { label: "5", value: "5" },
    { label: "10", value: "10" },
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
        <HStack gap={4} flexWrap="wrap">
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

          <Pagination.PageText format="long" fontSize="sm" color="fg.muted" />
        </HStack>

        <ButtonGroup variant="outline" size="xs" flexWrap="wrap">
          <Pagination.PrevTrigger asChild>
            <IconButton
              onClick={() => onPageChange(page - 1)}
              rounded="md"
              borderColor="border"
              color="fg"
            >
              <ChevronLeft size={16} />
            </IconButton>
          </Pagination.PrevTrigger>

          {Array.from({ length: Math.ceil(total / limit) }, (_, i) => i + 1).map(
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
              onClick={() => onPageChange(page + 1)}
              rounded="md"
              borderColor="border"
              color="fg"
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
              onClick={() => onPageChange(page - 1)}
              variant="outline"
              rounded="md"
              borderColor="border"
              color="fg"
            >
              <ChevronLeft size={16} />
            </IconButton>
          </Pagination.PrevTrigger>
          <Pagination.PageText format="long" fontSize="sm" color="fg.muted" />
          <Pagination.NextTrigger asChild>
            <IconButton
              onClick={() => onPageChange(page + 1)}
              variant="outline"
              rounded="md"
              borderColor="border"
              color="fg"
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
