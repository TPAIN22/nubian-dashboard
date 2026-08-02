/**
 * The console shell — the chrome shared by /admin and /merchant.
 *
 * A console is a nav config plus a counts source. Everything else (rail,
 * topbar, breadcrumbs, ⌘K palette, mobile drawer) comes from here, so the two
 * panels can never drift apart visually.
 */

export * from './nav-model'
export { ConsoleShell } from './console-shell'
export { BreadcrumbProvider, useBreadcrumbTrail, useSetPageLabel } from './breadcrumbs'
export { useCommandPalette } from './command-palette'
