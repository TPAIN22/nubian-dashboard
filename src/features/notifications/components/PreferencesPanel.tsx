'use client'

import { useEffect, useState } from 'react'
import { Loader2, Save } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'

import { usePreferences, useUpdatePreferences } from '../hooks'
import type { NotificationPreferences } from '../types'

const DEFAULTS: NotificationPreferences = {
  channels: { push: true, in_app: true, sms: false, email: true },
  quietHours: { enabled: false, start: '22:00', end: '08:00', timezone: 'UTC' },
  rateLimiting: { enabled: true, maxPerHour: 10, maxPerDay: 50 },
  antiSpam: { enabled: true, minIntervalBetweenSameType: 300 },
}

export function PreferencesPanel() {
  const { data, isLoading } = usePreferences()
  const update = useUpdatePreferences()
  const [draft, setDraft] = useState<NotificationPreferences>(DEFAULTS)

  useEffect(() => {
    if (data) setDraft(data)
    else if (data === null) setDraft(DEFAULTS)
  }, [data])

  const setChannel = (key: keyof NotificationPreferences['channels'], value: boolean) =>
    setDraft((d) => ({ ...d, channels: { ...d.channels, [key]: value } }))
  const setQuiet = <K extends keyof NotificationPreferences['quietHours']>(
    key: K,
    value: NotificationPreferences['quietHours'][K],
  ) => setDraft((d) => ({ ...d, quietHours: { ...d.quietHours, [key]: value } }))
  const setRate = <K extends keyof NotificationPreferences['rateLimiting']>(
    key: K,
    value: NotificationPreferences['rateLimiting'][K],
  ) => setDraft((d) => ({ ...d, rateLimiting: { ...d.rateLimiting, [key]: value } }))
  const setSpam = <K extends keyof NotificationPreferences['antiSpam']>(
    key: K,
    value: NotificationPreferences['antiSpam'][K],
  ) => setDraft((d) => ({ ...d, antiSpam: { ...d.antiSpam, [key]: value } }))

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-40" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Channels</CardTitle>
          <CardDescription>
            Toggle which delivery channels are enabled for this account.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <SwitchRow
            id="ch-push"
            label="Push notifications"
            description="Mobile + web push via Expo"
            checked={draft.channels.push}
            onCheckedChange={(v) => setChannel('push', v)}
          />
          <SwitchRow
            id="ch-inapp"
            label="In-app inbox"
            description="Always-on inbox feed"
            checked={draft.channels.in_app}
            onCheckedChange={(v) => setChannel('in_app', v)}
          />
          <SwitchRow
            id="ch-email"
            label="Email"
            description="Transactional + marketing via Resend"
            checked={draft.channels.email}
            onCheckedChange={(v) => setChannel('email', v)}
          />
          <SwitchRow
            id="ch-sms"
            label="SMS"
            description="Coming soon"
            disabled
            checked={draft.channels.sms}
            onCheckedChange={(v) => setChannel('sms', v)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quiet hours</CardTitle>
          <CardDescription>
            Push delivery is delayed until the end of the quiet window. Email and in-app
            inbox are unaffected.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SwitchRow
            id="qh-enabled"
            label="Enable quiet hours"
            checked={draft.quietHours.enabled}
            onCheckedChange={(v) => setQuiet('enabled', v)}
          />
          {draft.quietHours.enabled ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="qh-start">Start</Label>
                <Input
                  id="qh-start"
                  type="time"
                  value={draft.quietHours.start}
                  onChange={(e) => setQuiet('start', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="qh-end">End</Label>
                <Input
                  id="qh-end"
                  type="time"
                  value={draft.quietHours.end}
                  onChange={(e) => setQuiet('end', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="qh-tz">Timezone</Label>
                <Input
                  id="qh-tz"
                  value={draft.quietHours.timezone}
                  onChange={(e) => setQuiet('timezone', e.target.value)}
                  placeholder="UTC"
                />
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rate limiting</CardTitle>
          <CardDescription>
            Cap how many notifications a recipient can receive within a window.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SwitchRow
            id="rl-enabled"
            label="Enable rate limiting"
            checked={draft.rateLimiting.enabled}
            onCheckedChange={(v) => setRate('enabled', v)}
          />
          {draft.rateLimiting.enabled ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="rl-hour">Max per hour</Label>
                <Input
                  id="rl-hour"
                  type="number"
                  min={1}
                  value={draft.rateLimiting.maxPerHour}
                  onChange={(e) =>
                    setRate('maxPerHour', Number(e.target.value) || 1)
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rl-day">Max per day</Label>
                <Input
                  id="rl-day"
                  type="number"
                  min={1}
                  value={draft.rateLimiting.maxPerDay}
                  onChange={(e) => setRate('maxPerDay', Number(e.target.value) || 1)}
                />
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Anti-spam</CardTitle>
          <CardDescription>
            Suppress duplicate notifications of the same type within an interval.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SwitchRow
            id="as-enabled"
            label="Enable anti-spam"
            checked={draft.antiSpam.enabled}
            onCheckedChange={(v) => setSpam('enabled', v)}
          />
          {draft.antiSpam.enabled ? (
            <div className="space-y-1.5">
              <Label htmlFor="as-interval">Minimum interval (seconds)</Label>
              <Input
                id="as-interval"
                type="number"
                min={0}
                value={draft.antiSpam.minIntervalBetweenSameType}
                onChange={(e) =>
                  setSpam('minIntervalBetweenSameType', Number(e.target.value) || 0)
                }
              />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="sticky bottom-0 -mx-1 flex justify-end border-t border-border/60 bg-background/80 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Button onClick={() => update.mutate(draft)} disabled={update.isPending}>
          {update.isPending ? (
            <>
              <Loader2 className="mr-1 size-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save className="mr-1 size-4" />
              Save preferences
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

function SwitchRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  id: string
  label: string
  description?: string
  checked: boolean
  onCheckedChange: (value: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card/40 px-4 py-3">
      <div className="space-y-0.5">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  )
}
