"use client";

import { useState, useEffect, useCallback } from "react";
import {
  IconRefresh,
  IconLoader2,
  IconArrowsExchange,
  IconCheck,
  IconAlertTriangle,
  IconCloudOff,
  IconEdit,
  IconSearch,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CurrencyRow {
  _id: string;
  code: string;
  name: string;
  nameAr?: string;
  symbol: string;
  isActive: boolean;
  allowManualRate: boolean;
  manualRate?: number | null;
  manualRateUpdatedAt?: string | null;
  currentRate?: number | null;
  rateSource?: "system" | "manual" | "frankfurter" | string | null;
  rateUnavailable?: boolean;
  rateDate?: string | null;
}

interface ApiStatus {
  hasRates: boolean;
  date?: string;
  fetchedAt?: string;
  provider?: string;
  fetchStatus?: "success" | "partial" | "failed";
  missingCurrencies?: string[];
  ageHours?: number;
}

function SourceBadge({
  source,
  unavailable,
}: {
  source?: string | null;
  unavailable?: boolean;
}) {
  if (unavailable || !source) {
    return (
      <Badge
        variant="outline"
        className="text-red-600 border-red-300 bg-red-50 gap-1"
      >
        <IconCloudOff className="h-3 w-3" />
        غير متوفر
      </Badge>
    );
  }
  if (source === "manual") {
    return (
      <Badge
        variant="outline"
        className="text-amber-700 border-amber-300 bg-amber-50"
      >
        يدوي ✎
      </Badge>
    );
  }
  if (source === "system") {
    return (
      <Badge
        variant="outline"
        className="text-blue-700 border-blue-300 bg-blue-50"
      >
        ثابت
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="text-green-700 border-green-300 bg-green-50 gap-1"
    >
      <IconCheck className="h-3 w-3" />
      API
    </Badge>
  );
}

/* ─── Edit dialog ─────────────────────────────────────────── */
function EditRateDialog({
  currency,
  open,
  onClose,
  onSaved,
}: {
  currency: CurrencyRow;
  open: boolean;
  onClose: () => void;
  onSaved: (code: string, newRate: number) => void;
}) {
  const [value, setValue] = useState(
    currency.manualRate ? String(currency.manualRate) : ""
  );
  const [saving, setSaving] = useState(false);

  // Reset value when a different currency is opened
  useEffect(() => {
    setValue(currency.manualRate ? String(currency.manualRate) : "");
  }, [currency]);

  const handleSave = async () => {
    const rate = parseFloat(value);
    if (!rate || rate <= 0) {
      toast.error("أدخل قيمة صحيحة أكبر من صفر");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/currencies/${currency.code}/manual-rate`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ manualRate: rate }),
        }
      );
      const json = await res.json();
      if (res.ok) {
        toast.success(
          `✓ تم الحفظ: 1 USD = ${rate} ${currency.code}`
        );
        onSaved(currency.code, rate);
        onClose();
      } else {
        toast.error(json.message || "فشل في الحفظ");
      }
    } catch {
      toast.error("خطأ في الاتصال");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir="rtl" className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            تحديث سعر صرف {currency.code}
          </DialogTitle>
          <DialogDescription>
            {currency.nameAr || currency.name} · {currency.symbol}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* current rate info */}
          {currency.currentRate && !currency.rateUnavailable && (
            <div className="rounded-lg border bg-muted/40 p-3 text-sm flex justify-between">
              <span className="text-muted-foreground">السعر الحالي</span>
              <span className="font-mono font-semibold">
                1 USD = {Number(currency.currentRate).toFixed(4)}{" "}
                {currency.code}
                <span className="mr-2 text-xs text-muted-foreground font-normal">
                  ({currency.rateSource === "manual" ? "يدوي" : "API"})
                </span>
              </span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="rate-input">
              السعر الجديد — كم {currency.code} يساوي 1 دولار؟
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                1 USD =
              </span>
              <Input
                id="rate-input"
                type="number"
                min="0.000001"
                step="any"
                placeholder="مثال: 650"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="font-mono"
                dir="ltr"
                autoFocus
              />
              <span className="text-sm font-semibold whitespace-nowrap">
                {currency.code}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              سيُستخدم هذا السعر اليدوي في التطبيق ويتجاوز سعر API
              تلقائياً.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            إلغاء
          </Button>
          <Button onClick={handleSave} disabled={saving || !value.trim()}>
            {saving && (
              <IconLoader2 className="h-4 w-4 animate-spin ml-2" />
            )}
            حفظ السعر
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Main page ───────────────────────────────────────────── */
export default function FxRatesClient() {
  const [currencies, setCurrencies] = useState<CurrencyRow[]>([]);
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [editTarget, setEditTarget] = useState<CurrencyRow | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [currRes, fxRes] = await Promise.all([
        fetch("/api/admin/currencies"),
        fetch("/api/admin/fx-rates"),
      ]);

      if (currRes.ok) {
        const json = await currRes.json();
        setCurrencies(json.data ?? []);
      } else {
        toast.error("فشل في تحميل قائمة العملات");
      }

      if (fxRes.ok) {
        const json = await fxRes.json();
        setApiStatus(json.data ?? null);
      }
    } catch {
      toast.error("خطأ في الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleApiRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/fx-rates", { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        toast.success(`تم جلب ${json.data?.ratesCount ?? 0} سعر من API`);
        loadAll();
      } else {
        toast.error(json.message || "فشل في تحديث API");
      }
    } catch {
      toast.error("خطأ أثناء التحديث");
    } finally {
      setRefreshing(false);
    }
  };

  const handleRateSaved = (code: string, newRate: number) => {
    setCurrencies((prev) =>
      prev.map((c) =>
        c.code === code
          ? {
              ...c,
              manualRate: newRate,
              allowManualRate: true,
              currentRate: newRate,
              rateSource: "manual",
              rateUnavailable: false,
              manualRateUpdatedAt: new Date().toISOString(),
            }
          : c
      )
    );
  };

  const filtered = currencies.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.nameAr && c.nameAr.includes(search))
  );

  const missing = currencies.filter(
    (c) => c.rateUnavailable && c.code !== "USD"
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            إدارة أسعار الصرف
          </h1>
          <p className="text-muted-foreground mt-1">
            اضغط <strong>تعديل السعر</strong> على أي عملة لتعيين سعر يدوي
            يستخدمه التطبيق
          </p>
        </div>
        <Button
          onClick={handleApiRefresh}
          disabled={refreshing}
          variant="outline"
        >
          {refreshing ? (
            <>
              <IconLoader2 className="h-4 w-4 animate-spin ml-2" />
              جارٍ الجلب...
            </>
          ) : (
            <>
              <IconRefresh className="h-4 w-4 ml-2" />
              تحديث من API
            </>
          )}
        </Button>
      </div>

      {/* API status bar */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-6 items-center text-sm">
            <div className="flex items-center gap-2">
              <IconArrowsExchange className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">مصدر API:</span>
              <span className="font-medium capitalize">
                {apiStatus?.provider ?? "—"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">آخر جلب:</span>
              <span className="font-medium">{apiStatus?.date ?? "—"}</span>
            </div>
            {apiStatus?.ageHours !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">عمر البيانات:</span>
                <span
                  className={`font-medium ${
                    apiStatus.ageHours > 24
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {apiStatus.ageHours} ساعة
                </span>
              </div>
            )}
            {apiStatus?.fetchStatus && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">الحالة:</span>
                {apiStatus.fetchStatus === "success" && (
                  <Badge className="bg-green-100 text-green-700 border border-green-200 hover:bg-green-100">
                    ناجح
                  </Badge>
                )}
                {apiStatus.fetchStatus === "partial" && (
                  <Badge className="bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-100">
                    جزئي
                  </Badge>
                )}
                {apiStatus.fetchStatus === "failed" && (
                  <Badge variant="destructive">فشل</Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Missing rates alert */}
      {missing.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2 text-amber-800 dark:text-amber-300">
              <IconAlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">
                  {missing.length} عملة بدون سعر — ستظهر أسعار غير محددة
                  في التطبيق:
                </p>
                <p className="text-sm mt-1">
                  {missing
                    .map((c) => `${c.code} (${c.nameAr || c.name})`)
                    .join("، ")}
                </p>
                <p className="text-xs mt-2 opacity-80">
                  اضغط «تعديل السعر» على كل عملة وأدخل السعر اليدوي.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle>
            العملات ({currencies.length})
          </CardTitle>
          <div className="relative w-56">
            <IconSearch className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9 h-8 text-sm"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right pr-4">العملة</TableHead>
                <TableHead className="text-right">السعر الحالي</TableHead>
                <TableHead className="text-right">المصدر</TableHead>
                <TableHead className="text-right">آخر تحديث</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-left pl-4"> </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-10 text-muted-foreground italic"
                  >
                    لا توجد عملات مطابقة
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((currency) => (
                  <TableRow
                    key={currency._id}
                    className={!currency.isActive ? "opacity-50" : ""}
                  >
                    {/* Currency name */}
                    <TableCell className="pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-base">
                          {currency.code}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          {currency.symbol}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {currency.nameAr || currency.name}
                      </p>
                    </TableCell>

                    {/* Current rate */}
                    <TableCell className="font-mono">
                      {currency.code === "USD" ? (
                        <span className="font-bold">1.0000</span>
                      ) : currency.currentRate ? (
                        <span
                          className={
                            currency.rateSource === "manual"
                              ? "text-amber-700 font-semibold"
                              : ""
                          }
                        >
                          {Number(currency.currentRate).toFixed(4)}
                        </span>
                      ) : (
                        <span className="text-red-500">—</span>
                      )}
                    </TableCell>

                    {/* Source badge */}
                    <TableCell>
                      <SourceBadge
                        source={currency.rateSource}
                        unavailable={currency.rateUnavailable}
                      />
                    </TableCell>

                    {/* Last updated */}
                    <TableCell className="text-xs text-muted-foreground">
                      {currency.rateSource === "manual" &&
                      currency.manualRateUpdatedAt
                        ? new Date(
                            currency.manualRateUpdatedAt
                          ).toLocaleDateString("ar")
                        : currency.rateDate
                        ? currency.rateDate
                        : "—"}
                    </TableCell>

                    {/* Active */}
                    <TableCell>
                      {currency.isActive ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border border-green-200">
                          نشط
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-muted-foreground"
                        >
                          معطّل
                        </Badge>
                      )}
                    </TableCell>

                    {/* Edit button */}
                    <TableCell className="text-left pl-4">
                      {currency.code !== "USD" && (
                        <Button
                          size="sm"
                          variant={
                            currency.rateUnavailable ? "default" : "outline"
                          }
                          className={
                            currency.rateUnavailable
                              ? "bg-red-600 hover:bg-red-700 text-white"
                              : ""
                          }
                          onClick={() => setEditTarget(currency)}
                        >
                          <IconEdit className="h-4 w-4 ml-1" />
                          تعديل السعر
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center pb-2">
        السعر اليدوي يتجاوز سعر API تلقائياً · SDG وغيرها من العملات غير المدعومة تحتاج دائماً لسعر يدوي
      </p>

      {/* Edit dialog */}
      {editTarget && (
        <EditRateDialog
          currency={editTarget}
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={handleRateSaved}
        />
      )}
    </div>
  );
}
