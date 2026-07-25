import { ToneBadge } from "@/components/dashboard/ToneBadge";
import { cn } from "@/lib/utils";

import { getOrderStatusMeta, getPaymentStatusMeta } from "./orderStatus";

/**
 * Status pills. Thin wrappers so a status is coloured identically in the table,
 * the drawer and the mobile card — the table used to hold its own ternary
 * chain, which is why "PROCESSING" rendered grey there and un-styled elsewhere.
 */

export function OrderStatusBadge({ status, className }: { status?: string; className?: string }) {
  const meta = getOrderStatusMeta(status);
  return (
    <ToneBadge tone={meta.tone} className={cn("whitespace-nowrap", className)}>
      {meta.label}
    </ToneBadge>
  );
}

export function PaymentStatusBadge({ status, className }: { status?: string; className?: string }) {
  const meta = getPaymentStatusMeta(status);
  return (
    <ToneBadge tone={meta.tone} className={cn("whitespace-nowrap", className)}>
      {meta.label}
    </ToneBadge>
  );
}
