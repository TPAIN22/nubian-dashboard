/**
 * Merchant dashboard onboarding.
 *
 * Mounted once by `MerchantShell`. Everything else — which step is next, when a
 * step is genuinely done, where the popover sits — is internal. The only things
 * the rest of the app touches are the provider, the `useOnboarding()` controls
 * (for the "جولة تعريفية" action in Help), and the `data-onboarding` attributes
 * on the elements the tour points at.
 */

export { OnboardingProvider, useOnboarding } from './OnboardingProvider'
export { RestartTourButton } from './RestartTourButton'
export { MERCHANT_TOUR, TOUR_COPY, TOUR_VERSION } from './steps'
export type { MerchantContext, OnboardingState, OnboardingStatus, OnboardingStep } from './types'
