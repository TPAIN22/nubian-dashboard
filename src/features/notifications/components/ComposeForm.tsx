'use client'

import { Bell, Megaphone, Sparkles, Users } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

import { NOTIFICATION_TYPES } from '../constants'
import { useCompose } from '../hooks'
import type {
  ComposeMode,
  ComposePayload,
  ComposeTarget,
  NotificationType,
} from '../types'

const TITLE_LIMIT = 80
const BODY_LIMIT = 240

interface FormValues {
  mode: ComposeMode
  type: NotificationType
  title: string
  body: string
  deepLink: string
  target: ComposeTarget
  recipientIds: string
}

const DEFAULT_VALUES: FormValues = {
  mode: 'broadcast',
  type: 'MERCHANT_PROMOTION',
  title: '',
  body: '',
  deepLink: '',
  target: 'all',
  recipientIds: '',
}

export function ComposeForm({ onSent }: { onSent?: () => void }) {
  const [values, setValues] = useState<FormValues>(DEFAULT_VALUES)
  const compose = useCompose(() => {
    setValues((v) => ({ ...DEFAULT_VALUES, mode: v.mode }))
    onSent?.()
  })

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }))

  const recipientCount = useMemo(() => {
    if (values.target !== 'specific') return null
    return values.recipientIds
      .split(/[\s,]+/)
      .map((id) => id.trim())
      .filter(Boolean).length
  }, [values.recipientIds, values.target])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!values.title.trim() || !values.body.trim()) return

    let recipientIds: string[] | undefined
    if (values.mode === 'marketing' && values.target === 'specific') {
      recipientIds = values.recipientIds
        .split(/[\s,]+/)
        .map((id) => id.trim())
        .filter(Boolean)
      if (!recipientIds.length) return
    }

    const payload: ComposePayload = {
      mode: values.mode,
      type: values.type,
      title: values.title,
      body: values.body,
      deepLink: values.deepLink || undefined,
      target: values.target,
      recipientIds,
    }
    compose.mutate(payload)
  }

  const titleRemaining = TITLE_LIMIT - values.title.length
  const bodyRemaining = BODY_LIMIT - values.body.length
  const valid =
    values.title.trim().length > 0 &&
    values.body.trim().length > 0 &&
    (values.mode !== 'marketing' ||
      values.target !== 'specific' ||
      (recipientCount ?? 0) > 0)

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base">Compose notification</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <ModeCard
                title="Broadcast"
                description="System-wide announcement to users or merchants. High deliverability."
                icon={<Megaphone className="size-4" />}
                active={values.mode === 'broadcast'}
                onClick={() => {
                  set('mode', 'broadcast')
                  if (values.target === 'specific') set('target', 'all')
                }}
              />
              <ModeCard
                title="Marketing"
                description="Targeted campaign to a segment or specific user IDs. Lower-priority queue."
                icon={<Sparkles className="size-4" />}
                active={values.mode === 'marketing'}
                onClick={() => set('mode', 'marketing')}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Type">
                <Select
                  value={values.type}
                  onValueChange={(v) => set('type', v as NotificationType)}
                >
                  <SelectTrigger aria-label="Notification type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTIFICATION_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Audience">
                <Select
                  value={values.target}
                  onValueChange={(v) => set('target', v as ComposeTarget)}
                >
                  <SelectTrigger aria-label="Audience">
                    <SelectValue placeholder="Select audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All (users + merchants)</SelectItem>
                    <SelectItem value="users">Users only</SelectItem>
                    <SelectItem value="merchants">Merchants only</SelectItem>
                    {values.mode === 'marketing' ? (
                      <SelectItem value="specific">Specific user IDs</SelectItem>
                    ) : null}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {values.mode === 'marketing' && values.target === 'specific' ? (
              <Field
                label="Recipient IDs"
                hint={
                  recipientCount != null
                    ? `${recipientCount} ID${recipientCount === 1 ? '' : 's'}`
                    : undefined
                }
              >
                <Textarea
                  value={values.recipientIds}
                  onChange={(e) => set('recipientIds', e.target.value)}
                  placeholder="user_123, user_456, user_789"
                  className="min-h-[88px] font-mono text-xs"
                  aria-describedby="recipient-help"
                />
                <p id="recipient-help" className="mt-1 text-xs text-muted-foreground">
                  Comma- or whitespace-separated Clerk user IDs.
                </p>
              </Field>
            ) : null}

            <Field
              label="Title"
              required
              hint={
                <span className={titleRemaining < 0 ? 'text-destructive' : undefined}>
                  {titleRemaining}
                </span>
              }
            >
              <Input
                value={values.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="e.g. Flash Sale — 50% off all electronics"
                maxLength={TITLE_LIMIT}
                required
              />
            </Field>

            <Field
              label="Body"
              required
              hint={
                <span className={bodyRemaining < 0 ? 'text-destructive' : undefined}>
                  {bodyRemaining}
                </span>
              }
            >
              <Textarea
                value={values.body}
                onChange={(e) => set('body', e.target.value)}
                placeholder="Write a short, compelling message…"
                maxLength={BODY_LIMIT}
                className="min-h-[120px]"
                required
              />
            </Field>

            <Field label="Deep link" hint="Optional in-app destination">
              <Input
                value={values.deepLink}
                onChange={(e) => set('deepLink', e.target.value)}
                placeholder="/products/sale"
              />
            </Field>

            <div className="flex items-center justify-end gap-2 border-t border-border/60 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setValues(DEFAULT_VALUES)}
                disabled={compose.isPending}
              >
                Reset
              </Button>
              <Button type="submit" disabled={!valid || compose.isPending}>
                {compose.isPending ? 'Dispatching…' : 'Dispatch'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <ComposePreview
        title={values.title || 'Your title appears here'}
        body={values.body || 'Your message appears here once you start typing.'}
        target={values.target}
        mode={values.mode}
        empty={!values.title && !values.body}
      />
    </div>
  )
}

function ModeCard({
  title,
  description,
  icon,
  active,
  onClick,
}: {
  title: string
  description: string
  icon: React.ReactNode
  active?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex items-start gap-3 rounded-xl border bg-card p-4 text-left transition-all hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        active
          ? 'border-primary/40 bg-primary/5 shadow-sm ring-1 ring-primary/20'
          : 'border-border/60',
      )}
    >
      <span
        className={cn(
          'flex size-9 flex-none items-center justify-center rounded-lg',
          active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
        )}
      >
        {icon}
      </span>
      <div className="space-y-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </button>
  )
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string
  hint?: React.ReactNode
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-sm">
          {label}
          {required ? <span className="ml-0.5 text-destructive">*</span> : null}
        </Label>
        {hint != null ? (
          <span className="text-xs text-muted-foreground tabular-nums">{hint}</span>
        ) : null}
      </div>
      {children}
    </div>
  )
}

function ComposePreview({
  title,
  body,
  target,
  mode,
  empty,
}: {
  title: string
  body: string
  target: ComposeTarget
  mode: ComposeMode
  empty?: boolean
}) {
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-border/60">
        <CardHeader className="border-b border-border/60 bg-muted/40 py-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Live preview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-5">
          <div
            className={cn(
              'rounded-2xl border border-border/70 bg-gradient-to-br from-card to-muted/40 p-4 shadow-sm',
              empty && 'opacity-60',
            )}
          >
            <div className="flex items-start gap-3">
              <span className="flex size-9 flex-none items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Bell className="size-4" />
              </span>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Nubian
                  </p>
                  <span className="text-[10px] text-muted-foreground">now</span>
                </div>
                <p className="text-sm font-semibold leading-snug">{title}</p>
                <p className="text-xs leading-relaxed text-muted-foreground">{body}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <Stat label="Mode" value={mode === 'broadcast' ? 'Broadcast' : 'Marketing'} />
            <Stat
              label="Audience"
              value={
                target === 'specific'
                  ? 'Specific IDs'
                  : target === 'all'
                    ? 'All recipients'
                    : target === 'users'
                      ? 'Users'
                      : 'Merchants'
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-sky-500/5">
        <CardContent className="flex items-start gap-3 p-4 text-xs text-sky-800 dark:text-sky-200">
          <Users className="mt-0.5 size-4" />
          <p>
            With <code className="rounded bg-sky-500/10 px-1">ENABLE_QUEUE=true</code>{' '}
            the request returns immediately and recipients are processed by the fanout
            worker in the background.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  )
}
