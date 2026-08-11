'use client'

import { Compass } from 'lucide-react'

import { Button } from '@/components/admin'

import { useOnboarding } from './OnboardingProvider'
import { TOUR_COPY } from './steps'

/* ============================================================================
   "جولة تعريفية"
   ----------------------------------------------------------------------------
   The way back into the tour, placed in the console's Help surface rather than
   pinned somewhere on the dashboard. A merchant who finished the tour should
   not carry a permanent reminder of it around the main screen — but the one
   who skipped it on day one and wants it in week two should find it exactly
   where they would look for help.

   Renders nothing outside the merchant console: /admin mounts the same shell
   with no tour behind it.
   ========================================================================== */

export function RestartTourButton() {
  const onboarding = useOnboarding()
  if (!onboarding) return null

  return (
    <Button variant="ghost" size="sm" onClick={onboarding.restart}>
      <Compass />
      {TOUR_COPY.restart}
    </Button>
  )
}
