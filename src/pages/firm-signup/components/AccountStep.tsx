import {
  Field,
  Input,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import { type FieldErrors, type UseFormRegister } from "react-hook-form";

interface AccountStepProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  inputStyleProps: Record<string, any>;
}

export const AccountStep = ({
  register,
  errors,
  inputStyleProps,
}: AccountStepProps) => {
  return (
    <VStack gap="4" align="stretch">
      <SimpleGrid columns={{ base: 1, sm: 2 }} gap="4">
        <Field.Root invalid={!!errors.firstName}>
          <Field.Label textStyle="label" color="fg.muted" mb="1">
            First name
          </Field.Label>
          <Input
            placeholder="e.g. Jean"
            {...register("firstName", {
              required: "First name is required",
            })}
            {...inputStyleProps}
          />
          {errors.firstName && (
            <Field.ErrorText>
              {errors.firstName.message as string}
            </Field.ErrorText>
          )}
        </Field.Root>
        <Field.Root invalid={!!errors.lastName}>
          <Field.Label textStyle="label" color="fg.muted" mb="1">
            Last name
          </Field.Label>
          <Input
            placeholder="e.g. Chen"
            {...register("lastName", {
              required: "Last name is required",
            })}
            {...inputStyleProps}
          />
          {errors.lastName && (
            <Field.ErrorText>
              {errors.lastName.message as string}
            </Field.ErrorText>
          )}
        </Field.Root>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, sm: 2 }} gap="4">
        <Field.Root invalid={!!errors.workEmail}>
          <Field.Label textStyle="label" color="fg.muted" mb="1">
            Work email
          </Field.Label>
          <Input
            type="email"
            placeholder="e.g. jean@chenlaw.com"
            {...register("workEmail", {
              required: "Email is required",
              pattern: {
                value: /^\S+@\S+$/i,
                message: "Invalid email address",
              },
            })}
            {...inputStyleProps}
          />
          {errors.workEmail && (
            <Field.ErrorText>
              {errors.workEmail.message as string}
            </Field.ErrorText>
          )}
        </Field.Root>
        <Field.Root invalid={!!errors.phoneNumber}>
          <Field.Label textStyle="label" color="fg.muted" mb="1">
            Phone number
          </Field.Label>
          <Input
            placeholder="e.g. (555) 019-2834"
            {...register("phoneNumber", {
              required: "Phone number is required",
            })}
            {...inputStyleProps}
          />
          {errors.phoneNumber && (
            <Field.ErrorText>
              {errors.phoneNumber.message as string}
            </Field.ErrorText>
          )}
        </Field.Root>
      </SimpleGrid>

      <Field.Root invalid={!!errors.password}>
        <Field.Label textStyle="label" color="fg.muted" mb="1">
          Password
        </Field.Label>
        <Input
          type="password"
          placeholder="Choose a secure password"
          {...register("password", {
            required: "Password is required",
            minLength: {
              value: 6,
              message: "Must be at least 6 characters",
            },
          })}
          {...inputStyleProps}
        />
        {!errors.password ? (
          <Text textStyle="body-sm" color="fg.subtle" mt="1">
            Must be at least 6 characters
          </Text>
        ) : (
          <Field.ErrorText>
            {errors.password.message as string}
          </Field.ErrorText>
        )}
      </Field.Root>
    </VStack>
  );
};
