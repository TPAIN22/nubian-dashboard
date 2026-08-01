import React from "react";
import { EmptyState as AdminEmptyState } from "@/components/admin/feedback";

/**
 * Adapter over the admin design system's `EmptyState`.
 *
 * The old version was a 400px-tall dashed box with a 80px circle in it — on a
 * list page that mostly renders when something has gone quiet, it shouted. The
 * system version is compact, uses a hairline instead of a dashed border, and
 * puts the action next to the message rather than 32px below it.
 */
interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <AdminEmptyState
      size="page"
      icon={icon}
      title={title}
      description={description}
      action={action}
      className={className}
    />
  );
}
