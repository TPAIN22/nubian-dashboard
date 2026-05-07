'use client'

import { Check, ExternalLink } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

import { CHANNEL_LABELS } from '../constants'
import type { NotificationRecord } from '../types'
import { formatDateTime, formatRelativeTime } from '../utils'
import {
  NotificationCategoryBadge,
  NotificationStatusBadge,
} from './StatusBadge'

interface Props {
  notification: NotificationRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onMarkRead?: (id: string) => void
  isMarking?: boolean
}

export function NotificationDetailDrawer({
  notification,
  open,
  onOpenChange,
  onMarkRead,
  isMarking,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg flex flex-col gap-0 overflow-hidden p-0"
      >
        {notification ? (
          <>
            <SheetHeader className="border-b border-border/60 bg-muted/30 px-6 py-5 text-left">
              <div className="flex items-center gap-2">
                <NotificationStatusBadge status={notification.status} />
                <NotificationCategoryBadge category={notification.category} />
              </div>
              <SheetTitle className="mt-2 text-lg leading-tight">
                {notification.title}
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                {formatDateTime(notification.sentAt ?? notification.createdAt)} ·{' '}
                {formatRelativeTime(notification.sentAt ?? notification.createdAt)}
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
              <Section title="Body">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {notification.body}
                </p>
              </Section>

              <Section title="Delivery">
                <Field label="Type" value={<code className="text-xs">{notification.type}</code>} />
                <Field
                  label="Channel"
                  value={CHANNEL_LABELS[notification.channel] ?? notification.channel}
                />
                <Field label="Recipient type" value={notification.recipientType} className="capitalize" />
                {notification.recipientId ? (
                  <Field
                    label="Recipient ID"
                    value={
                      <code className="break-all text-xs">{notification.recipientId}</code>
                    }
                  />
                ) : null}
                {notification.priority ? (
                  <Field label="Priority" value={notification.priority} className="capitalize" />
                ) : null}
                {notification.deepLink ? (
                  <Field
                    label="Deep link"
                    value={
                      <span className="inline-flex items-center gap-1 text-xs text-primary">
                        <ExternalLink className="size-3" />
                        {notification.deepLink}
                      </span>
                    }
                  />
                ) : null}
              </Section>

              <Section title="Lifecycle">
                <Field label="Created" value={formatDateTime(notification.createdAt)} />
                {notification.sentAt ? (
                  <Field label="Sent" value={formatDateTime(notification.sentAt)} />
                ) : null}
                {notification.deliveredAt ? (
                  <Field label="Delivered" value={formatDateTime(notification.deliveredAt)} />
                ) : null}
                {notification.expiresAt ? (
                  <Field label="Expires" value={formatDateTime(notification.expiresAt)} />
                ) : null}
                {typeof notification.attempts === 'number' ? (
                  <Field label="Attempts" value={notification.attempts} />
                ) : null}
                {notification.lastAttemptAt ? (
                  <Field
                    label="Last attempt"
                    value={formatDateTime(notification.lastAttemptAt)}
                  />
                ) : null}
              </Section>

              {notification.lastError ? (
                <Section title="Error" tone="danger">
                  <p className="rounded-lg bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-300">
                    {notification.lastError}
                  </p>
                </Section>
              ) : null}

              {notification.metadata && Object.keys(notification.metadata).length > 0 ? (
                <Section title="Metadata">
                  <pre className="max-h-64 overflow-auto rounded-lg bg-muted/60 p-3 text-[11px] leading-relaxed">
                    {JSON.stringify(notification.metadata, null, 2)}
                  </pre>
                </Section>
              ) : null}
            </div>

            <SheetFooter className="flex-row items-center justify-between gap-2 border-t border-border/60 px-6 py-4">
              <span className="text-xs text-muted-foreground">
                {notification.isRead ? 'Marked as read' : 'Unread'}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
                {!notification.isRead && onMarkRead ? (
                  <Button
                    onClick={() => onMarkRead(notification._id)}
                    disabled={isMarking}
                  >
                    <Check className="mr-1 size-4" />
                    Mark as read
                  </Button>
                ) : null}
              </div>
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function Section({
  title,
  children,
  tone,
}: {
  title: string
  children: React.ReactNode
  tone?: 'danger'
}) {
  return (
    <section className="space-y-2">
      <h3
        className={
          tone === 'danger'
            ? 'text-xs font-semibold uppercase tracking-wide text-red-600 dark:text-red-400'
            : 'text-xs font-semibold uppercase tracking-wide text-muted-foreground'
        }
      >
        {title}
      </h3>
      <dl className="space-y-2 rounded-lg border border-border/60 bg-card/40 p-3 text-sm">
        {children}
      </dl>
    </section>
  )
}

function Field({
  label,
  value,
  className,
}: {
  label: string
  value: React.ReactNode
  className?: string
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={className ?? 'text-right font-medium'}>{value}</dd>
    </div>
  )
}
