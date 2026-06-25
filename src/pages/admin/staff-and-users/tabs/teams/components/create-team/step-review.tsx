import type { StaffMemberDTO } from "@/hooks/use-staff-list";
import type { PublicPracticeArea } from "@/pages/contractor-sign-up/types";
import {
  Flex,
  HStack,
  Separator,
  Stack,
  Tag,
  Text,
  VStack,
} from "@chakra-ui/react";
import type { CreateTeamFormValues } from "./types";

export function StepReview({
  formValues,
  practiceAreasList,
  allStaff,
  leadName,
}: {
  formValues: CreateTeamFormValues;
  practiceAreasList: PublicPracticeArea[];
  allStaff: StaffMemberDTO[];
  leadName: string | null;
}) {
  return (
    <VStack align="stretch" gap="20px">
      <Stack
        bg="bg.muted"
        p={{ base: "16px", sm: "20px" }}
        borderRadius="12px"
        border="1px solid"
        borderColor="border.muted"
        gap="0"
      >
        <Flex
          justify="space-between"
          align="center"
          py="14px"
          _first={{ pt: "4px" }}
        >
          <Text
            fontSize="11px"
            fontWeight="700"
            color="fg.subtle"
            letterSpacing="0.05em"
          >
            TEAM NAME
          </Text>
          <Text fontSize="14px" fontWeight="700" color="fg.default">
            {formValues.teamName || "—"}
          </Text>
        </Flex>

        {formValues.description && (
          <>
            <Separator borderColor="border.muted" />
            <Flex justify="space-between" align="center" py="14px">
              <Text
                fontSize="11px"
                fontWeight="700"
                color="fg.subtle"
                letterSpacing="0.05em"
              >
                DESCRIPTION
              </Text>
              <Text
                fontSize="13px"
                color="fg.muted"
                textAlign="right"
                maxW="60%"
              >
                {formValues.description}
              </Text>
            </Flex>
          </>
        )}

        <Separator borderColor="border.muted" />

        <Flex justify="space-between" align="center" py="14px">
          <Text
            fontSize="11px"
            fontWeight="700"
            color="fg.subtle"
            letterSpacing="0.05em"
          >
            PRACTICE AREAS
          </Text>
          <HStack
            gap="6px"
            flexWrap="wrap"
            justifyContent="flex-end"
          >
            {formValues.practiceAreas?.length > 0 ? (
              formValues.practiceAreas.map((practiceAreaId) => {
                const practiceArea = practiceAreasList.find(
                  (area) => area.id === practiceAreaId,
                );
                return (
                  <Tag.Root
                    key={practiceAreaId}
                    colorPalette="brand"
                    variant="subtle"
                    size="sm"
                  >
                    <Tag.Label>
                      {practiceArea?.name || practiceAreaId}
                    </Tag.Label>
                  </Tag.Root>
                );
              })
            ) : (
              <Text fontSize="14px" color="fg.subtle">
                —
              </Text>
            )}
          </HStack>
        </Flex>

        <Separator borderColor="border.muted" />

        <Flex justify="space-between" align="center" py="14px">
          <Text
            fontSize="11px"
            fontWeight="700"
            color="fg.subtle"
            letterSpacing="0.05em"
          >
            TEAM LEAD
          </Text>
          <Text fontSize="14px" fontWeight="700" color="fg.default">
            {leadName || "Not Set"}
          </Text>
        </Flex>

        <Separator borderColor="border.muted" />

        <Flex justify="space-between" align="center" py="14px">
          <Text
            fontSize="11px"
            fontWeight="700"
            color="fg.subtle"
            letterSpacing="0.05em"
          >
            MAX CASELOAD
          </Text>
          <Text fontSize="14px" fontWeight="700" color="fg.default">
            {formValues.maxCaseload || "0"} cases
          </Text>
        </Flex>

        <Separator borderColor="border.muted" />

        <Stack gap="6px" py="14px" _last={{ pb: "4px" }}>
          <Text
            fontSize="11px"
            fontWeight="700"
            color="fg.subtle"
            letterSpacing="0.05em"
          >
            MEMBERS ({formValues.memberIds?.length || 0} STAFF)
          </Text>
          <Text fontSize="13px" color="fg.muted">
            {formValues.memberIds?.length > 0
              ? formValues.memberIds
                  .map((id) => {
                    const staffMember = allStaff.find(
                      (member) => member.id === id,
                    );
                    return staffMember
                      ? `${staffMember.firstName} ${staffMember.lastName}`
                      : null;
                  })
                  .filter(Boolean)
                  .join(", ")
              : "None selected"}
          </Text>
        </Stack>
      </Stack>

      <HStack gap="8px" align="start" px="4px">
        <Text fontSize="13px" color="fg.subtle" mt="1px">
          ⓘ
        </Text>
        <Text fontSize="12px" color="fg.subtle" lineHeight="1.5">
          The team lead will be notified. Each member's individual
          caseload cap still applies.
        </Text>
      </HStack>
    </VStack>
  );
}
