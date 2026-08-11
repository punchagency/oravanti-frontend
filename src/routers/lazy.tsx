import { lazy, Suspense, type ComponentProps, type ComponentType } from "react";
import { PageSkeleton } from "@/components/ui/theme-skeleton";

/**
 * Lazy-loads a route page and wraps it in a Suspense boundary with the shared
 * PageSkeleton fallback. Returns a component (not an element) so it can be used
 * as a normal route `element` and take props (e.g. ComingSoonPage).
 */
export function lazyPage<P extends ComponentType<any> = ComponentType<{}>>(
  factory: () => Promise<{ default: P }>,
): ComponentType<ComponentProps<P>> {
  const Component = lazy(factory);
  return function LazyPage(props: ComponentProps<P>) {
    return (
      <Suspense fallback={<PageSkeleton />}>
        <Component {...props} />
      </Suspense>
    );
  };
}
