import { useColorMode } from "@/hooks/use-color-mode";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useSubmitDomain, useVerifyDomain } from "@/hooks/use-onboarding";
import { useAuthStore } from "@/store/auth-store";
import {
  domainSchema,
  type DomainInput,
} from "@/types/pages/onboarding/schema";
import {
  Box,
  Button,
  Center,
  Clipboard,
  Field,
  IconButton,
  Image,
  Input,
  Steps,
  Text,
  VStack,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";

type Phase = "input" | "verify";

export default function Step1DomainPage() {
  const { colorMode, toggleColorMode } = useColorMode();
  const [phase, setPhase] = useState<Phase>("input");
  const [dnsRecordName, setDnsRecordName] = useState("");
  const [dnsToken, setDnsToken] = useState("");

  const submitDomain = useSubmitDomain();
  const verifyDomain = useVerifyDomain();
  const organizationId = useAuthStore((s) => s.organizationId);
  const userEmail = useAuthStore((s) => s.user?.email ?? "");
  const defaultDomain = userEmail.includes("@") ? userEmail.split("@")[1] : "";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DomainInput>({
    resolver: zodResolver(domainSchema),
    defaultValues: { domain: defaultDomain },
  });

  useDocumentTitle("Domain setup - Oravanti");

  const onSubmit: SubmitHandler<DomainInput> = (data) => {
    submitDomain.mutate(data, {
      onSuccess: (res) => {
        setDnsRecordName(res.txtRecordName);
        setDnsToken(res.txtRecordValue);
        setPhase("verify");
      },
    });
  };

  const handleVerify = () => {
    if (!organizationId) return;
    verifyDomain.mutate({ organizationId });
  };

  return (
    <Box minH="100vh" bg="bg.subtle" position="relative">
      <Box position="absolute" top="4" right="4" zIndex="sticky">
        <IconButton
          onClick={toggleColorMode}
          variant="ghost"
          aria-label="Toggle color mode"
          borderRadius="full"
          color="fg.muted"
          _hover={{ bg: "bg.muted", color: "fg" }}
        >
          {colorMode === "light" ? (
            <svg
              stroke="currentColor"
              fill="none"
              strokeWidth="2"
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
              height="1.2em"
              width="1.2em"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg
              stroke="currentColor"
              fill="none"
              strokeWidth="2"
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
              height="1.2em"
              width="1.2em"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          )}
        </IconButton>
      </Box>

      <Center minH="100vh" padding={{ base: 4, sm: 6 }} py={{ base: 8, md: 4 }}>
        <Box
          layerStyle="surface-card"
          p={{ base: 5, md: 10 }}
          w="full"
          maxW="600px"
        >
          <Image
            src="/oravanti_logo.png"
            alt="Oravanti Logo"
            w={10}
            mx="auto"
            mb={2}
          />

          <Box textAlign="center" mb={4}>
            <Box
              display="inline-block"
              bg="brand.muted"
              px="3"
              py="1"
              borderRadius="sm"
              fontSize="xs"
              fontWeight="bold"
              color="brand.fg"
              letterSpacing="0.05em"
            >
              STEP 1 OF 4 &bull; ONBOARDING
            </Box>
          </Box>

          <Steps.Root step={0} count={4} variant="subtle" mb="8">
            <Steps.List>
              {[0, 1, 2, 3].map((i) => (
                <Steps.Item key={i} index={i} title="">
                  <Steps.Separator
                    bg={0 >= i ? "brand.solid" : "border.muted"}
                  />
                </Steps.Item>
              ))}
            </Steps.List>
          </Steps.Root>

          {phase === "input" ? (
            <>
              <Text textStyle="heading" color="fg" mb="1" textAlign="left">
                Add your firm domain
              </Text>
              <Text
                textStyle="subheadline"
                color="fg.muted"
                mb="8"
                textAlign="left"
              >
                Enter your law firm's root domain to verify ownership.
              </Text>

              <form onSubmit={handleSubmit(onSubmit)}>
                <VStack gap="6" align="stretch">
                  <Field.Root invalid={!!errors.domain} textAlign="left">
                    <Field.Label textStyle="label" color="fg.muted">
                      Domain name
                    </Field.Label>
                    <Input
                      id="domain"
                      type="text"
                      bg="bg.input"
                      borderColor="border.input"
                      focusRingColor="brand.focusRing"
                      placeholder="yourdomain.com"
                      size="lg"
                      disabled
                      {...register("domain")}
                    />
                    <Field.ErrorText>{errors.domain?.message}</Field.ErrorText>
                  </Field.Root>

                  <Button
                    type="submit"
                    loading={submitDomain.isPending}
                    layerStyle="brand-button"
                    size="lg"
                    w="full"
                    h="12"
                  >
                    Continue
                  </Button>
                </VStack>
              </form>
            </>
          ) : (
            <>
              <Text textStyle="heading" color="fg" mb="1" textAlign="left">
                Verify domain ownership
              </Text>
              <Text
                textStyle="subheadline"
                color="fg.muted"
                mb="6"
                textAlign="left"
              >
                Add the following TXT record to your domain's DNS settings, then
                click verify.
              </Text>

              <VStack gap="5" align="stretch">
                <Box
                  bg="bg.subtle"
                  p={4}
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor="border"
                >
                  <Text
                    textStyle="label"
                    color="fg.muted"
                    mb="2"
                    fontSize="xs"
                    textTransform="uppercase"
                    letterSpacing="0.05em"
                  >
                    DNS Record Name / Host
                  </Text>
                  <Text
                    fontFamily="mono"
                    fontSize="sm"
                    color="fg"
                    wordBreak="break-all"
                    mb={3}
                    bg="bg.input"
                    p={3}
                    borderRadius="sm"
                    borderWidth="1px"
                    borderColor="border.input"
                  >
                    {dnsRecordName}
                  </Text>
                  <Clipboard.Root value={dnsRecordName}>
                    <Clipboard.Trigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        color="fg"
                        borderColor="border"
                        _hover={{ bg: "bg.muted" }}
                      >
                        <Clipboard.Indicator copied={<Check size={14} />}>
                          <Copy size={14} />
                        </Clipboard.Indicator>
                        <Clipboard.ValueText ml={2} fontSize="sm">
                          Copy name
                        </Clipboard.ValueText>
                      </Button>
                    </Clipboard.Trigger>
                  </Clipboard.Root>
                </Box>

                <Box
                  bg="bg.subtle"
                  p={4}
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor="border"
                >
                  <Text
                    textStyle="label"
                    color="fg.muted"
                    mb="2"
                    fontSize="xs"
                    textTransform="uppercase"
                    letterSpacing="0.05em"
                  >
                    DNS TXT Record Value
                  </Text>
                  <Text
                    fontFamily="mono"
                    fontSize="sm"
                    color="fg"
                    wordBreak="break-all"
                    mb={3}
                    bg="bg.input"
                    p={3}
                    borderRadius="sm"
                    borderWidth="1px"
                    borderColor="border.input"
                  >
                    {dnsToken}
                  </Text>
                  <Clipboard.Root value={dnsToken}>
                    <Clipboard.Trigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        color="fg"
                        borderColor="border"
                        _hover={{ bg: "bg.muted" }}
                      >
                        <Clipboard.Indicator copied={<Check size={14} />}>
                          <Copy size={14} />
                        </Clipboard.Indicator>
                        <Clipboard.ValueText ml={2} fontSize="sm">
                          Copy value
                        </Clipboard.ValueText>
                      </Button>
                    </Clipboard.Trigger>
                  </Clipboard.Root>
                </Box>

                <Box
                  bg="bg.subtle"
                  p={4}
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor="border"
                >
                  <Text textStyle="label" color="fg" mb={1}>
                    How to add this record
                  </Text>
                  <VStack
                    gap={1}
                    align="stretch"
                    textStyle="body-sm"
                    color="fg.muted"
                  >
                    <Text>
                      1. Log into your domain provider (GoDaddy, Namecheap,
                      Cloudflare, etc.)
                    </Text>
                    <Text>2. Navigate to DNS settings for your domain</Text>
                    <Text>3. Add a new TXT record with the value above</Text>
                    <Text>
                      4. Wait a few minutes for propagation, then verify below
                    </Text>
                  </VStack>
                </Box>

                <Button
                  onClick={handleVerify}
                  loading={verifyDomain.isPending}
                  layerStyle="brand-button"
                  size="lg"
                  w="full"
                  h="12"
                >
                  Verify live
                </Button>
              </VStack>
            </>
          )}
        </Box>
      </Center>
    </Box>
  );
}
