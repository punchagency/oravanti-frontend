import {
  Box,
  Field,
  Flex,
  Grid,
  HStack,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import { type FieldErrors, type UseFormRegister } from "react-hook-form";

interface PaymentStepProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  inputStyleProps: Record<string, any>;
}

export const PaymentStep = ({
  register,
  errors,
  inputStyleProps,
}: PaymentStepProps) => {
  return (
    <VStack gap="4" align="stretch">
      <Box
        bg="brand.muted"
        p="4"
        borderRadius="md"
        borderWidth="1px"
        borderColor="brand.subtle"
      >
        <Flex justify="space-between" align="flex-start">
          <Box>
            <Text
              fontWeight="bold"
              color="brand.contrast"
              fontSize="sm"
            >
              Complete
            </Text>
            <Text textStyle="body-sm" color="brand.fg">
              Business
            </Text>
          </Box>
          <Text textStyle="body-sm" color="brand.fg">
            Contact for pricing
          </Text>
        </Flex>
        <HStack
          gap="1"
          mt="4"
          color="brand.fg"
          opacity="0.8"
          fontSize="10px"
        >
          <svg
            stroke="currentColor"
            fill="currentColor"
            strokeWidth="0"
            viewBox="0 0 24 24"
            height="1em"
            width="1em"
          >
            <path d="M12 2C9.243 2 7 4.243 7 7v3H6c-1.103 0-2 .897-2 2v8c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-8c0-1.103-.897-2-2-2h-1V7c0-2.757-2.243-5-5-5zM9 7c0-1.654 1.346-3 3-3s3 1.346 3 3v3H9V7zm9 13H6v-8h12v8z"></path>
          </svg>
          <Text>Billed annually. Cancel anytime.</Text>
        </HStack>
      </Box>

      <Field.Root invalid={!!errors.cardholderName}>
        <Field.Label textStyle="label" color="fg.muted" mb="1">
          Cardholder name
        </Field.Label>
        <Input
          placeholder="Name on card"
          {...register("cardholderName", {
            required: "Cardholder name is required",
          })}
          {...inputStyleProps}
        />
        {errors.cardholderName && (
          <Field.ErrorText>
            {errors.cardholderName.message as string}
          </Field.ErrorText>
        )}
      </Field.Root>

      <Field.Root invalid={!!errors.cardNumber}>
        <Field.Label textStyle="label" color="fg.muted" mb="1">
          Card number
        </Field.Label>
        <Input
          placeholder="1234 5678 9012 3456"
          {...register("cardNumber", {
            required: "Card number is required",
            pattern: {
              value: /^\d{16}$/,
              message: "Must be exactly 16 digits",
            },
          })}
          {...inputStyleProps}
        />
        {errors.cardNumber && (
          <Field.ErrorText>
            {errors.cardNumber.message as string}
          </Field.ErrorText>
        )}
      </Field.Root>

      <Grid templateColumns="2fr 1fr" gap="4">
        <Field.Root invalid={!!errors.expiryDate}>
          <Field.Label textStyle="label" color="fg.muted" mb="1">
            Expiry date
          </Field.Label>
          <Input
            placeholder="MM / YY"
            {...register("expiryDate", { required: "Required" })}
            {...inputStyleProps}
          />
          {errors.expiryDate && (
            <Field.ErrorText>
              {errors.expiryDate.message as string}
            </Field.ErrorText>
          )}
        </Field.Root>
        <Field.Root invalid={!!errors.cvv}>
          <Field.Label textStyle="label" color="fg.muted" mb="1">
            CVV
          </Field.Label>
          <Input
            placeholder="123"
            {...register("cvv", {
              required: "Required",
              maxLength: { value: 4, message: "Max 4 chars" },
            })}
            {...inputStyleProps}
          />
          {errors.cvv && (
            <Field.ErrorText>{errors.cvv.message as string}</Field.ErrorText>
          )}
        </Field.Root>
      </Grid>

      <Field.Root>
        <Field.Label textStyle="label" color="fg.muted" mb="1">
          Billing address (optional)
        </Field.Label>
        <Input
          placeholder="Billing address"
          {...register("billingAddress")}
          {...inputStyleProps}
        />
      </Field.Root>

      <HStack gap="1" color="fg.subtle" fontSize="11px" mt="1">
        <svg
          stroke="currentColor"
          fill="currentColor"
          strokeWidth="0"
          viewBox="0 0 24 24"
          height="1em"
          width="1em"
        >
          <path d="M12 2C9.243 2 7 4.243 7 7v3H6c-1.103 0-2 .897-2 2v8c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-8c0-1.103-.897-2-2-2h-1V7c0-2.757-2.243-5-5-5zM9 7c0-1.654 1.346-3 3-3s3 1.346 3 3v3H9V7zm9 13H6v-8h12v8z"></path>
        </svg>
        <Text>Secured with 256-bit SSL encryption</Text>
      </HStack>
    </VStack>
  );
};
