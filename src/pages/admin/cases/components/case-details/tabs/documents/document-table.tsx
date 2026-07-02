import {
  Badge,
  Box,
  HStack,
  IconButton,
  ScrollArea,
  Table,
  Text,
} from "@chakra-ui/react";
import { Download, Eye } from "lucide-react";
import { documentGroups } from "./data";

export function DocumentTable() {
  return (
    <Box
      border="1px solid"
      borderColor="border.muted"
      borderRadius="lg"
      overflow="hidden"
    >
      <ScrollArea.Root w="full" size="xs">
        <ScrollArea.Viewport>
          <ScrollArea.Content>
            <Table.Root size="sm" variant="line">
          <Table.Header>
            <Table.Row bg="bg.subtle">
              <Table.ColumnHeader
                textTransform="uppercase"
                fontSize="11px"
                fontWeight="500"
                color="fg.subtle"
                letterSpacing="0.44px"
                py={2.5}
                px={4}
              >
                Document
              </Table.ColumnHeader>
              <Table.ColumnHeader
                textTransform="uppercase"
                fontSize="11px"
                fontWeight="500"
                color="fg.subtle"
                letterSpacing="0.44px"
                py={2.5}
                px={4}
              >
                Type
              </Table.ColumnHeader>
              <Table.ColumnHeader
                textTransform="uppercase"
                fontSize="11px"
                fontWeight="500"
                color="fg.subtle"
                letterSpacing="0.44px"
                py={2.5}
                px={4}
              >
                Source
              </Table.ColumnHeader>
              <Table.ColumnHeader
                textTransform="uppercase"
                fontSize="11px"
                fontWeight="500"
                color="fg.subtle"
                letterSpacing="0.44px"
                py={2.5}
                px={4}
              >
                Uploaded
              </Table.ColumnHeader>
              <Table.ColumnHeader
                textTransform="uppercase"
                fontSize="11px"
                fontWeight="500"
                color="fg.subtle"
                letterSpacing="0.44px"
                py={2.5}
                px={4}
              >
                AI Review
              </Table.ColumnHeader>
              <Table.ColumnHeader
                textTransform="uppercase"
                fontSize="11px"
                fontWeight="500"
                color="fg.subtle"
                letterSpacing="0.44px"
                py={2.5}
                px={4}
              >
                Actions
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {documentGroups.flatMap((group) => [
              <Table.Row key={`section-${group.label}`} bg="bg.subtle">
                <Table.Cell
                  colSpan={6}
                  px={4}
                  py={2}
                  fontSize="11px"
                  fontWeight="500"
                  color="fg.subtle"
                  letterSpacing="0.44px"
                  textTransform="uppercase"
                >
                  {group.label}
                </Table.Cell>
              </Table.Row>,
              ...group.rows.map((doc) => (
                <Table.Row key={doc.name}>
                  <Table.Cell px={4} py={3.5}>
                    <Text fontSize="13px" color="fg" fontWeight="400">
                      {doc.name}
                    </Text>
                  </Table.Cell>
                  <Table.Cell px={4} py={3.5}>
                    <Text fontSize="13px" color="fg.muted">
                      {doc.type}
                    </Text>
                  </Table.Cell>
                  <Table.Cell px={4} py={3.5}>
                    <Text fontSize="13px" color="fg.muted">
                      {doc.source}
                    </Text>
                  </Table.Cell>
                  <Table.Cell px={4} py={3.5}>
                    <Text fontSize="13px" color="fg.muted">
                      {doc.uploaded}
                    </Text>
                  </Table.Cell>
                  <Table.Cell px={4} py={3.5}>
                    {doc.review && (
                      <Badge
                        size="xs"
                        borderRadius="full"
                        px={2}
                        py={0.5}
                        bg={doc.review.bg}
                        color={doc.review.color}
                        fontWeight="500"
                        fontSize="10px"
                        textTransform="none"
                      >
                        {doc.review.label}
                      </Badge>
                    )}
                  </Table.Cell>
                  <Table.Cell px={4} py={2.5}>
                    <HStack gap={1}>
                      {doc.actions.includes("download") && (
                        <IconButton
                          variant="ghost"
                          size="xs"
                          color="fg.muted"
                        >
                          <Download size={14} />
                        </IconButton>
                      )}
                      {doc.actions.includes("view") && (
                        <IconButton
                          variant="ghost"
                          size="xs"
                          color="fg.muted"
                        >
                          <Eye size={14} />
                        </IconButton>
                      )}
                    </HStack>
                  </Table.Cell>
                </Table.Row>
              )),
            ])}
          </Table.Body>
            </Table.Root>
          </ScrollArea.Content>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar orientation="horizontal" />
        <ScrollArea.Corner />
      </ScrollArea.Root>
    </Box>
  );
}
