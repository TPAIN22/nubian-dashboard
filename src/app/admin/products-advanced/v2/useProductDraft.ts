'use client'

import * as React from 'react'

/* ============================================================================
   Draft autosave
   ----------------------------------------------------------------------------
   The backend has no draft endpoint — a product only exists once POST /products
   succeeds. So rather than invent a server-side draft state, this persists the
   in-progress form to localStorage and offers to restore it.

   That covers the failure the wizard actually had: six steps, a variant matrix
   that can run to dozens of rows, and one accidental tab close losing all of it.

   Scope: new products only. In edit mode the server record is the source of
   truth and a stale local copy would be actively dangerous.
   ========================================================================== */

const KEY = 'nubian.admin.productDraft.v1'
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

export type DraftEnvelope<T> = {
  savedAt: number
  step: number
  values: T
}

export type DraftStatus = 'idle' | 'saving' | 'saved'

function read<T>(): DraftEnvelope<T> | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DraftEnvelope<T>
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > MAX_AGE_MS) {
      window.localStorage.removeItem(KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function clearProductDraft() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    /* private mode */
  }
}

export function useProductDraft<T>({
  enabled,
  values,
  step,
}: {
  /** False in edit mode — never shadow a server record with a local copy. */
  enabled: boolean
  values: T
  step: number
}) {
  const [status, setStatus] = React.useState<DraftStatus>('idle')
  const [savedAt, setSavedAt] = React.useState<number | null>(null)

  // Captured once on mount so a restore banner doesn't reappear after the user
  // dismisses it and keeps typing (which would immediately overwrite the draft).
  const [pending, setPending] = React.useState<DraftEnvelope<T> | null>(null)
  const restoredOrDismissed = React.useRef(false)

  React.useEffect(() => {
    if (!enabled) return
    const found = read<T>()
    if (found) setPending(found)
    else restoredOrDismissed.current = true
  }, [enabled])

  // Debounced write. Held back until the user has resolved any restore prompt,
  // otherwise the first keystroke destroys the draft they were about to recover.
  const serialized = React.useMemo(() => {
    try {
      return JSON.stringify(values)
    } catch {
      return null
    }
  }, [values])

  React.useEffect(() => {
    if (!enabled || !serialized || !restoredOrDismissed.current) return

    setStatus('saving')
    const t = setTimeout(() => {
      try {
        const at = Date.now()
        window.localStorage.setItem(
          KEY,
          JSON.stringify({ savedAt: at, step, values: JSON.parse(serialized) }),
        )
        setSavedAt(at)
        setStatus('saved')
      } catch {
        // Quota or private mode — autosave is a convenience, never a blocker.
        setStatus('idle')
      }
    }, 800)

    return () => clearTimeout(t)
  }, [enabled, serialized, step])

  const restore = React.useCallback(() => {
    restoredOrDismissed.current = true
    const draft = pending
    setPending(null)
    return draft
  }, [pending])

  const discard = React.useCallback(() => {
    restoredOrDismissed.current = true
    setPending(null)
    clearProductDraft()
  }, [])

  return { status, savedAt, pending, restore, discard }
}

/** "منذ لحظات" / "منذ 4 دقائق" — relative, Western digits. */
export function formatSavedAt(ts: number | null): string {
  if (!ts) return ''
  const mins = Math.floor((Date.now() - ts) / 60000)
  if (mins < 1) return 'منذ لحظات'
  if (mins < 60) return `منذ ${mins} دقيقة`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `منذ ${hours} ساعة`
  return `منذ ${Math.floor(hours / 24)} يوم`
}
