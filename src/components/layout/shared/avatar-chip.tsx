import { Box, Image } from "@chakra-ui/react";

export type AvatarChipProps = {
  src?: string;
  alt?: string;
  fallback: string;
  size?: string;
  fontSize?: string;
};

export function AvatarChip({
  src,
  alt,
  fallback,
  size = "28px",
  fontSize = "10px",
}: AvatarChipProps) {
  return (
    <Box
      display="grid"
      placeItems="center"
      w={size}
      h={size}
      minW={size}
      borderRadius="full"
      bg="accent.admin"
      color="white"
      fontSize={fontSize}
      fontWeight={500}
      overflow="hidden"
    >
      {src ? (
        <Image src={src} alt={alt} boxSize="full" objectFit="cover" />
      ) : (
        fallback || "?"
      )}
    </Box>
  );
}
