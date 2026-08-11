/**
 * Merchant dashboard guided tours.
 *
 * Two of them today — a walkthrough of the console and a walkthrough of the
 * product wizard — sharing one engine, mounted once by `MerchantShell`. Which
 * one runs is decided by the route (see `tours/index.ts`).
 *
 * Everything else is internal. The rest of the app touches four things: the
 * provider, the `useOnboarding()` controls, `<RestartTourButton>` for a help
 * surface, and the `data-onboarding` attributes on the elements a tour points
 * at.
 */

export { OnboardingProvider, useOnboarding } from './OnboardingProvider'
export { RestartTourButton } from './RestartTourButton'
export { TOUR_COPY } from './copy'
export { ADD_PRODUCT_TOUR_ID, MERCHANT_TOUR_ID, TOURS, tourById, tourForPath } from './tours'
export type {
  MerchantContext,
  OnboardingState,
  OnboardingStateMap,
  OnboardingStatus,
  OnboardingStep,
  Tour,
} from './types'
