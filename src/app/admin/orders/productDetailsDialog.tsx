"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { formatMoney, type OrderLine } from "./types";

/**
 * Per-line product inspector, opened from the drawer's item list.
 *
 * Previously this lived inside `ordersTable.tsx` and was triggered by clicking
 * a product name in the table cell — an interaction that fought with the row
 * click and was impossible to hit on a truncated name. It now hangs off the
 * drawer, where there is room for a real list, and reads `line.raw` so it can
 * surface the merchant-pricing fields the normalised `OrderLine` doesn't model.
 */

interface Props {
  line: OrderLine | null;
  currency: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductDetailsDialog({ line, currency, open, onOpenChange }: Props) {
  const raw = line?.raw ?? {};
  const product = raw.product ?? raw;
  const images: string[] = Array.isArray(product?.images) ? product.images : [];

  const pricing = [
    { label: "سعر التاجر", value: raw.merchantPrice },
    { label: "هامش نوبيان", value: raw.nubianMarkup, suffix: "%" },
    { label: "هامش ديناميكي", value: raw.dynamicMarkup, suffix: "%" },
  ].filter((row) => typeof row.value === "number" && row.value > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-start">{line?.name ?? "تفاصيل المنتج"}</DialogTitle>
        </DialogHeader>

        {line ? (
          <div className="space-y-5">
            {images.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {images.slice(0, 6).map((image, index) => (
                  <img
                    key={`${image}-${index}`}
                    src={image}
                    alt={`${line.name} ${index + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="h-28 w-full rounded-lg border border-border/60 bg-muted object-cover"
                  />
                ))}
              </div>
            ) : null}

            <dl className="grid grid-cols-2 gap-4 rounded-lg border border-border/60 bg-card/40 p-4 text-sm">
              <Field label="الكمية" value={line.quantity} />
              <Field label="سعر الوحدة" value={formatMoney(line.unitPrice, currency)} />
              <Field label="إجمالي السطر" value={formatMoney(line.lineTotal, currency)} />
              {line.variantLabel ? <Field label="الخصائص" value={line.variantLabel} /> : null}
              {product?.category ? <Field label="الفئة" value={String(product.category)} /> : null}
              {typeof product?.stock === "number" ? (
                <Field label="المخزون" value={product.stock} />
              ) : null}
              {raw.variantId ? (
                <Field
                  label="معرف المتغير"
                  value={<code className="break-all text-xs">{String(raw.variantId)}</code>}
                />
              ) : null}
            </dl>

            {pricing.length > 0 ? (
              <div className="space-y-2 rounded-lg border border-border/60 bg-card/40 p-4">
                <h3 className="text-xs font-semibold text-muted-foreground">تفاصيل التسعير</h3>
                <dl className="space-y-1.5 text-sm">
                  {pricing.map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-3">
                      <dt className="text-muted-foreground">{row.label}</dt>
                      <dd className="font-medium tabular-nums">
                        {row.suffix
                          ? `${row.value}${row.suffix}`
                          : formatMoney(row.value as number, currency)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}

            {product?.description ? (
              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-muted-foreground">الوصف</h3>
                <p className="text-sm leading-relaxed">{String(product.description)}</p>
              </div>
            ) : null}
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

export default ProductDetailsDialog;
