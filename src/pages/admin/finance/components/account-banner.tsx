import { formatCurrency } from "@/utils/currency";
import { Flex, Grid, Text } from "@chakra-ui/react";
import { Landmark, ShieldCheck } from "lucide-react";

/**
 * The two-up account banner on the Invoicing tab: the firm's own revenue
 * beside the client money it merely holds.
 *
 * `trustTotal` is null when the caller has no IOLTA access — the panel is
 * hidden entirely rather than showing $0.00, which would read as "no client
 * funds held" instead of "you cannot see this".
 */
export function AccountBanner({
  operatingTotal,
  trustTotal,
}: {
  operatingTotal: number;
  trustTotal: number | null;
}) {
  const trustVisible = trustTotal !== null;

  return (
    <Grid
      templateColumns={{ base: "1fr", md: trustVisible ? "1fr 1fr" : "1fr" }}
      gap="0"
      mt="20px"
      borderRadius="10px"
      overflow="hidden"
      border="1px solid"
      borderColor="border"
    >
      <Flex
        align="center"
        gap="14px"
        p="16px 20px"
        bg="#f5f3fd"
        _dark={{ bg: "rgba(106, 92, 199, 0.14)" }}
      >
        <Flex
          w="34px"
          h="34px"
          borderRadius="8px"
          align="center"
          justify="center"
          bg="#ece9fb"
          color="#6a5cc7"
          flexShrink={0}
        >
          <Landmark size={17} />
        </Flex>
        <Flex direction="column" minW={0}>
          <Text
            fontSize="11px"
            fontWeight="700"
            letterSpacing="0.06em"
            color="#6a5cc7"
          >
            OPERATING ACCOUNT
          </Text>
          <Text fontSize="13px" color="fg.muted" truncate>
            Attorney fees &amp; legal services — firm revenue
          </Text>
        </Flex>
        <Flex direction="column" align="flex-end" ml="auto" flexShrink={0}>
          <Text fontSize="19px" fontWeight="700" color="#6a5cc7">
            {formatCurrency(operatingTotal)}
          </Text>
          <Text fontSize="11px" color="fg.muted">
            total invoiced
          </Text>
        </Flex>
      </Flex>

      {trustVisible && (
        <Flex
          align="center"
          gap="14px"
          p="16px 20px"
          bg="#f1faf5"
          _dark={{ bg: "rgba(46, 158, 107, 0.14)" }}
          borderLeft={{ base: "none", md: "1px solid" }}
          borderTop={{ base: "1px solid", md: "none" }}
          borderColor="border"
        >
          <Flex
            w="34px"
            h="34px"
            borderRadius="8px"
            align="center"
            justify="center"
            bg="#daf3e6"
            color="#2e9e6b"
            flexShrink={0}
          >
            <ShieldCheck size={17} />
          </Flex>
          <Flex direction="column" minW={0}>
            <Text
              fontSize="11px"
              fontWeight="700"
              letterSpacing="0.06em"
              color="#2e9e6b"
            >
              TRUST ACCOUNT (IOLTA)
            </Text>
            <Text fontSize="13px" color="fg.muted" truncate>
              Filing fees held in trust — client funds
            </Text>
          </Flex>
          <Flex direction="column" align="flex-end" ml="auto" flexShrink={0}>
            <Text fontSize="19px" fontWeight="700" color="#2e9e6b">
              {formatCurrency(trustTotal)}
            </Text>
            <Text fontSize="11px" color="fg.muted">
              held in trust
            </Text>
          </Flex>
        </Flex>
      )}
    </Grid>
  );
}
