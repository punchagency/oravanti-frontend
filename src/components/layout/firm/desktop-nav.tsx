import { Flex, Text, chakra } from "@chakra-ui/react";
import { useState } from "react";
import { NavContent } from "./nav-content";
import { useNav } from "@/components/layout/shared/use-nav";

export function DesktopNav() {
  const { collapsed, suppressCollapse, collapseSignal } = useNav();
  const [hovered, setHovered] = useState(false);

  /*
    Collapse the sidebar immediately when forceCollapse() is
    called (Quick Actions menu item click). Bumping the signal
    counter resets hover during render rather than in an effect —
    an effect would paint the expanded sidebar for one frame
    before collapsing it.
  */
  const [prevCollapseSignal, setPrevCollapseSignal] = useState(collapseSignal);
  if (prevCollapseSignal !== collapseSignal) {
    setPrevCollapseSignal(collapseSignal);
    setHovered(false);
  }

  const expanded = hovered || !collapsed;

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
      /*
        suppressCollapse gates BOTH onMouseEnter and onMouseLeave:
        – While a Quick Actions menu or dialog is open, the sidebar
          stays locked in its current state (prevents collapse from
          portaled menu, prevents re-expand while dialog is open).
        – When suppressCollapse is false, normal hover expand/collapse
          behavior resumes.
      */
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
