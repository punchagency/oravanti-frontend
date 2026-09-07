/**
 * The chrome the app draws over the page, and how sticky content clears it.
 *
 * The admin shell has a sticky top bar and the page scrolls underneath it, so
 * anything else that sticks to the top of the viewport — a section rail, a
 * table header — lands *behind* the bar at `top: 0` and loses its first rows.
 * The public questionnaire portal has no bar at all and needs no offset.
 *
 * A CSS custom property rather than a prop threaded through every component:
 * the shell is the only thing that knows what it draws, the components that
 * have to clear it are several layers down and shared across shells, and a
 * fallback of `0px` makes "no chrome" the default rather than something each
 * caller has to remember to pass.
 *
 * Set it once on the shell (see `AdminLayout`); read it with `stickyTop`.
 */
export const TOPBAR_HEIGHT = "52px";

/** The property the shell sets and sticky content reads. */
export const STICKY_OFFSET_VAR = "--sticky-offset";

/**
 * A `top` (or a height to subtract) that clears the shell's chrome.
 *
 * `gap` is breathing room under the bar — a sticky element flush against it
 * reads as clipped even when nothing is hidden.
 */
export const stickyTop = (gap = "8px") =>
  `calc(var(${STICKY_OFFSET_VAR}, 0px) + ${gap})`;
