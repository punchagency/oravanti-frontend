import { Button, Center, Heading, Text, VStack } from "@chakra-ui/react";
import { useNavigate } from "react-router";

export const ClientSuccessStep = () => {
  const navigate = useNavigate();
  const handlePortalRedirect = () => {
    navigate("/dashboard");
  };

  return (
    <Center py={{ base: 6, md: 10 }} w="full">
      <VStack gap="6" textAlign="center" maxW="480px" w="full">
        <Center
          bg="blue.50"
          _dark={{ bg: "blue.950" }}
          color="blue.500"
          w="14"
          h="14"
          borderRadius="full"
        >
          <svg
            stroke="currentColor"
            fill="none"
            strokeWidth="2"
            viewBox="0 0 24 24"
            strokeLinecap="round"
            strokeLinejoin="round"
            height="1.8em"
            width="1.8em"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h9"></path>
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
            <path d="m16 19 2 2 4-4"></path>
          </svg>
        </Center>

        <VStack gap="2">
          <Heading
            as="h2"
            fontSize="24px"
            fontWeight="500"
            color="fg"
            letterSpacing="tight"
          >
            Enquiry received
          </Heading>
          <Text
            fontSize="14px"
            color="fg.muted"
            lineHeight="1.6"
            px={{ base: 2, sm: 6 }}
          >
            The firm will contact you within 1-2 business days. No payment
            required yet.
          </Text>
        </VStack>

        <Button
          onClick={handlePortalRedirect}
          type="button"
          layerStyle="brand-button"
          w="full"
          maxW="260px"
          h="11"
          fontSize="14px"
          fontWeight="500"
          mt="2"
        >
          Go to my portal
        </Button>
      </VStack>
    </Center>
  );
};
