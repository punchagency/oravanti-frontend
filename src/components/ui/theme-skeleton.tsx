import { Skeleton, type SkeletonProps } from "@chakra-ui/react";

export function ThemeSkeleton(props: SkeletonProps) {
  return (
    <Skeleton
      variant="shine"
      css={{
        "--start-color": { _light: "#E8E5DC", _dark: "#3A3A3A" },
        "--end-color": { _light: "#F1EFE8", _dark: "#303030" },
      }}
      {...props}
    />
  );
}
