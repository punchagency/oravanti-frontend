import { useVerifyQRCode } from "@/hooks/useVerifyQRCode";
import {
  Box,
  Button,
  Clipboard,
  Field,
  Fieldset,
  Input,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { QRCode } from "react-qr-code";
import { z } from "zod";

const qrSchema = z.object({
  token: z.string().length(6, "Code must be 6 digits").trim(),
});

type TwoFactorData = {
  totpURI: string;
  backupCodes: string[];
};

type QrForm = z.infer<typeof qrSchema>;

export function QRCodeVerify({
  totpURI,
  backupCodes,
  onDone,
}: TwoFactorData & { onDone: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<QrForm>({
    resolver: zodResolver(qrSchema),
    defaultValues: { token: "" },
  });

  const {
    mutate: verifyQRCode,
    isPending: isVerifyingQRCode,
    isSuccess: successfullyVerified,
  } = useVerifyQRCode();

  const handleQrCode = (data: QrForm) => {
    verifyQRCode(data);
  };

  if (successfullyVerified) {
    return (
      <>
        <Text color="fg.muted" pb={2} fontSize="sm">
          Save these backup codes in a safe place. You can use them to access
          your account.
        </Text>

        <Clipboard.Root value={backupCodes.join("\n")} mt={4}>
          <Clipboard.Trigger asChild>
            <Button variant="surface" size="xs">
              <Clipboard.Indicator />
              Copy codes
            </Button>
          </Clipboard.Trigger>
        </Clipboard.Root>

        <SimpleGrid
          columns={{ base: 1, md: 2 }}
          gap={3}
          my={8}
          width="full"
          maxW="md"
        >
          {backupCodes.map((code, index) => (
            <Text key={index} fontFamily="mono" fontSize="sm">
              {code}
            </Text>
          ))}
        </SimpleGrid>

        <Button variant="outline" onClick={onDone}>
          Done
        </Button>
      </>
    );
  }

  return (
    <VStack gap={4} alignItems="start" w="full">
      <Text color="fg.muted">
        Scan this QR code with your authenticator app and enter the code below:
      </Text>

      <form onSubmit={handleSubmit(handleQrCode)}>
        <Fieldset.Root>
          <Fieldset.Content>
            <VStack
              gap="4"
              width="full"
              maxW={{ md: "md" }}
              align="start"
              w="full"
            >
              <Field.Root invalid={"token" in errors}>
                <Field.Label>
                  Code
                  <Field.RequiredIndicator />
                </Field.Label>
                <Input {...register("token")} w="full" />
                <Field.ErrorText>{errors.token?.message}</Field.ErrorText>
              </Field.Root>

              <Button
                layerStyle="brand-button"
                size="md"
                mt="2"
                width={{ base: "full", md: "auto" }}
                type="submit"
                loading={isVerifyingQRCode}
              >
                Submit Code
              </Button>
            </VStack>
          </Fieldset.Content>
        </Fieldset.Root>
      </form>

      <Box
        p={3}
        bg="white"
        width="fit-content"
        mt={4}
        rounded="md"
        borderWidth={1}
        borderColor="border.muted"
      >
        <QRCode size={256} value={totpURI} />
      </Box>
    </VStack>
  );
}
