import {
  Box,
  Skeleton,
  Stack,
  type SkeletonProps,
  type StackProps,
} from "@chakra-ui/react";

const shimmerCss = {
  "--start-color": { _light: "#E8E5DC", _dark: "#3A3A3A" },
  "--end-color": { _light: "#F1EFE8", _dark: "#303030" },
} as const;

/**
 * Themed skeleton primitive. Matches the app's warm-light / neutral-dark
 * palette so placeholders blend with the background in both color modes.
 */
export function ThemeSkeleton(props: SkeletonProps) {
  return <Skeleton variant="shine" css={shimmerCss} {...props} />;
}

/** Stack of skeleton text lines, ending with a shorter "paragraph" line. */
export function ThemeSkeletonText({
  noOfLines = 3,
  gap = "2",
  ...props
}: SkeletonProps & { noOfLines?: number; gap?: StackProps["gap"] }) {
  return (
    <Stack gap={gap} width="full">
      {Array.from({ length: noOfLines }).map((_, index) => (
        <ThemeSkeleton
          key={index}
          height="4"
          {...props}
          _last={{ maxW: "80%" }}
        />
      ))}
    </Stack>
  );
}

/**
 * Skeleton stand-in for a form control (input / select trigger) shown while
 * the option list it renders from is still loading. Sized to match the
 * app's small select triggers so layout doesn't shift when data arrives.
 */
export function ControlSkeleton({ h = "32px" }: { h?: string }) {
  return <ThemeSkeleton h={h} w="full" borderRadius="7px" />;
}

/**
 * Generic page loader shown while a lazily-loaded route is being fetched.
 * Kept intentionally simple and neutral so it fits any page shape.
 */
export function PageSkeleton() {
  return (
    <Box w="full" aria-busy="true" aria-label="Loading page" py="4">
      <ThemeSkeleton h="24px" w="220px" borderRadius="6px" />
      <ThemeSkeleton h="240px" borderRadius="10px" mt="6" />
    </Box>
  );
}
