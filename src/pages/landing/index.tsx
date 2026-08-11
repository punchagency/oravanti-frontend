import { Box, Button, Flex, Heading, Text } from "@chakra-ui/react";
import { Link } from "react-router";

export default function LandingPage() {
  return (
    <Box minH="100vh" bg="bg">
      {/* Nav */}
      <Flex
        align="center"
        justify="space-between"
        px={{ base: "20px", md: "40px" }}
        h="64px"
        borderBottom="1px solid"
        borderColor="border"
      >
        <Flex align="center" gap="8px">
          <img src="/oravanti_logo.png" alt="Oravanti" height="24px" />
          <Text textStyle="label" fontWeight="600" color="fg">
            Oravanti
          </Text>
        </Flex>
        <Flex gap="3">
          <Button asChild variant="ghost" size="sm" color="fg.muted">
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild layerStyle="brand-button" size="sm">
            <Link to="/signup">Get started</Link>
          </Button>
        </Flex>
      </Flex>

      {/* Hero */}
      <Flex
        direction="column"
        align="center"
        textAlign="center"
        px="20px"
        pt={{ base: "80px", md: "120px" }}
        pb="80px"
        maxW="800px"
        mx="auto"
      >
        <Heading size="2xl" fontWeight="700" color="fg" mb="6">
          Legal practice
          <br />
          management, simplified.
        </Heading>
        <Text fontSize="18px" color="fg.muted" mb="8" maxW="600px">
          Oravanti helps law firms manage cases, clients, and compliance
          — all in one place.
        </Text>
        <Flex gap="3">
          <Button asChild layerStyle="brand-button" size="lg">
            <Link to="/signup">Start free trial</Link>
          </Button>
          <Button asChild variant="outline" size="lg" color="fg">
            <Link to="/login">Sign in</Link>
          </Button>
        </Flex>
      </Flex>

      {/* Footer */}
      <Flex
        justify="center"
        py="24px"
        borderTop="1px solid"
        borderColor="border"
      >
        <Text fontSize="13px" color="fg.subtle">
          &copy; {new Date().getFullYear()} Oravanti. All rights reserved.
        </Text>
      </Flex>
    </Box>
  );
}
