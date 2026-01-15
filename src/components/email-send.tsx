import * as React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Link,
  Preview,
  Section,
  Row,
  Column,
  Img,
} from "@react-email/components";

/**
 * Props
 * - Important: newStatus / oldStatus / paymentStatus should accept BOTH:
 *   - new enums: PENDING, AWAITING_PAYMENT_CONFIRMATION, ...
 *   - legacy: pending, confirmed, ...
 */
interface OrderStatusUpdateEmailProps {
  orderNumber: string;
  userName: string;

  newStatus: string;
  oldStatus?: string;

  paymentStatus: string;
  paymentMethod?: string;

  totalAmount: number;
  currency?: string; // default: "ج.س"

  products: { name: string; quantity: number; price: number }[];

  // Optional breakdown (if you have it)
  subtotal?: number;
  shippingFee?: number;
  discountAmount?: number;
  finalTotal?: number;

  companyName?: string;
  logoUrl?: string;
  supportEmail?: string;
  trackingUrl?: string;
  language?: "ar" | "en";
}

/**
 * Normalize enum strings to a consistent key.
 * - "AWAITING_PAYMENT_CONFIRMATION" => "awaiting_payment_confirmation"
 * - "pending" => "pending"
 */
function normalizeKey(v: any) {
  return String(v ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

/**
 * Safe number
 */
function n(v: any, fallback = 0) {
  const x = Number(v);
  return Number.isFinite(x) ? x : fallback;
}

function formatMoney(value: number, language: "ar" | "en") {
  try {
    return value.toLocaleString(language === "ar" ? "ar-EG" : "en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch {
    return String(value.toFixed(2));
  }
}

/**
 * Labels + translations that MATCH your NEW dashboard statuses
 */
const translations = {
  ar: {
    preview: (orderNumber: string, newStatus: string) =>
      `تحديث حالة طلبك #${orderNumber} - ${newStatus}`,
    greeting: (userName: string) => `مرحباً ${userName} 👋`,
    mainMessage: "نود إعلامك بأنه قد تم تحديث حالة طلبك رقم",
    orderDetails: "📋 تفاصيل الطلب",
    oldStatus: "الحالة السابقة:",
    newStatus: "الحالة الحالية:",
    paymentStatus: "حالة الدفع:",
    paymentMethod: "طريقة الدفع:",
    totalAmount: "الإجمالي:",
    subtotal: "المجموع الفرعي:",
    shipping: "الشحن:",
    discount: "الخصم:",
    finalTotal: "الإجمالي النهائي:",
    products: "🛍️ المنتجات",
    product: "المنتج",
    quantity: "الكمية",
    unitPrice: "سعر الوحدة",
    lineTotal: "الإجمالي",
    trackOrder: "تتبع الطلب",
    ifAnyQuestion: "إذا كان لديك أي استفسار، تواصل معنا على ",
    thanks: (companyName: string) => `شكراً لثقتك بنا! 💙\nفريق ${companyName}`,
    autoEmail: "هذا الإيميل تم إرساله تلقائياً، يرجى عدم الرد عليه مباشرة.",

    statuses: {
      // New system
      pending: "بانتظار التأكيد",
      awaiting_payment_confirmation: "بانتظار موافقة التحويل",
      confirmed: "تم التأكيد",
      processing: "قيد التجهيز",
      shipped: "تم الشحن",
      delivered: "تم التسليم",
      cancelled: "ملغي",
      payment_failed: "فشل الدفع",

      // Legacy (just in case)
      delivered_to_customer: "تم التسليم",
    },

    paymentStatuses: {
      // New system
      unpaid: "غير مدفوع",
      pending_confirmation: "بانتظار موافقة التحويل",
      paid: "مدفوع",
      rejected: "مرفوض",
      failed: "فشل",

      // Legacy (fallbacks)
      pending: "عند الاستلام",
      refunded: "تم الاسترداد",
    },
  },

  en: {
    preview: (orderNumber: string, newStatus: string) =>
      `Order #${orderNumber} status update - ${newStatus}`,
    greeting: (userName: string) => `Hello ${userName} 👋`,
    mainMessage: "We’d like to let you know your order status has been updated:",
    orderDetails: "📋 Order Details",
    oldStatus: "Previous Status:",
    newStatus: "Current Status:",
    paymentStatus: "Payment Status:",
    paymentMethod: "Payment Method:",
    totalAmount: "Total:",
    subtotal: "Subtotal:",
    shipping: "Shipping:",
    discount: "Discount:",
    finalTotal: "Final Total:",
    products: "🛍️ Items",
    product: "Product",
    quantity: "Qty",
    unitPrice: "Unit Price",
    lineTotal: "Line Total",
    trackOrder: "Track Order",
    ifAnyQuestion: "If you have any questions, contact us at ",
    thanks: (companyName: string) => `Thanks for your trust! 💙\n${companyName} Team`,
    autoEmail: "This email was sent automatically. Please do not reply to it.",

    statuses: {
      pending: "Pending Confirmation",
      awaiting_payment_confirmation: "Awaiting Transfer Approval",
      confirmed: "Confirmed",
      processing: "Processing",
      shipped: "Shipped",
      delivered: "Delivered",
      cancelled: "Cancelled",
      payment_failed: "Payment Failed",
      delivered_to_customer: "Delivered",
    },

    paymentStatuses: {
      unpaid: "Unpaid",
      pending_confirmation: "Awaiting Transfer Approval",
      paid: "Paid",
      rejected: "Rejected",
      failed: "Failed",
      pending: "Cash on Delivery",
      refunded: "Refunded",
    },
  },
} as const;

/**
 * Status colors based on normalized key
 */
function getStatusColor(normalizedStatusKey: string): string {
  const colors: Record<string, string> = {
    pending: "#f59e0b",
    awaiting_payment_confirmation: "#f59e0b",
    confirmed: "#10b981",
    processing: "#3b82f6",
    shipped: "#8b5cf6",
    delivered: "#059669",
    cancelled: "#ef4444",
    payment_failed: "#ef4444",
  };
  return colors[normalizedStatusKey] || "#6b7280";
}

export const OrderStatusUpdateEmail = ({
  orderNumber,
  userName,
  newStatus,
  oldStatus,

  paymentStatus,
  paymentMethod,

  totalAmount,
  currency = "ج.س",

  products,

  subtotal,
  shippingFee,
  discountAmount,
  finalTotal,

  companyName = "Nubian",
  logoUrl,
  supportEmail = "support@nubian.com",
  trackingUrl,
  language = "ar",
}: OrderStatusUpdateEmailProps) => {
  const t = translations[language];
  const dir = language === "ar" ? "rtl" : "ltr";
  const align = language === "ar" ? "right" : "left";

  const newKey = normalizeKey(newStatus);
  const oldKey = normalizeKey(oldStatus);

  const payKey = normalizeKey(paymentStatus);

  const newStatusLabel =
    (t.statuses as any)[newKey] ?? String(newStatus || "—");
  const oldStatusLabel =
    (t.statuses as any)[oldKey] ?? (oldStatus ? String(oldStatus) : "—");

  const paymentStatusLabel =
    (t.paymentStatuses as any)[payKey] ?? String(paymentStatus || "—");

  const statusColor = getStatusColor(newKey);

  // Derived totals (safe)
  const subtotalV = subtotal ?? products.reduce((acc, p) => acc + n(p.price) * n(p.quantity, 1), 0);
  const shippingV = n(shippingFee, 0);
  const discountV = n(discountAmount, 0);
  const finalV =
    finalTotal ?? Math.max(0, n(totalAmount) || (subtotalV + shippingV - discountV));

  return (
    <Html lang={language} dir={dir}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="x-apple-disable-message-reformatting" />
        <style>{`
          @media only screen and (max-width: 600px) {
            .mobile-padding { padding: 10px !important; }
            .mobile-text { font-size: 14px !important; }
            .mobile-heading { font-size: 16px !important; }
            .mobile-column { width: 100% !important; display: block !important; }
            .mobile-center { text-align: center !important; }
          }
        `}</style>
      </Head>

      <Preview>{t.preview(orderNumber, newStatusLabel)}</Preview>

      <Body style={{ ...main, direction: dir, padding: "0 10px" }}>
        <Container
          style={{
            ...container,
            direction: dir,
            margin: "0 auto",
            maxWidth: 600,
            width: "100%",
          }}
          align="center"
        >
          {/* Header */}
          <Section style={{ ...header, textAlign: "center" }}>
            {logoUrl ? (
              <Img
                src={logoUrl}
                width="140"
                height="50"
                alt={companyName}
                style={logo}
              />
            ) : (
              <Text style={companyNameText}>{companyName}</Text>
            )}
          </Section>

          {/* Status Badge */}
          <Section style={{ ...statusBadgeSection, textAlign: "center" }}>
            <div style={{ ...statusBadge, backgroundColor: statusColor }}>
              <Text style={statusBadgeText}>{newStatusLabel}</Text>
            </div>
          </Section>

          {/* Greeting */}
          <Text style={{ ...greeting, textAlign: align }}>
            {t.greeting(userName)}
          </Text>

          {/* Main message */}
          <Section style={messageSection}>
            <Text style={{ ...mainMessage, textAlign: align }}>
              {t.mainMessage}{" "}
              <span style={{ fontWeight: "bold" }}>#{orderNumber}</span>
            </Text>
          </Section>

          {/* Details card */}
          <Section style={card}>
            <Text style={{ ...cardTitle, textAlign: align }}>
              {t.orderDetails}
            </Text>

            <Section style={detailRow}>
              <Row>
                <Column style={detailLabel} className="mobile-column">
                  <Text style={labelText}>{t.oldStatus}</Text>
                </Column>
                <Column style={detailValue} className="mobile-column">
                  <Text style={valueText}>{oldStatusLabel}</Text>
                </Column>
              </Row>
            </Section>

            <Section style={detailRow}>
              <Row>
                <Column style={detailLabel} className="mobile-column">
                  <Text style={labelText}>{t.newStatus}</Text>
                </Column>
                <Column style={detailValue} className="mobile-column">
                  <Text style={{ ...valueText, color: statusColor }}>
                    {newStatusLabel}
                  </Text>
                </Column>
              </Row>
            </Section>

            <Section style={detailRow}>
              <Row>
                <Column style={detailLabel} className="mobile-column">
                  <Text style={labelText}>{t.paymentStatus}</Text>
                </Column>
                <Column style={detailValue} className="mobile-column">
                  <Text style={valueText}>{paymentStatusLabel}</Text>
                </Column>
              </Row>
            </Section>

            {paymentMethod ? (
              <Section style={detailRow}>
                <Row>
                  <Column style={detailLabel} className="mobile-column">
                    <Text style={labelText}>{t.paymentMethod}</Text>
                  </Column>
                  <Column style={detailValue} className="mobile-column">
                    <Text style={valueText}>{String(paymentMethod)}</Text>
                  </Column>
                </Row>
              </Section>
            ) : null}

            {/* Totals */}
            <Section style={detailRow}>
              <Row>
                <Column style={detailLabel} className="mobile-column">
                  <Text style={labelText}>{t.subtotal}</Text>
                </Column>
                <Column style={detailValue} className="mobile-column">
                  <Text style={valueText}>
                    {formatMoney(n(subtotalV), language)} {currency}
                  </Text>
                </Column>
              </Row>
            </Section>

            {shippingV ? (
              <Section style={detailRow}>
                <Row>
                  <Column style={detailLabel} className="mobile-column">
                    <Text style={labelText}>{t.shipping}</Text>
                  </Column>
                  <Column style={detailValue} className="mobile-column">
                    <Text style={valueText}>
                      {formatMoney(shippingV, language)} {currency}
                    </Text>
                  </Column>
                </Row>
              </Section>
            ) : null}

            {discountV ? (
              <Section style={detailRow}>
                <Row>
                  <Column style={detailLabel} className="mobile-column">
                    <Text style={labelText}>{t.discount}</Text>
                  </Column>
                  <Column style={detailValue} className="mobile-column">
                    <Text style={{ ...valueText, color: "#ef4444" }}>
                      -{formatMoney(discountV, language)} {currency}
                    </Text>
                  </Column>
                </Row>
              </Section>
            ) : null}

            <Section style={{ ...detailRow, borderBottom: "none" }}>
              <Row>
                <Column style={detailLabel} className="mobile-column">
                  <Text style={{ ...labelText, fontWeight: "700" }}>
                    {t.finalTotal}
                  </Text>
                </Column>
                <Column style={detailValue} className="mobile-column">
                  <Text style={{ ...valueText, fontSize: "18px" }}>
                    {formatMoney(finalV, language)} {currency}
                  </Text>
                </Column>
              </Row>
            </Section>
          </Section>

          {/* Products card */}
          <Section style={card}>
            <Text style={{ ...cardTitle, textAlign: align }}>{t.products}</Text>

            {/* Table header */}
            <Section
              style={{
                ...productHeader,
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <span style={{ width: "46%", textAlign: align }}>{t.product}</span>
              <span style={{ width: "14%", textAlign: "center" }}>{t.quantity}</span>
              <span style={{ width: "20%", textAlign: language === "ar" ? "left" : "right" }}>
                {t.unitPrice}
              </span>
              <span style={{ width: "20%", textAlign: language === "ar" ? "left" : "right" }}>
                {t.lineTotal}
              </span>
            </Section>

            {products?.length ? (
              products.map((p) => {
                const key = `${p.name}-${p.quantity}-${p.price}-${Math.random()
                  .toString(16)
                  .slice(2, 8)}`; // avoid collisions in emails
                const qty = Math.max(1, n(p.quantity, 1));
                const price = n(p.price, 0);
                const line = price * qty;

                return (
                  <Section key={key} style={productItem}>
                    <Row>
                      <Column style={{ width: "46%", textAlign: align }} className="mobile-column">
                        <Text style={productName}>{String(p.name || "—")}</Text>
                      </Column>
                      <Column style={{ width: "14%", textAlign: "center" }} className="mobile-column">
                        <Text style={productQuantity}>× {qty}</Text>
                      </Column>
                      <Column
                        style={{ width: "20%", textAlign: language === "ar" ? "left" : "right" }}
                        className="mobile-column"
                      >
                        <Text style={productPrice}>
                          {formatMoney(price, language)} {currency}
                        </Text>
                      </Column>
                      <Column
                        style={{ width: "20%", textAlign: language === "ar" ? "left" : "right" }}
                        className="mobile-column"
                      >
                        <Text style={productPrice}>
                          {formatMoney(line, language)} {currency}
                        </Text>
                      </Column>
                    </Row>
                    <div style={productDivider} />
                  </Section>
                );
              })
            ) : (
              <Text style={{ ...valueText, textAlign: align }}>—</Text>
            )}
          </Section>

          {/* Tracking button */}
          {trackingUrl ? (
            <Section style={{ textAlign: "center", margin: "18px 0 10px" }}>
              <Link href={trackingUrl} style={primaryButton as any}>
                {t.trackOrder}
              </Link>
            </Section>
          ) : null}

          {/* Footer message */}
          <Text style={{ ...footerMessage, textAlign: align }}>
            {t.ifAnyQuestion}
            <Link href={`mailto:${supportEmail}`} style={link}>
              {supportEmail}
            </Link>
          </Text>

          {/* Footer */}
          <Section style={{ ...footer, textAlign: "center" }}>
            <Text style={{ ...footerText, textAlign: align }}>
              {t.thanks(companyName)}
            </Text>
            <Text style={{ ...footerSubtext, textAlign: align }}>{t.autoEmail}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default OrderStatusUpdateEmail;

/* -------------------- styles -------------------- */

const main = {
  backgroundColor: "#f8fafc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  WebkitFontSmoothing: "antialiased",
  MozOsxFontSmoothing: "grayscale",
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "0",
  width: "100%",
  maxWidth: "600px",
};

const header = {
  backgroundColor: "#ffffff",
  padding: "16px 10px",
  borderBottom: "1px solid #e5e7eb",
};

const logo = {
  margin: "0 auto",
  display: "block",
};

const companyNameText = {
  fontSize: "28px",
  fontWeight: "bold",
  color: "#1f2937",
  margin: "0",
  textAlign: "center" as const,
};

const statusBadgeSection = {
  padding: "10px",
  textAlign: "center" as const,
};

const statusBadge = {
  display: "inline-block",
  padding: "12px 24px",
  borderRadius: "25px",
  color: "#ffffff",
  fontWeight: "bold",
  fontSize: "16px",
  textAlign: "center" as const,
};

const statusBadgeText = {
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold",
  margin: "0",
};

const greeting = {
  fontSize: "20px",
  fontWeight: "bold",
  color: "#1f2937",
  margin: "10px 10px 5px",
};

const messageSection = {
  margin: "0 10px 15px",
};

const mainMessage = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#4b5563",
  margin: "0 0 8px 0",
};

const card = {
  backgroundColor: "#ffffff",
  margin: "0 10px 10px",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.07)",
};

const cardTitle = {
  fontSize: "16px",
  fontWeight: "bold",
  color: "#1f2937",
  margin: "0 0 8px 0",
  borderBottom: "2px solid #f3f4f6",
  paddingBottom: "4px",
};

const detailRow = {
  margin: "6px 0",
  padding: "4px 0",
  borderBottom: "1px solid #f9fafb",
};

const detailLabel = {
  width: "40%",
  verticalAlign: "top" as const,
};

const detailValue = {
  width: "60%",
  verticalAlign: "top" as const,
};

const labelText = {
  fontSize: "14px",
  color: "#6b7280",
  margin: "0",
  fontWeight: "500",
};

const valueText = {
  fontSize: "15px",
  color: "#1f2937",
  margin: "0",
  fontWeight: "bold",
};

const productHeader = {
  margin: "5px 0",
  padding: "8px 0",
  fontWeight: "bold",
  borderBottom: "1px solid #e5e7eb",
};

const productItem = {
  margin: "6px 0",
  padding: "6px 0",
};

const productDivider = {
  height: "1px",
  backgroundColor: "#f3f4f6",
  margin: "6px 0",
};

const productName = {
  fontSize: "15px",
  color: "#1f2937",
  margin: "0",
  fontWeight: "500",
};

const productQuantity = {
  fontSize: "14px",
  color: "#6b7280",
  margin: "0",
  fontWeight: "bold",
};

const productPrice = {
  fontSize: "15px",
  color: "#1f2937",
  margin: "0",
  fontWeight: "bold",
};

const primaryButton = {
  display: "inline-block",
  backgroundColor: "#3b82f6",
  color: "#ffffff",
  padding: "12px 32px",
  borderRadius: "8px",
  fontWeight: "bold",
  fontSize: "16px",
  textDecoration: "none",
};

const footerMessage = {
  fontSize: "14px",
  lineHeight: "20px",
  color: "#6b7280",
  margin: "10px",
};

const footer = {
  backgroundColor: "#f9fafb",
  padding: "16px 10px",
  marginTop: "16px",
};

const footerText = {
  fontSize: "16px",
  color: "#1f2937",
  margin: "0 0 10px 0",
  fontWeight: "500",
};

const footerSubtext = {
  fontSize: "12px",
  color: "#9ca3af",
  margin: "0",
};

const link = {
  color: "#3b82f6",
  textDecoration: "none",
  fontWeight: "500",
};
