import { Box, Button, Flex, Grid, Text } from "@chakra-ui/react";
import { UserPlus } from "lucide-react";
import { participants } from "./data";
import { ParticipantCard } from "./participant-card";
import { OpposingPartyCard } from "./opposing-party-card";

export function People() {
  return (
    <>
      <Flex
        justify="space-between"
        align="flex-start"
        mb={5}
        gap={4}
        flexWrap="wrap"
      >
        <Box>
          <Text fontSize="16px" fontWeight="500" color="fg" lineHeight="20px">
            Case participants
          </Text>
          <Text fontSize="13px" color="fg.muted" mt={0.5}>
            Everyone connected to this matter
          </Text>
        </Box>
        <Button
          size="xs"
          variant="outline"
          borderColor="border"
          h="36px"
          fontSize="13px"
          fontWeight="400"
          color="fg.muted"
          px={4}
          flexShrink={0}
        >
          <UserPlus size={13} />
          Add participant
        </Button>
      </Flex>

      <Grid
        templateColumns={{ base: "1fr", md: "1fr 1fr" }}
        gap={4}
      >
        <ParticipantCard participant={participants[0]} />
        <ParticipantCard participant={participants[1]} />
        <ParticipantCard participant={participants[2]} />
        <OpposingPartyCard />
        <ParticipantCard participant={participants[3]} />
      </Grid>
    </>
  );
}
