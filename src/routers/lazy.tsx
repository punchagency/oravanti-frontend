/*
 * `ComponentType<any>` is the standard constraint for "some component, props
 * unknown" — `unknown` breaks assignability at every call site — and
 * `ComponentType<{}>` is the matching "takes no props" default. Neither rule
 * can be satisfied without weakening the generics, so both are off for this
 * file rather than repeated inline three times.
 */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type */
import { lazy, Suspense, type ComponentProps, type ComponentType } from "react";
import { PageSkeleton } from "@/components/ui/theme-skeleton";
import { PageLoader } from "@/components/ui/page-loader";
import type { ReactNode } from "react";

function withSuspense<P extends ComponentType<any>>(
  factory: () => Promise<{ default: P }>,
  fallback: ReactNode,
): ComponentType<ComponentProps<P>> {
  const Component = lazy(factory);
  return function LazyPage(props: ComponentProps<P>) {
    return (
      <Suspense fallback={fallback}>
        <Component {...props} />
      </Suspense>
    );
  };
}

/**
 * Lazy-loads a route page rendered inside the dashboard chrome, falling back to
 * the shared PageSkeleton. Returns a component (not an element) so it can be
 * used as a normal route `element` and take props (e.g. ComingSoonPage).
 */
export function lazyPage<P extends ComponentType<any> = ComponentType<{}>>(
  factory: () => Promise<{ default: P }>,
): ComponentType<ComponentProps<P>> {
  return withSuspense(factory, <PageSkeleton />);
}

/**
 * Lazy-loads a page that renders on its own — onboarding steps, auth callbacks
 * — with a centred spinner instead.
 *
 * A skeleton stands in for a layout the reader already knows, so on a centred
 * single-card page with no surrounding chrome it reads as a broken screen
 * rather than as loading.
 */
export function lazyStandalonePage<
  P extends ComponentType<any> = ComponentType<{}>,
>(factory: () => Promise<{ default: P }>): ComponentType<ComponentProps<P>> {
  return withSuspense(factory, <PageLoader />);
}
