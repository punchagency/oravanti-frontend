import { Box, Field, Grid, HStack, Input, Text } from "@chakra-ui/react";
import { Lock } from "lucide-react";
import { type FieldErrors, type UseFormRegister } from "react-hook-form";

interface ClientPersonalInfoStepProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  inputStyleProps: Record<string, any>;
}

export const ClientPersonalInfoStep = ({
  register,
  errors,
  inputStyleProps,
}: ClientPersonalInfoStepProps) => {
  return (
    <Grid templateColumns="repeat(1, 1fr)" gap="4">
      <Grid templateColumns={{ base: "1fr", sm: "1fr 1fr" }} gap="4">
        <Field.Root invalid={!!errors.firstName}>
          <Field.Label textStyle="label" mb="1" color="fg.muted">
            First name
          </Field.Label>
          <Input
            placeholder="e.g. Sofia"
            {...register("firstName", { required: "First name is required" })}
            {...inputStyleProps}
          />
          {errors.firstName && (
            <Field.ErrorText fontSize="12px" mt="1">
              {errors.firstName.message as string}
            </Field.ErrorText>
          )}
        </Field.Root>

        <Field.Root invalid={!!errors.lastName}>
          <Field.Label textStyle="label" mb="1" color="fg.muted">
            Last name
          </Field.Label>
          <Input
            placeholder="e.g. Ruiz"
            {...register("lastName", { required: "Last name is required" })}
            {...inputStyleProps}
          />
          {errors.lastName && (
            <Field.ErrorText fontSize="12px" mt="1">
              {errors.lastName.message as string}
            </Field.ErrorText>
          )}
        </Field.Root>
      </Grid>

      <Grid templateColumns={{ base: "1fr", sm: "1fr 1fr" }} gap="4">
        <Field.Root invalid={!!errors.email}>
          <Field.Label textStyle="label" mb="1" color="fg.muted">
            Email address
          </Field.Label>
          <Input
            type="email"
            placeholder="e.g. sofia@gmail.com"
            {...register("email", {
              required: "Valid email is required",
              pattern: {
                value: /\S+@\S+\.\S+/,
                message: "Valid email is required",
              },
            })}
            {...inputStyleProps}
          />
          {errors.email && (
            <Field.ErrorText fontSize="12px" mt="1">
              {errors.email.message as string}
            </Field.ErrorText>
          )}
        </Field.Root>

        <Field.Root invalid={!!errors.phone}>
          <Field.Label textStyle="label" mb="1" color="fg.muted">
            Phone number
          </Field.Label>
          <Input
            type="tel"
            placeholder="e.g. (555) 012-3456"
            {...register("phone", { required: "Phone is required" })}
            {...inputStyleProps}
          />
          {errors.phone && (
            <Field.ErrorText fontSize="12px" mt="1">
              {errors.phone.message as string}
            </Field.ErrorText>
          )}
        </Field.Root>
      </Grid>

      <Box
        p="3"
        bg="bg.subtle"
        border="1px solid"
        borderColor="border"
        borderRadius="md"
        mt="2"
      >
        <HStack gap="2" align="flex-start">
          <Box color="accent.portal" mt="0.5">
            <Lock size={14} />
          </Box>
          <Text
            textStyle="body-sm"
            fontSize="12px"
            color="fg.muted"
            lineHeight="1.4"
          >
            Your information is shared only with the law firm you engage with.
          </Text>
        </HStack>
      </Box>
    </Grid>
  );
};
