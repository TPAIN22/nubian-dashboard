import type { Appearance } from "@clerk/types";

/**
 * Shared Clerk <SignIn>/<SignUp> appearance theming so both auth pages stay
 * visually consistent with the Nubian brand. We override class strings on
 * Clerk's internal elements so they pick up the same Tailwind/CSS-var tokens
 * the rest of the dashboard uses (--primary, --foreground, --card, etc.).
 *
 * NOTE: layout.tsx wraps ClerkProvider with `baseTheme: dark`. We keep that as
 * the foundation and just layer brand styling on top via `elements`.
 */
export const nubianClerkAppearance: Appearance = {
  variables: {
    colorPrimary: "#a37e2c", // --nubian-primary
    colorText: "var(--foreground)",
    colorTextSecondary: "var(--muted-foreground)",
    colorBackground: "var(--card)",
    colorInputBackground: "var(--background)",
    colorInputText: "var(--foreground)",
    borderRadius: "0.75rem",
    fontFamily: "var(--font-ibm-plex-arabic), var(--font-inter), system-ui, sans-serif",
  },
  elements: {
    rootBox: "w-full",
    // No card chrome — the widget sits directly on the page background.
    card: "bg-transparent shadow-none border-0 px-0 py-0 w-full",
    // The shell renders its own h1/subtitle, so suppress Clerk's duplicate header.
    header: "hidden",
    // Social buttons: outlined, rounded, single line of subtle border.
    socialButtonsBlockButton:
      "border border-border bg-transparent hover:bg-muted text-foreground rounded-lg h-10 font-medium transition-colors normal-case",
    socialButtonsBlockButtonText: "font-medium text-sm",
    socialButtonsProviderIcon: "w-4 h-4",
    dividerLine: "bg-border",
    dividerText: "text-muted-foreground text-[11px] uppercase tracking-[0.18em]",
    formFieldLabel: "text-xs font-medium text-muted-foreground",
    formFieldInput:
      "h-10 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-foreground focus:ring-0 transition-colors",
    formButtonPrimary:
      "bg-foreground text-background hover:bg-foreground/90 rounded-lg h-10 font-semibold text-sm tracking-tight shadow-none transition-colors normal-case",
    formFieldAction: "text-foreground hover:text-foreground/80 font-medium",
    footer: "bg-transparent",
    // The shell renders its own "don't have an account?" CTA below the widget,
    // so hide Clerk's own footer to avoid duplication.
    footerAction: "hidden",
    identityPreviewEditButton: "text-foreground",
    formResendCodeLink: "text-foreground",
    otpCodeFieldInput:
      "border border-border bg-background text-foreground focus:border-foreground focus:ring-0",
    alert: "rounded-lg border-border bg-muted",
    alertText: "text-sm",
  },
};
