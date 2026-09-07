import { useIntakeAnswers } from "@/hooks/use-case-questionnaire";
import { toInputValue } from "@/utils/answer-value";
import { Box, Flex, Spinner, Text } from "@chakra-ui/react";
import { useMemo } from "react";

/**
 * What the client said before the matter existed.
 *
 * Read-only on purpose. These answers are why the firm took the case, and they
 * were true as of the day they were given — editing them here would rewrite
 * the record of what was known at intake. Anything that has since changed
 * belongs in the case questionnaire, where it is asked again.
 */
export function IntakeAnswers({ caseId }: { caseId: string }) {
  const { data, isLoading } = useIntakeAnswers(caseId);

  // The API returns answers in section then question order, so grouping in one
  // pass preserves the order the client was asked in.
  const groups = useMemo(() => {
    const out: { title: string; answers: NonNullable<typeof data>["answers"] }[] =
      [];
    for (const answer of data?.answers ?? []) {
      const last = out[out.length - 1];
      if (last && last.title === answer.sectionTitle) {
        last.answers.push(answer);
      } else {
        out.push({ title: answer.sectionTitle, answers: [answer] });
      }
    }
    return out;
  }, [data]);

  if (isLoading) {
    return (
      <Flex justify="center" py={10}>
        <Spinner size="sm" />
      </Flex>
    );
  }

  if (!data || data.answers.length === 0) {
    return (
      <Box
        border="1px dashed"
        borderColor="border"
        borderRadius="md"
        px={5}
        py={8}
        textAlign="center"
      >
        <Text fontSize="13px" color="fg.muted">
          No intake questionnaire was answered for this matter. It may have been
          opened straight from a consultation.
        </Text>
      </Box>
    );
  }

  return (
    <Box>
      <Text fontSize="12px" color="fg.muted" mb={4} lineHeight="17px">
        Answered at intake
        {data.submittedAt
          ? ` on ${new Date(data.submittedAt).toLocaleDateString()}`
          : ""}
        . Kept as a record of what the firm knew when it opened the matter, so
        it cannot be edited here.
      </Text>

      {groups.map((group) => (
        <Box key={group.title} mb={5}>
          <Text
            fontSize="11px"
            fontWeight="500"
            color="fg.muted"
            textTransform="uppercase"
            letterSpacing="0.04em"
            mb={2}
          >
            {group.title}
          </Text>

          <Box borderTop="1px solid" borderColor="border">
            {group.answers.map((answer) => (
              <Flex
                key={answer.questionId}
                gap={4}
                py={2.5}
                borderBottom="1px solid"
                borderColor="border"
                direction={{ base: "column", md: "row" }}
              >
                <Text
                  fontSize="12px"
                  color="fg.muted"
                  flex={{ base: "none", md: "0 0 40%" }}
                  lineHeight="17px"
                >
                  {answer.label}
                </Text>
                <Text fontSize="13px" color="fg" flex={1} lineHeight="17px">
                  {display(answer.value)}
                </Text>
              </Flex>
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

/**
 * One answer, as a sentence rather than as its storage.
 *
 * Two kinds of array arrive here and they read completely differently: a
 * multi-select is a list of option strings, and a repeating answer is a list of
 * entry objects. `String(entry)` on the second gives "[object Object]", so the
 * two are told apart by what is in them — the same discrimination
 * `toInputValue` makes, for the same reason.
 */
function display(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((entry) =>
        typeof entry === "object" && entry !== null && !Array.isArray(entry)
          ? // One entry, as the values a person would read off it. Keys are
            // omitted: the question's own label already says what this is a
            // list of, and "street: 123 Main St, city: Brooklyn" reads worse
            // than the address does.
            Object.values(entry)
              .filter((cell) => cell != null && cell !== "")
              .join(", ")
          : String(entry),
      )
      .filter(Boolean)
      .join(" · ");
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return toInputValue(value) || "—";
}
