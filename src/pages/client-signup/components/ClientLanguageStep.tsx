import { Center, Field, Grid, Stack, Textarea } from "@chakra-ui/react";
import { type FieldErrors, type UseFormRegister, type UseFormSetValue, type UseFormWatch } from "react-hook-form";

interface ClientLanguageStepProps {
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
  errors: FieldErrors<any>;
  inputStyleProps: Record<string, any>;
}

export const ClientLanguageStep = ({
  register,
  setValue,
  watch,
  errors,
  inputStyleProps,
}: ClientLanguageStepProps) => {
  const selectedLang = watch("language");
  const languages = [
    "English",
    "Español",
    "Français",
    "Português",
    "中文",
    "Tiếng Việt",
    "한국어",
    "Русский",
  ];

  return (
    <Stack gap="5">
      <Field.Root invalid={!!errors.language}>
        <Field.Label textStyle="label" fontWeight="600" color="fg" mb="3">
          Select preferred language
        </Field.Label>

        <input
          type="hidden"
          {...register("language", {
            required: "Select your preferred language",
          })}
        />

        <Grid templateColumns="repeat(4, 1fr)" gap="2" w="full">
          {languages.map((lang) => {
            const isSelected = selectedLang === lang;
            return (
              <Center
                key={lang}
                as="button"
                onClick={() =>
                  setValue("language", lang, { shouldValidate: true })
                }
                h="10"
                borderWidth="1px"
                borderRadius="md"
                bg="bg"
                borderColor={isSelected ? "accent.portal" : "border"}
                color={isSelected ? "accent.portal" : "fg"}
                fontWeight={isSelected ? "500" : "400"}
                fontSize="13px"
                _hover={{
                  borderColor: isSelected
                    ? "accent.portal"
                    : "border.emphasized",
                }}
                transition="all 0.15s ease"
              >
                {lang}
              </Center>
            );
          })}
        </Grid>
        {errors.language && (
          <Field.ErrorText fontSize="12px" mt="2">
            {errors.language.message as string}
          </Field.ErrorText>
        )}
      </Field.Root>

      <Field.Root>
        <Field.Label textStyle="label" color="fg.muted" mb="1">
          Situation summary (optional)
        </Field.Label>
        <Textarea
          placeholder="e.g. My spouse and I are applying for a green card"
          h="16"
          fontSize="13px"
          {...register("summary")}
          {...inputStyleProps}
        />
        <Field.HelperText fontSize="12px" color="fg.subtle" mt="1">
          Helps the firm assign the right attorney.
        </Field.HelperText>
      </Field.Root>
    </Stack>
  );
};
