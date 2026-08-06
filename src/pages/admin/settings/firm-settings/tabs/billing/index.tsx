import {
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  Input,
  Separator,
  Text,
} from "@chakra-ui/react";
import { CheckCircle, CreditCard, Download } from "lucide-react";
import { useState } from "react";

const PLAN_FEATURES = [
  "Unlimited cases",
  "All 8 add-ons",
  "Priority support",
  "White-label portal",
  "API access",
  "Advanced analytics",
  "Custom roles",
  "Audit logs",
];

const ADDONS = [
  { name: "Immigration", color: "specialty.immigration.text", active: true },
  { name: "Family law", color: "specialty.family.text", active: true },
  { name: "Business", color: "specialty.business.text", active: true },
  { name: "Estate planning", color: "specialty.estate.text", active: true },
  { name: "Employment", color: "specialty.employment.text", active: false },
  { name: "Real estate", color: "specialty.realestate.text", active: false },
  { name: "Criminal defense", color: "specialty.criminal.text", active: false },
  { name: "Personal injury", color: "specialty.personalinjury.text", active: false },
];

function Card({ children }: { children: React.ReactNode }) {
  return (
    <Box
      border="1px solid"
      borderColor="border"
      borderRadius="10px"
      bg="bg"
      overflow="hidden"
    >
      {children}
    </Box>
  );
}

function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <Flex
      align="flex-start"
      justify="space-between"
      gap="4"
      p="20px"
      borderBottom="1px solid"
      borderColor="border.subtle"
    >
      <Box>
        <Text fontSize="16px" fontWeight="600" color="fg">
          {title}
        </Text>
        {subtitle && (
          <Text fontSize="13px" color="fg.muted" mt="1">
            {subtitle}
          </Text>
        )}
      </Box>
      {action}
    </Flex>
  );
}

export default function BillingTab() {
  const [billingContact, setBillingContact] = useState("Rachel Abubakar");
  const [billingEmail, setBillingEmail] = useState(
    "billing@chenassociates.com",
  );

  const activeCount = ADDONS.filter((a) => a.active).length;

  return (
    <Box display="flex" flexDirection="column" gap="6">
      {/* Subscription */}
      <Card>
        <CardHeader title="Subscription" />
        <Box p="20px">
          <Box
            border="1px solid"
            borderColor="brand.solid"
            borderRadius="8px"
            bg="brand.subtle"
            p="16px"
            mb="5"
          >
            <Flex
              justify="space-between"
              align={{ base: "start", md: "center" }}
              direction={{ base: "column", md: "row" }}
              gap="3"
            >
              <Box>
                <Text fontSize="18px" fontWeight="600" color="brand.solid">
                  Complete
                </Text>
                <Text fontSize="13px" color="fg.muted" mt="1">
                  Annual billing · Renews Jan 1, 2027
                </Text>
              </Box>
              <Button variant="outline" size="sm" color="fg" alignSelf={{ base: "start", md: "center" }}>
                Change plan
              </Button>
            </Flex>
          </Box>

          <Flex gap="4" flexWrap="wrap">
            {PLAN_FEATURES.map((f) => (
              <Flex key={f} align="center" gap="2" minW="140px">
                <CheckCircle size={14} color="var(--chakra-colors-brand-solid)" />
                <Text fontSize="13px" color="fg">
                  {f}
                </Text>
              </Flex>
            ))}
          </Flex>
        </Box>
      </Card>

      {/* Active add-ons */}
      <Card>
        <CardHeader
          title="Active add-ons"
          subtitle={`${activeCount} of ${ADDONS.length} add-ons active on Complete plan`}
        />
        <Box p="20px">
          <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="3">
            {ADDONS.map((addon) => (
              <Flex
                key={addon.name}
                align="center"
                justify="space-between"
                border="1px solid"
                borderColor="border"
                borderRadius="8px"
                px="14px"
                py="10px"
              >
                <Flex align="center" gap="2">
                  <Box boxSize="8px" borderRadius="full" bg={addon.color} />
                  <Text fontSize="13px" color="fg" fontWeight="500">
                    {addon.name}
                  </Text>
                </Flex>
                {addon.active ? (
                  <Badge size="sm" variant="subtle">
                    Active
                  </Badge>
                ) : (
                  <Text fontSize="13px" color="fg.muted">
                    –
                  </Text>
                )}
              </Flex>
            ))}
          </Grid>
        </Box>
      </Card>

      {/* Billing details */}
      <Card>
        <CardHeader title="Billing details" />
        <Box p="20px">
          <Grid
            templateColumns={{ base: "1fr", md: "1fr 1fr" }}
            gap="4"
            mb="5"
          >
            <Box>
              <Text fontSize="13px" fontWeight="600" color="fg" mb="2">
                Billing contact
              </Text>
              <Input
                value={billingContact}
                onChange={(e) => setBillingContact(e.target.value)}
                borderColor="border"
                bg="bg.input"
                h="40px"
                fontSize="14px"
              />
            </Box>
            <Box>
              <Text fontSize="13px" fontWeight="600" color="fg" mb="2">
                Billing email
              </Text>
              <Input
                value={billingEmail}
                onChange={(e) => setBillingEmail(e.target.value)}
                borderColor="border"
                bg="bg.input"
                h="40px"
                fontSize="14px"
              />
            </Box>
          </Grid>

          <Flex
            align={{ base: "start", md: "center" }}
            justify="space-between"
            direction={{ base: "column", md: "row" }}
            gap="3"
            border="1px solid"
            borderColor="border"
            borderRadius="8px"
            px="14px"
            py="12px"
            mb="5"
          >
            <Flex align="center" gap="3">
              <CreditCard size={18} color="fg.muted" />
              <Box>
                <Text fontSize="13px" fontWeight="500" color="fg">
                  Visa ending in 4821
                </Text>
                <Text fontSize="12px" color="fg.muted">
                  Expires 12/27
                </Text>
              </Box>
            </Flex>
            <Button variant="outline" size="sm" color="fg">
              Update card
            </Button>
          </Flex>

          <Separator mb="4" />

          <Flex justify="space-between" align="center" mb="3">
            <Box>
              <Text fontSize="12px" color="fg.muted">
                Next invoice
              </Text>
              <Text fontSize="13px" fontWeight="500" color="fg">
                Jan 1, 2027
              </Text>
            </Box>
            <Text fontSize="18px" fontWeight="600" color="brand.solid">
              $4,200.00
            </Text>
          </Flex>

          <Flex align="center" gap="2" color="brand.solid" cursor="pointer">
            <Download size={14} />
            <Text fontSize="13px" fontWeight="500">
              Download invoice history
            </Text>
          </Flex>
        </Box>
      </Card>
    </Box>
  );
}
