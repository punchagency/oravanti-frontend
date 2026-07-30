import { Flex, Text, chakra } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { NavContent } from "./nav-content";
import { useNav } from "./nav-context";

export function DesktopNav() {
  const { collapsed, suppressCollapse, collapseSignal } = useNav();
  const [hovered, setHovered] = useState(false);
  const expanded = hovered || !collapsed;

  useEffect(() => {
    setHovered(false);
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
      <NavContent collapsed={!expanded} />
    </Flex>
  );
}
