"use client";

/**
 * Admin address browser.
 *
 * Read-only by design: an admin looking at where orders go should not be able
 * to silently rewrite a shopper's saved address. Past orders are immune either
 * way — each carries its own immutable snapshot taken at checkout.
 *
 * Shows both address generations side by side. The migration progress strip at
 * the top is the operational answer to "how far through the map migration are
 * we", which is the whole reason `isLegacy` is tracked on the model.
 */
import { useEffect, useMemo, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Home,
  MapPin,
  Search,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MapThumbnail from "@/components/geo/MapThumbnail";
import {
  fetchAdminAddresses,
  fetchAdminAddressStats,
  fetchGeoConfig,
  type AdminAddressQuery,
  type AdminAddressRow,
} from "@/lib/geo";

const PAGE_SIZE = 12;

const LABEL_ICONS: Record<string, typeof Home> = {
  home: Home,
  work: Briefcase,
  other: MapPin,
};

const LABEL_TEXT: Record<string, string> = {
  home: "المنزل",
  work: "العمل",
  other: "آخر",
};

const SOURCE_TEXT: Record<string, string> = {
  gps: "تحديد تلقائي (GPS)",
  map_pin: "تحديد على الخريطة",
  search: "من نتائج البحث",
  geocoded: "مستنتج من النص",
  migrated: "مُرحّل تلقائياً",
  legacy: "عنوان قديم",
  manual: "إدخال يدوي",
};

/** Confidence badge styling — the operationally useful signal on this screen. */
const CONFIDENCE_TEXT: Record<string, string> = {
  high: "موثوق",
  medium: "متوسط",
  low: "ضعيف",
};

const CONFIDENCE_CLASS: Record<string, string> = {
  high: "text-emerald-600",
  medium: "text-amber-600",
  low: "text-red-600",
};

/** `undefined` means "no filter"; the Select needs a concrete sentinel value. */
const ALL = "__all__";

export default function AddressesClient() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [label, setLabel] = useState<string>(ALL);
  const [coverage, setCoverage] = useState<string>(ALL);
  const [sort, setSort] = useState<string>("updatedAt:desc");
  const [page, setPage] = useState(1);

  // Debounce so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: config } = useQuery({
    queryKey: ["geo-config"],
    queryFn: fetchGeoConfig,
    staleTime: 60 * 60 * 1000, // provider config changes on deploy, not per view
  });

  const { data: stats } = useQuery({
    queryKey: ["admin-address-stats"],
    queryFn: fetchAdminAddressStats,
    staleTime: 5 * 60 * 1000,
  });

  const query: AdminAddressQuery = useMemo(() => {
    const [sortBy, sortOrder] = sort.split(":") as [
      AdminAddressQuery["sortBy"],
      AdminAddressQuery["sortOrder"],
    ];

    return {
      search: debouncedSearch || undefined,
      label: label === ALL ? undefined : label,
      hasCoordinates:
        coverage === ALL ? undefined : coverage === "pinned",
      sortBy,
      sortOrder,
      page,
      limit: PAGE_SIZE,
    };
  }, [debouncedSearch, label, coverage, sort, page]);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin-addresses", query],
    queryFn: () => fetchAdminAddresses(query),
    // Keep the previous page visible while the next loads, so paging doesn't
    // flash an empty table.
    placeholderData: keepPreviousData,
  });

  const rows = data?.rows ?? [];
  const totalPages = data?.totalPages ?? 0;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6" dir="rtl">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">العناوين</h1>
        <p className="text-sm text-muted-foreground">
          عناوين التوصيل المحفوظة للعملاء، مع الموقع على الخريطة والإحداثيات
        </p>
      </header>

      {/* Migration progress */}
      {stats ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="إجمالي العناوين" value={stats.total.toLocaleString("ar-EG")} />
          <StatCard
            label="محددة على الخريطة"
            value={stats.withCoordinates.toLocaleString("ar-EG")}
            hint={`${stats.migratedPct}%`}
          />
          <StatCard
            label="بدون موقع"
            value={stats.withoutCoordinates.toLocaleString("ar-EG")}
          />
          <StatCard label="عناوين قديمة" value={stats.legacy.toLocaleString("ar-EG")} />
        </div>
      ) : null}

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالاسم، الهاتف، العنوان، المدينة أو المعلم"
              className="pr-9"
              aria-label="بحث في العناوين"
            />
          </div>

          <Select
            value={label}
            onValueChange={(v) => {
              setLabel(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full md:w-40" aria-label="تصفية حسب النوع">
              <SelectValue placeholder="النوع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>كل الأنواع</SelectItem>
              <SelectItem value="home">المنزل</SelectItem>
              <SelectItem value="work">العمل</SelectItem>
              <SelectItem value="other">آخر</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={coverage}
            onValueChange={(v) => {
              setCoverage(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full md:w-44" aria-label="تصفية حسب الموقع">
              <SelectValue placeholder="الموقع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>الكل</SelectItem>
              <SelectItem value="pinned">محدد على الخريطة</SelectItem>
              <SelectItem value="unpinned">بدون موقع</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-full md:w-44" aria-label="ترتيب">
              <SelectValue placeholder="ترتيب" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updatedAt:desc">الأحدث تعديلاً</SelectItem>
              <SelectItem value="createdAt:desc">الأحدث إضافة</SelectItem>
              <SelectItem value="createdAt:asc">الأقدم إضافة</SelectItem>
              <SelectItem value="city:asc">المدينة (أ–ي)</SelectItem>
              <SelectItem value="name:asc">الاسم (أ–ي)</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Results */}
      {isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <p className="text-sm text-muted-foreground">تعذّر تحميل العناوين.</p>
            <Button variant="outline" onClick={() => refetch()}>
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl border bg-muted/40" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-12 text-center">
            <MapPin className="h-6 w-6 text-muted-foreground" aria-hidden />
            <p className="text-sm text-muted-foreground">لا توجد عناوين مطابقة</p>
          </CardContent>
        </Card>
      ) : (
        <div
          className={`grid gap-4 md:grid-cols-2 xl:grid-cols-3 ${
            isFetching ? "opacity-60 transition-opacity" : ""
          }`}
        >
          {rows.map((row) => (
            <AddressCard key={row._id} row={row} config={config} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
            السابق
          </Button>
          <span className="text-sm text-muted-foreground">
            صفحة {page} من {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            التالي
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-baseline gap-2 pt-0">
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
        {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      </CardContent>
    </Card>
  );
}

function AddressCard({
  row,
  config,
}: {
  row: AdminAddressRow;
  config: Parameters<typeof MapThumbnail>[0]["config"] | undefined;
}) {
  const LabelIcon = LABEL_ICONS[row.addressLabel] ?? MapPin;

  const details = [
    row.building && `مبنى ${row.building}`,
    row.floor && `طابق ${row.floor}`,
    row.apartment && `شقة ${row.apartment}`,
    row.landmark && `بالقرب من ${row.landmark}`,
  ]
    .filter(Boolean)
    .join(" · ");

  const customer =
    typeof row.user === "object" && row.user
      ? row.user.name || row.user.email || row.user._id
      : null;

  return (
    <Card className="overflow-hidden">
      {config ? (
        <MapThumbnail
          latitude={row.latitude}
          longitude={row.longitude}
          config={config}
          width={400}
          height={140}
          className="w-full rounded-none border-0 border-b"
        />
      ) : null}

      <CardContent className="flex flex-col gap-2 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <LabelIcon className="h-3 w-3" aria-hidden />
            {LABEL_TEXT[row.addressLabel] ?? row.addressLabel}
          </Badge>

          {row.isDefault ? (
            <Badge variant="default" className="gap-1">
              <Star className="h-3 w-3" aria-hidden />
              افتراضي
            </Badge>
          ) : null}

          {row.isLegacy ? (
            <Badge variant="outline" className="text-amber-600">
              عنوان قديم
            </Badge>
          ) : null}

          <Badge
            variant="outline"
            className={CONFIDENCE_CLASS[row.addressConfidence] ?? "text-muted-foreground"}
          >
            دقة: {CONFIDENCE_TEXT[row.addressConfidence] ?? row.addressConfidence}
          </Badge>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="font-medium leading-tight">{row.name || "—"}</span>
          {customer ? (
            <span className="text-xs text-muted-foreground">العميل: {customer}</span>
          ) : null}
        </div>

        <p className="text-sm leading-snug text-muted-foreground">
          {row.formattedAddress || "—"}
        </p>

        {details ? (
          <p className="text-xs leading-snug text-muted-foreground">{details}</p>
        ) : null}

        <dl className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 border-t pt-2 text-xs">
          <Row term="المدينة" value={row.city || "—"} />
          <Row term="الدولة" value={row.country || row.countryCode || "—"} />
          <Row term="الهاتف" value={row.phone || "—"} />
          <Row
            term="الإحداثيات"
            value={
              row.hasCoordinates
                ? `${row.latitude!.toFixed(5)}, ${row.longitude!.toFixed(5)}`
                : "—"
            }
            mono
          />
          <Row
            term="المصدر"
            value={SOURCE_TEXT[row.locationSource] ?? row.locationSource}
          />
          <Row
            term="نطاق الدقة"
            value={
              typeof row.locationAccuracyMeters === "number"
                ? `± ${Math.round(row.locationAccuracyMeters)} م`
                : "—"
            }
          />
          {row.plusCode ? <Row term="Plus Code" value={row.plusCode} mono /> : null}
        </dl>
      </CardContent>
    </Card>
  );
}

function Row({
  term,
  value,
  mono,
}: {
  term: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-1 overflow-hidden">
      <dt className="shrink-0 text-muted-foreground">{term}:</dt>
      <dd className={`truncate ${mono ? "font-mono text-[11px]" : ""}`} title={value}>
        {value}
      </dd>
    </div>
  );
}
