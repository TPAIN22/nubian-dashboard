/**
 * Order invoice / packing sheet.
 *
 * ## Why this is not a jsPDF document
 *
 * The previous export rendered the invoice to HTML, rasterised it with
 * html2canvas into one very tall JPEG, and sliced that image across A4 pages.
 * Two things were wrong with it, both visible on any real order:
 *
 * 1. **Sections were cut in half.** The slicer worked in fixed page-height
 *    steps and knew nothing about the content, so a page break could land in
 *    the middle of the totals box or a table row.
 * 2. **The text was re-laid-out by html2canvas**, not by the browser. It has
 *    its own text measurement, which mangles Arabic word spacing and breaks
 *    Latin runs embedded in RTL text — an email came out as
 *    "mamyafreka @gmail .com".
 *
 * Neither is tunable; they are inherent to painting text into a bitmap.
 *
 * So the invoice is now a real document printed through the browser's own
 * pipeline. The engine that already shapes Arabic correctly on screen does the
 * pagination, which buys us, for free:
 *
 * - `break-inside: avoid` — a section or row is never split across pages
 * - `display: table-header-group` — the items table repeats its header on
 *   every page, the way an Amazon/Temu invoice does
 * - real vector text: selectable, searchable, sharp at any zoom, tiny file
 * - "Save as PDF" straight from the print dialog, or a real printer
 *
 * jsPDF is still capable of vector Arabic, but only with a bundled font plus
 * an Arabic reshaper and a bidi implementation — a lot of machinery to
 * reproduce what the browser already does perfectly.
 */

import {
  formatDateTime,
  formatMoney,
  getOrderCouponCode,
  joinMeaningful,
  type Order,
  type OrderLine,
} from "./types";
import { getPaymentMethodLabel, getOrderStatusMeta, getPaymentStatusMeta } from "./orderStatus";

export interface InvoiceTotals {
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
}

interface InvoiceInput {
  order: Order;
  lines: OrderLine[];
  totals: InvoiceTotals;
  currency: string;
}

function escapeHtml(input: unknown) {
  return String(input ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/** Renders a label/value pair, or nothing at all when the value is absent. */
function row(label: string, value: unknown) {
  const text = String(value ?? "").trim();
  if (!text || text === "غير محدد" || text === "—") return "";
  return `<div class="row"><span class="row-label">${escapeHtml(label)}</span><span class="row-value">${escapeHtml(text)}</span></div>`;
}

const STATUS_COLORS: Record<string, string> = {
  success: "#047857;background:#ecfdf5;border-color:#a7f3d0",
  warning: "#b45309;background:#fffbeb;border-color:#fde68a",
  danger: "#b91c1c;background:#fef2f2;border-color:#fecaca",
  info: "#0369a1;background:#f0f9ff;border-color:#bae6fd",
  muted: "#4b5563;background:#f9fafb;border-color:#e5e7eb",
};

const pill = (label: string, tone: string) =>
  `<span class="pill" style="color:${STATUS_COLORS[tone] ?? STATUS_COLORS.muted}">${escapeHtml(label)}</span>`;

/**
 * Exported so the invoice can be rendered without a DOM — for previewing the
 * layout, and for any future server-side use (emailing a receipt) that must
 * not depend on a browser being present.
 */
export function buildInvoiceHtml({ order, lines, totals, currency }: InvoiceInput) {
  const money = (n: number) => formatMoney(n, currency);
  const orderRef = order.orderNumber || order._id;
  const snap = order.addressSnapshot;

  const statusMeta = getOrderStatusMeta(String(order.status || ""));
  const paymentMeta = getPaymentStatusMeta(String(order.paymentStatus || ""));
  const couponCode = getOrderCouponCode(order);

  const address =
    snap?.formattedAddress ||
    joinMeaningful([snap?.street, snap?.neighborhood || snap?.area, snap?.city, snap?.country]) ||
    joinMeaningful([order.address, order.city]) ||
    "";

  const accessDetails = joinMeaningful(
    [
      snap?.building && `مبنى ${snap.building}`,
      snap?.floor && `طابق ${snap.floor}`,
      snap?.apartment && `شقة ${snap.apartment}`,
      snap?.landmark && `بالقرب من ${snap.landmark}`,
    ],
    " · ",
  );

  // Only reserve the thumbnail column when at least one line actually has an
  // image; otherwise every row renders an empty bordered box that reads as a
  // rendering fault rather than a missing photo.
  const hasThumbnails = lines.some((line) => !!line.image);

  const itemRows = lines
    .map(
      (line, index) => `
      <tr>
        <td class="c num">${index + 1}</td>
        ${
          hasThumbnails
            ? `<td class="thumb-cell">${
                line.image
                  ? `<img class="thumb" src="${escapeHtml(line.image)}" alt="">`
                  : `<span class="thumb"></span>`
              }</td>`
            : ""
        }
        <td>
          <div class="item-name">${escapeHtml(line.name)}</div>
          ${line.variantLabel ? `<div class="item-variant">${escapeHtml(line.variantLabel)}</div>` : ""}
        </td>
        <td class="c num">${line.quantity}</td>
        <td class="e num">${escapeHtml(money(line.unitPrice))}</td>
        <td class="e num strong">${escapeHtml(money(line.lineTotal))}</td>
      </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>فاتورة الطلب ${escapeHtml(orderRef)}</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  /* A4 with printer-safe margins. The browser paginates; nothing here slices
     a bitmap, so sections stay whole. */
  @page { size: A4; margin: 12mm 10mm; }

  * { box-sizing: border-box; }

  html, body {
    margin: 0;
    padding: 0;
    /* Without this the light section backgrounds are dropped by the print
       renderer and the document loses all its structure. */
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  body {
    font-family: 'Noto Sans Arabic', 'IBM Plex Sans Arabic', system-ui, -apple-system, Segoe UI, sans-serif;
    direction: rtl;
    color: #111827;
    font-size: 11.5px;
    line-height: 1.55;
    background: #fff;
  }

  .sheet { max-width: 190mm; margin: 0 auto; }

  /* ── Masthead ── */
  .masthead {
    display: flex; align-items: flex-start; justify-content: space-between;
    gap: 16px; padding-bottom: 12px; border-bottom: 2px solid #111827;
  }
  .brand { font-size: 21px; font-weight: 700; letter-spacing: -0.2px; }
  .brand small { display: block; font-size: 10px; font-weight: 500; color: #6b7280; letter-spacing: 0; }
  .doc-meta { text-align: left; font-size: 10.5px; color: #4b5563; }
  .doc-meta .doc-title { font-size: 13px; font-weight: 700; color: #111827; }
  .doc-meta .doc-ref { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; color: #111827; }

  /* ── Status strip ── */
  .pills { display: flex; flex-wrap: wrap; gap: 6px; margin: 12px 0 14px; }
  .pill {
    display: inline-block; padding: 3px 10px; border-radius: 999px;
    border: 1px solid; font-size: 10px; font-weight: 600;
  }

  /* ── Cards ── */
  .cards { display: flex; gap: 10px; }
  .card {
    flex: 1; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 12px;
    background: #fafafa;
    break-inside: avoid; page-break-inside: avoid;
  }
  .card h2 {
    margin: 0 0 7px; font-size: 10px; font-weight: 700; color: #6b7280;
    letter-spacing: .4px; text-transform: uppercase;
  }
  .row { display: flex; gap: 8px; padding: 1.5px 0; }
  .row-label { color: #6b7280; min-width: 58px; flex-shrink: 0; }
  .row-value { color: #111827; font-weight: 500; word-break: break-word; }

  /* ── Items ── */
  .items-title {
    margin: 16px 0 7px; font-size: 10px; font-weight: 700; color: #6b7280;
    letter-spacing: .4px; text-transform: uppercase;
  }
  table { width: 100%; border-collapse: collapse; }
  /* Repeats the column headings at the top of every printed page. */
  thead { display: table-header-group; }
  tr { break-inside: avoid; page-break-inside: avoid; }
  th {
    background: #f3f4f6; font-size: 9.5px; font-weight: 700; color: #374151;
    text-align: start; padding: 7px 8px; border-bottom: 1px solid #d1d5db;
    letter-spacing: .3px;
  }
  td { padding: 7px 8px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
  td.c, th.c { text-align: center; }
  td.e, th.e { text-align: end; }
  /* An amount is one atom. Without this "86,762.00 ج.س" breaks between the
     digits and the currency symbol and every price occupies two lines. */
  .num { font-variant-numeric: tabular-nums; white-space: nowrap; }
  .strong { font-weight: 700; }
  .item-name { font-weight: 600; }
  .item-variant { font-size: 9.5px; color: #6b7280; margin-top: 1px; }
  .thumb-cell { width: 34px; padding-inline-end: 0; }
  .thumb {
    display: block; width: 30px; height: 30px; object-fit: cover;
    border: 1px solid #e5e7eb; border-radius: 4px; background: #f9fafb;
  }

  /* ── Totals ── */
  .totals-wrap { display: flex; justify-content: flex-start; margin-top: 12px; }
  .totals {
    width: 62mm; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;
    break-inside: avoid; page-break-inside: avoid;
  }
  .totals .t-row { display: flex; justify-content: space-between; gap: 10px; padding: 5px 11px; }
  .totals .t-row + .t-row { border-top: 1px solid #f3f4f6; }
  .totals .t-label { color: #4b5563; }
  .totals .t-value { font-variant-numeric: tabular-nums; font-weight: 600; white-space: nowrap; }
  .totals .discount .t-value { color: #b91c1c; }
  .totals .grand {
    background: #111827; color: #fff; border-top: 0; padding: 8px 11px;
  }
  .totals .grand .t-label { color: #d1d5db; font-weight: 600; }
  .totals .grand .t-value { color: #fff; font-size: 13.5px; font-weight: 700; }

  /* ── Notes / footer ── */
  .notes {
    margin-top: 14px; padding: 9px 12px; border: 1px solid #e5e7eb;
    border-radius: 6px; background: #fafafa; font-size: 10.5px;
    break-inside: avoid; page-break-inside: avoid;
  }
  .notes h2 { margin: 0 0 4px; font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: .4px; }
  .footer {
    margin-top: 18px; padding-top: 9px; border-top: 1px solid #e5e7eb;
    display: flex; justify-content: space-between; gap: 10px;
    font-size: 9.5px; color: #9ca3af;
  }
</style>
</head>
<body>
<div class="sheet">

  <header class="masthead">
    <div class="brand">
      نوبيان
      <small>Nubian · منصة التجارة الإلكترونية</small>
    </div>
    <div class="doc-meta">
      <div class="doc-title">فاتورة الطلب</div>
      <div class="doc-ref">${escapeHtml(orderRef)}</div>
      <div>${escapeHtml(formatDateTime(order.createdAt || order.orderDate))}</div>
    </div>
  </header>

  <div class="pills">
    ${pill(statusMeta.label, statusMeta.tone)}
    ${pill(paymentMeta.label, paymentMeta.tone)}
    ${pill(getPaymentMethodLabel(order.paymentMethod), "muted")}
    ${couponCode ? pill(`كوبون: ${couponCode}`, "info") : ""}
  </div>

  <section class="cards">
    <div class="card">
      <h2>معلومات العميل</h2>
      ${row("الاسم", order.customerInfo?.name)}
      ${row("البريد", order.customerInfo?.email)}
      ${row("الهاتف", order.customerInfo?.phone || order.phoneNumber)}
      ${row("واتساب", snap?.whatsapp)}
    </div>

    <div class="card">
      <h2>عنوان الشحن</h2>
      ${row("المستلم", snap?.name || order.customerInfo?.name)}
      ${row("العنوان", address)}
      ${row("الوصول", accessDetails)}
      ${row("هاتف", snap?.phone)}
    </div>
  </section>

  <h2 class="items-title">المنتجات (${lines.length})</h2>
  <table>
    <thead>
      <tr>
        <th class="c" style="width:22px">#</th>
        ${hasThumbnails ? `<th style="width:34px"></th>` : ""}
        <th>المنتج</th>
        <th class="c" style="width:44px">الكمية</th>
        <th class="e" style="width:26mm">سعر الوحدة</th>
        <th class="e" style="width:28mm">الإجمالي</th>
      </tr>
    </thead>
    <tbody>
      ${
        itemRows ||
        `<tr><td colspan="${hasThumbnails ? 6 : 5}" class="c" style="color:#9ca3af;padding:16px">لا توجد منتجات مرتبطة بهذا الطلب</td></tr>`
      }
    </tbody>
  </table>

  <div class="totals-wrap">
    <div class="totals">
      <div class="t-row"><span class="t-label">المجموع الفرعي</span><span class="t-value">${escapeHtml(money(totals.subtotal))}</span></div>
      <div class="t-row"><span class="t-label">الشحن</span><span class="t-value">${escapeHtml(money(totals.shipping))}</span></div>
      ${
        totals.discount > 0
          // `bdi dir="ltr"` keeps the sign glued to the digits. In an RTL
          // paragraph a bare leading "−" is a neutral character and the bidi
          // algorithm reorders it to the far side of the amount.
          ? `<div class="t-row discount"><span class="t-label">الخصم${couponCode ? ` (${escapeHtml(couponCode)})` : ""}</span><span class="t-value"><bdi dir="ltr">−${escapeHtml(money(totals.discount))}</bdi></span></div>`
          : ""
      }
      <div class="t-row grand"><span class="t-label">الإجمالي</span><span class="t-value">${escapeHtml(money(totals.total))}</span></div>
    </div>
  </div>

  ${
    snap?.notes || order.bankakApproval?.reason
      ? `<section class="notes">
           <h2>ملاحظات</h2>
           ${snap?.notes ? `<div>${escapeHtml(snap.notes)}</div>` : ""}
           ${order.bankakApproval?.reason ? `<div>سبب رفض التحويل: ${escapeHtml(order.bankakApproval.reason)}</div>` : ""}
         </section>`
      : ""
  }

  <footer class="footer">
    <span>تم إنشاء هذا المستند بواسطة نظام نوبيان</span>
    <span>${escapeHtml(orderRef)} · ${escapeHtml(formatDateTime(new Date().toISOString()))}</span>
  </footer>

</div>
</body>
</html>`;
}

/**
 * Waits for the print document to be genuinely paintable.
 *
 * Printing too early is the classic failure here: the dialog opens against a
 * half-loaded document and the output falls back to a system font or drops the
 * product thumbnails. Fonts and images are awaited separately, each with its
 * own cap so one dead CDN can't block the export.
 */
async function waitForAssets(doc: Document, timeoutMs: number) {
  const deadline = new Promise<void>((resolve) => setTimeout(resolve, timeoutMs));

  const fonts = (async () => {
    try {
      const set: FontFaceSet | undefined = (doc as any).fonts;
      if (set?.ready) await set.ready;
    } catch {
      // No FontFaceSet — the fallback stack is already in place.
    }
  })();

  const images = (async () => {
    const pending = Array.from(doc.images).filter((img) => !img.complete);
    await Promise.all(
      // `resolve` on error too: a broken thumbnail must not hold up the invoice.
      pending.map(
        (img) =>
          new Promise<void>((resolve) => {
            img.addEventListener("load", () => resolve(), { once: true });
            img.addEventListener("error", () => resolve(), { once: true });
          }),
      ),
    );
  })();

  await Promise.race([Promise.all([fonts, images]), deadline]);
}

/**
 * Builds the invoice and opens the browser's print dialog for it.
 *
 * Rendered inside an off-screen iframe rather than a popup window so it is
 * never eaten by a popup blocker and inherits the app's CSP (which already
 * allows the Google Fonts origins).
 */
export async function printOrderInvoice(input: InvoiceInput): Promise<void> {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.setAttribute("tabindex", "-1");
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
  document.body.appendChild(iframe);

  let cleanedUp = false;
  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    iframe.remove();
  };

  try {
    const doc = iframe.contentDocument;
    const win = iframe.contentWindow;
    if (!doc || !win) throw new Error("Unable to access the print document");

    doc.open();
    doc.write(buildInvoiceHtml(input));
    doc.close();

    if (doc.readyState !== "complete") {
      await new Promise<void>((resolve) => {
        iframe.addEventListener("load", () => resolve(), { once: true });
        // The load event has already fired in some engines by the time we
        // attach; don't hang the export waiting for one that isn't coming.
        setTimeout(resolve, 1500);
      });
    }

    await waitForAssets(doc, 4000);

    // Tear down once the dialog closes. `afterprint` is the reliable signal in
    // Chrome/Firefox/Edge; the timer covers engines that never fire it, and
    // removing the iframe any earlier would cancel the print job.
    win.addEventListener("afterprint", cleanup, { once: true });
    setTimeout(cleanup, 120_000);

    win.focus();
    win.print();
  } catch (error) {
    cleanup();
    throw error;
  }
}
