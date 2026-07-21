import { Box, Button, Text } from "@chakra-ui/react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          minH="400px"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          p={8}
          textAlign="center"
        >
          <Box mb={4}>
            <AlertTriangle size={48} color="var(--chakra-colors-yellow-500)" />
          </Box>
          <Text fontSize="18px" fontWeight="600" color="fg" mb={2}>
            Something went wrong
          </Text>
          <Text fontSize="13px" color="fg.muted" mb={6} maxW="400px">
            An unexpected error occurred. Please try refreshing the page.
          </Text>
          {this.state.error && (
            <Box
              mb={6}
              p={3}
              bg="bg.subtle"
              borderRadius="md"
              border="1px solid"
              borderColor="border.muted"
              maxW="500px"
              w="full"
            >
              <Text fontSize="12px" color="fg.muted" fontFamily="mono" textAlign="left" whiteSpace="pre-wrap" wordBreak="break-all">
                {this.state.error.message}
              </Text>
            </Box>
          )}
          <Button
            size="sm"
            h="34px"
            bg="brand.solid"
            color="brand.fg"
            borderRadius="7px"
            fontSize="13px"
            fontWeight="500"
            onClick={() => window.location.reload()}
          >
            <RefreshCw size={14} /> Reload page
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}
