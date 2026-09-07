import { Badge, Flex, Text, chakra } from "@chakra-ui/react";
import { useEffect, useState } from "react";

import { useNav } from "@/components/layout/shared/use-nav";
import { PlatformNavContent } from "./nav-content";

/**
 * The CRM's sidebar — the firm app's, with the firm app's items replaced.
 *
 * The one addition is the `Platform` badge beside the wordmark, and it is a
 * requirement rather than a flourish: the people using this hold a firm login
 * too, for testing, and an operator who thinks they are in a demo firm while
 * actually editing the catalogue every firm reads is the expensive mistake
 * this tier makes possible. The badge is in the header of the rail and in the
 * mobile drawer, so the answer to "which app am I in" is always on screen.
 */
export function DesktopNav() {
  const { collapsed, suppressCollapse, collapseSignal } = useNav();
  const [hovered, setHovered] = useState(false);
  const expanded = hovered || !collapsed;

  useEffect(() => {
    setHovered(false); // eslint-disable-line react-hooks/set-state-in-effect
  }, [collapseSignal]);

  return (
    <Flex
      as="aside"
      direction="column"
      w={expanded ? "260px" : "64px"}
      minW={expanded ? "260px" : "64px"}
      h="100vh"
      position="sticky"
      top={0}
      bg="bg"
      borderRight="1px solid"
      borderColor="border"
      transition="width 200ms, min-width 200ms"
      display={{ base: "none", lg: "flex" }}
      onMouseEnter={() => {
        if (!suppressCollapse) setHovered(true);
      }}
      onMouseLeave={() => {
        if (!suppressCollapse) setHovered(false);
      }}
      zIndex={20}
      flexShrink={0}
    >
      <Flex
        direction="column"
        justify="center"
        align={expanded ? "stretch" : "center"}
        px={expanded ? "14px" : "0"}
        h="52px"
        minH="52px"
        borderBottom="1px solid"
        borderColor="border"
      >
        {expanded ? (
          <Flex align="center" gap="8px">
            <chakra.img
              src="/oravanti_logo.png"
              alt="Oravanti"
              h="24px"
              w="auto"
            />
            <Text textStyle="label" color="fg" m={0}>
              Oravanti
            </Text>
            <Badge size="sm" colorPalette="purple" variant="subtle">
              Platform
            </Badge>
          </Flex>
        ) : (
          <chakra.img
            src="/oravanti_logo.png"
            alt="Oravanti"
            h="24px"
            w="auto"
            mx="auto"
          />
        )}
      </Flex>
      <PlatformNavContent collapsed={!expanded} />
    </Flex>
  );
}
