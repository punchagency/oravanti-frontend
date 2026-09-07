import { Box, Input, InputGroup, Text } from "@chakra-ui/react";
import { Search } from "lucide-react";

/**
 * Finding one field on a form of several hundred.
 *
 * The wiring views — field sources and PDF boxes — are lists of every field the
 * blank has, which on the I-485 is 512 of them across fourteen parts. Somebody
 * arriving at one of these has come to fix *one* field: a box that printed
 * blank, a question that fills the wrong thing. Without a search that means
 * guessing which part it lives in and reading down it, and the box names are
 * near enough alike that guessing goes wrong.
 *
 * Deliberately absent from the Contents views. Those are read and filled in the
 * form's own order, front to back, which is how the paper is checked — a filter
 * there would hide the fields you have not looked at yet.
 */
export function FormSearch({
  value,
  onChange,
  placeholder,
  matches,
  total,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  /** Fields the current query matches, for the count under the box. */
  matches: number;
  total: number;
}) {
  const isSearching = value.trim().length > 0;

  return (
    <Box mb={3}>
      <InputGroup startElement={<Search size={13} />}>
        <Input
          size="sm"
          fontSize="13px"
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </InputGroup>
      {isSearching && (
        <Text fontSize="11px" color="fg.muted" mt={1}>
          {matches} of {total} {total === 1 ? "field" : "fields"}
        </Text>
      )}
    </Box>
  );
}
