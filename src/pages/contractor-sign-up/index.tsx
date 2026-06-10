import { useColorMode } from "@/hooks/use-color-mode";
import {
  Box,
  Button,
  Heading,
  Icon,
  IconButton,
  Image,
  Link,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Briefcase, Building2, UserRound } from "lucide-react";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { Link as RouterLink } from "react-router";
import { ClientSignupFlow } from "../client-signup";
import { FirmSignupFlow } from "../firm-signup";
import { ContractorSignupPage } from "./contractor";

type UserRole = "firm" | "contractor" | "client";

export const SignUpPage = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const [role, setRole] = useQueryState("role");
  const [selectedRole, setSelectedRole] = useState<UserRole>("firm");

  const handleContinue = () => {
    if (selectedRole) {
      setRole(selectedRole);
    }
  };

  const roles = [
    {
      id: "firm" as UserRole,
      title: "Sign up as a firm",
      description: "Law firms and legal practices",
      icon: Building2,
      accentColor: "accent.admin",
    },
    {
      id: "contractor" as UserRole,
      title: "Sign up as a contractor",
      description: "Paralegals, interpreters, experts",
      icon: UserRound,
      accentColor: "accent.contractor",
    },
    {
      id: "client" as UserRole,
      title: "Sign up as a client",
      description: "Individuals seeking legal services",
      icon: Briefcase,
      accentColor: "accent.portal",
    },
  ];

  if (role === "firm") {
    return <FirmSignupFlow />;
  }

  if (role === "contractor") {
    return <ContractorSignupPage />;
  }

  if (role === "client") {
    return <ClientSignupFlow />;
  }

  return (
    <Box
      bg="bg.subtle"
      minH="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      px="4"
      py="8"
      position="relative"
    >
      {/* Absolute Color Mode Action Button Toggle */}
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
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
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
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          )}
        </IconButton>
      </Box>

      {/* Main Container Card Component Block */}
      <Box
        layerStyle="surface-card"
        p={{ base: "6", sm: "8", md: "12" }}
        maxWidth="3xl"
        width="100%"
        textAlign="center"
      >
        <Image
          src="oravanti_logo.png"
          alt="Oravanti Logo"
          w={10}
          mx={"auto"}
          mb={4}
        />

        <VStack gap="3" mb="8">
          <Heading as="h1" textStyle="heading">
            Welcome to Oravanti
          </Heading>
          <Text color="fg.muted" maxW="lg" textStyle="subheadline">
            The all-in-one platform for U.S. law firms, legal professionals, and
            their clients. Choose how you'd like to get started.
          </Text>
        </VStack>

        <SimpleGrid columns={{ base: 1, md: 3 }} gap="4" mb="8">
          {roles.map((role) => {
            const isSelected = selectedRole === role.id;
            return (
              <Box
                key={role.id}
                as="button"
                onClick={() => setSelectedRole(role.id)}
                textAlign="left"
                p="5"
                borderWidth="1px"
                borderRadius="lg"
                bg={"bg"}
                borderColor={isSelected ? role.accentColor : "border"}
                _hover={{
                  borderColor: isSelected
                    ? role.accentColor
                    : "border.emphasized",
                }}
                transition="all 0.2s cubic-bezier(0.2, 0.8, 0.4, 1)"
                outline="none"
                _focusVisible={{
                  ring: "2px",
                  ringColor: "brand.focusRing",
                  ringOffset: "2px",
                }}
                display="flex"
                flexDirection="column"
                alignItems="flex-start"
                width="100%"
              >
                <Box
                  color={role.accentColor}
                  bg="bg.subtle"
                  p="2"
                  borderRadius="sm"
                  display="inline-flex"
                  alignItems="center"
                  justifyContent="center"
                  mb="4"
                >
                  <Icon as={role.icon} boxSize="5" strokeWidth="1.75" />
                </Box>

                <Text textStyle="label" color="fg" mb="1">
                  {role.title}
                </Text>

                <Text textStyle="body-sm" color="fg.muted">
                  {role.description}
                </Text>
              </Box>
            );
          })}
        </SimpleGrid>

        <VStack gap="4">
          <Button
            onClick={handleContinue}
            layerStyle="brand-button"
            width={{ base: "full", sm: "280px" }}
            py="3"
            height="auto"
            textStyle="label"
            cursor="pointer"
          >
            Continue
          </Button>

          <Text textStyle="body-sm" fontWeight="500" as="button">
            Already have an account?{" "}
            <Link textDecoration={"underline"} color="brand.500" asChild>
              <RouterLink to="/login">Log in</RouterLink>
            </Link>
          </Text>
        </VStack>
      </Box>
    </Box>
  );
};
