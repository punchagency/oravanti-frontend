import { useDocumentTitle } from "@/hooks/use-document-title";
import { Box, Flex, Grid, Text } from "@chakra-ui/react";
import { FilePlus2 } from "lucide-react";
import { useState } from "react";
import { DocumentTypeList } from "./components/document-type-list";
import { MotionToContinueForm } from "./components/motion-to-continue-form";
import { creatorGroups } from "./data";

const allTypes = creatorGroups.flatMap((group) => group.types);

/**
 * Forms are added one document type at a time; anything absent here falls back
 * to the "coming soon" panel, which is what `hasTemplate: false` marks in the
 * type list.
 */
const TEMPLATE_FORMS: Record<string, () => React.ReactElement> = {
  "motion-to-continue": MotionToContinueForm,
};

function CreatorPlaceholder({
  title,
  caption,
}: {
  title: string;
  caption: string;
}) {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      textAlign="center"
      minH="360px"
      gap="10px"
    >
      <Box color="fg.subtle">
        <FilePlus2 size={26} />
      </Box>
      <Text fontSize="16px" fontWeight="600" color="fg">
        {title}
      </Text>
      <Text fontSize="13px" color="fg.muted">
        {caption}
      </Text>
    </Flex>
  );
}

export function DocumentCreatorPage() {
  useDocumentTitle("Document creator");
  const [selected, setSelected] = useState<string | null>(null);

  const type = allTypes.find((t) => t.value === selected) ?? null;
  const TemplateForm = type ? TEMPLATE_FORMS[type.value] : undefined;

  return (
    <Box pt="24px" pb="56px">
      <Text textStyle="heading">Document creator</Text>
      <Text color="fg.muted" mt="2px" fontSize="14px">
        Generate legal documents, motions, and letters
      </Text>

      <Grid
        mt="20px"
        templateColumns={{ base: "1fr", lg: "280px 1fr" }}
        gap="20px"
        alignItems="start"
      >
        <DocumentTypeList selected={selected} onSelect={setSelected} />

        <Box
          bg="bg"
          border="1px solid"
          borderColor="border"
          borderRadius="10px"
          p="24px"
          minH="420px"
        >
          {!type ? (
            <CreatorPlaceholder
              title="Select a document type to begin"
              caption="Templates pre-fill from the case record"
            />
          ) : TemplateForm ? (
            <TemplateForm />
          ) : (
            <CreatorPlaceholder
              title={type.label}
              caption="Template for this document type — coming soon"
            />
          )}
        </Box>
      </Grid>
    </Box>
  );
}
