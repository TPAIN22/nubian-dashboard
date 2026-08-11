'use client'

import { Compass } from 'lucide-react'

import { Button } from '@/components/admin'

import { useOnboarding } from './OnboardingProvider'
import { tourById } from './tours'

/* ============================================================================
   The way back into a tour
   ----------------------------------------------------------------------------
   Placed in the surface the tour is about — the console walkthrough in الدعم,
   the wizard walkthrough in the wizard's own header — rather than pinned
   somewhere on the dashboard. A merchant who finished a tour should not carry
   a permanent reminder of it around the main screen; the one who skipped it on
   day one and wants it in week two should find it where they would look for
   help with that particular thing.

   Renders nothing when there is no tour behind it. /admin mounts the same
   product wizard with no OnboardingProvider above it, so the same button in the
   same header simply is not there for an admin — no prop threading, no
   `isMerchant` check at the call site.
   ========================================================================== */

export function RestartTourButton({
  tourId,
  className,
}: {
  tourId: string
  className?: string
}) {
  const onboarding = useOnboarding()
  const tour = tourById(tourId)

  if (!onboarding || !tour) return null

  return (
    <Button
      variant="ghost"
      size="sm"
      className={className}
      onClick={() => onboarding.restart(tourId)}
    >
      <Compass />
      {tour.restartLabel}
    </Button>
  )
}
