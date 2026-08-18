import { Box, Button, Text } from "@chakra-ui/react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { isRouteErrorResponse, useRouteError } from "react-router";

function ErrorFallback({
  title,
  message,
  detail,
}: {
  title: string;
  message: string;
  detail?: string;
}) {
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
        {title}
      </Text>
      <Text fontSize="13px" color="fg.muted" mb={6} maxW="400px">
        {message}
      </Text>
      {detail && (
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
          <Text
            fontSize="12px"
            color="fg.muted"
            fontFamily="mono"
            textAlign="left"
            whiteSpace="pre-wrap"
            wordBreak="break-all"
          >
            {detail}
          </Text>
        </Box>
      )}
      <Button
        size="sm"
        h="34px"
        bg="brand.solid"
        color="brand.contrast"
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

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/** Catches render errors thrown by a subtree (used around route outlets). */
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
        <ErrorFallback
          title="Something went wrong"
          message="An unexpected error occurred. Please try refreshing the page."
          detail={this.state.error?.message}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Route-level error fallback wired into every router via `errorElement`.
 * Catches render/loader errors thrown by any descendant route. Do NOT lazy-load
 * this component — react-router needs it synchronously to render on error.
 */
export function RouteErrorBoundary() {
  const error = useRouteError();

  let title = "Something went wrong";
  let message = "An unexpected error occurred. Please try refreshing the page.";
  let detail: string | undefined;

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = "Page not found";
      message = "The page you're looking for doesn't exist.";
    } else if (error.status === 500) {
      title = "Server error";
      message = "Something went wrong on our end. Please try again shortly.";
    } else {
      title = error.statusText || "Request failed";
      if (typeof error.data === "string") message = error.data;
    }
  } else if (error instanceof Error && error.message) {
    message = error.message;
    detail = error.message;
  }

  return <ErrorFallback title={title} message={message} detail={detail} />;
}
