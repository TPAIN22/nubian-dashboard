import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { OrderStatusUpdateEmail } from "@/components/email-send";
import logger from "@/lib/logger";

/** -------- Types -------- */
type Language = "ar" | "en";

type ProductDirect = {
  name: string;
  price: number;
  quantity: number;
};

type ProductWithNestedProduct = {
  product: { name: string; price: number };
  quantity: number;
};

type ProductInput = ProductDirect | ProductWithNestedProduct | any;

type UserInput = {
  emailAddress?: string;
  fullName?: string;
  language?: Language;
};

type OrderEmailPayload = {
  user: UserInput;

  orderNumber: string;
  totalAmount: number;

  // status
  oldStatus?: string;
  newStatus: string;

  // payment
  paymentStatus: string;
  paymentMethod?: string;

  // currency + breakdown (optional)
  currency?: string;
  subtotal?: number;
  shippingFee?: number;
  discountAmount?: number;
  finalTotal?: number;

  // products can come in multiple shapes
  products?: ProductInput[];
  items?: ProductInput[];
  productsDetails?: ProductInput[];
};

/** -------- Helpers -------- */
const resend = new Resend(process.env.RESEND_API_KEY);

function isNonEmptyString(v: any) {
  return typeof v === "string" && v.trim().length > 0;
}

function isFiniteNumber(v: any) {
  const n = Number(v);
  return Number.isFinite(n);
}

function normalizeEnum(v: any) {
  // Keep original value but normalize common cases:
  // "pending_confirmation" -> "PENDING_CONFIRMATION"
  // "PENDING_CONFIRMATION" -> "PENDING_CONFIRMATION"
  // " pending confirmation " -> "PENDING_CONFIRMATION"
  const s = String(v ?? "").trim();
  if (!s) return "";
  return s
    .replace(/\s+/g, "_")
    .replace(/-/g, "_")
    .toUpperCase();
}

function pickProducts(payload: OrderEmailPayload): ProductInput[] {
  // Prefer newest structure first
  if (Array.isArray(payload.items) && payload.items.length) return payload.items;
  if (Array.isArray(payload.products) && payload.products.length) return payload.products;
  if (Array.isArray(payload.productsDetails) && payload.productsDetails.length) return payload.productsDetails;
  return [];
}

function normalizeProducts(products: ProductInput[]): ProductDirect[] {
  return (products || []).map((p) => {
    // Direct
    if (p && typeof p === "object" && "name" in p && "price" in p) {
      return {
        name: isNonEmptyString(p.name) ? p.name : "منتج غير معروف",
        quantity: Number(p.quantity ?? 1) || 1,
        price: Number(p.price ?? 0) || 0,
      };
    }

    // Nested: { product: { name, price }, quantity }
    if (p && typeof p === "object" && "product" in p && p.product) {
      return {
        name: isNonEmptyString(p.product?.name) ? p.product.name : "منتج غير معروف",
        quantity: Number(p.quantity ?? 1) || 1,
        price: Number(p.product?.price ?? 0) || 0,
      };
    }

    return {
      name: "منتج غير معروف",
      quantity: Number(p?.quantity ?? 1) || 1,
      price: 0,
    };
  });
}

function buildSubject(language: Language, orderNumber: string, newStatus?: string) {
  const st = newStatus ? ` - ${newStatus}` : "";
  if (language === "en") return `Update about your order #${orderNumber}${st}`;
  return `تحديث هام بخصوص طلبك رقم #${orderNumber}${st}`;
}

export async function POST(request: NextRequest) {
  let orderNumber: string | undefined;
  let requestData: any = null;

  try {
    requestData = (await request.json()) as OrderEmailPayload;

    const {
      user,
      orderNumber: orderNum,
      totalAmount,

      oldStatus,
      newStatus,
      paymentStatus,

      paymentMethod,
      currency,
      subtotal,
      shippingFee,
      discountAmount,
      finalTotal,
    } = requestData;

    orderNumber = orderNum;

    const language: Language = user?.language === "en" ? "en" : "ar";

    // --- Validation (fixes "0" issues) ---
    if (!isNonEmptyString(user?.emailAddress)) {
      return NextResponse.json(
        { message: "Missing user.emailAddress" },
        { status: 400 }
      );
    }
    if (!isNonEmptyString(user?.fullName)) {
      return NextResponse.json(
        { message: "Missing user.fullName" },
        { status: 400 }
      );
    }
    if (!isNonEmptyString(orderNumber)) {
      return NextResponse.json(
        { message: "Missing orderNumber" },
        { status: 400 }
      );
    }
    if (!isFiniteNumber(totalAmount)) {
      return NextResponse.json(
        { message: "Missing/invalid totalAmount" },
        { status: 400 }
      );
    }
    if (!isNonEmptyString(newStatus)) {
      return NextResponse.json(
        { message: "Missing newStatus" },
        { status: 400 }
      );
    }
    if (!isNonEmptyString(paymentStatus)) {
      return NextResponse.json(
        { message: "Missing paymentStatus" },
        { status: 400 }
      );
    }

    // Products: support multiple fields and shapes
    const rawProducts = pickProducts(requestData);
    if (!Array.isArray(rawProducts) || rawProducts.length === 0) {
      return NextResponse.json(
        { message: "Missing products/items for email" },
        { status: 400 }
      );
    }

    const productsForEmail = normalizeProducts(rawProducts);

    // Normalize enums to match new template mapping
    const normalizedNewStatus = normalizeEnum(newStatus);
    const normalizedOldStatus = normalizeEnum(oldStatus);
    const normalizedPaymentStatus = normalizeEnum(paymentStatus);

    // Send email
    await resend.emails.send({
      from: "Nubian <nubiang@nubian-sd.info>",
      to: user.emailAddress!,
      subject: buildSubject(language, orderNumber!, normalizedNewStatus),
      react: (
        <OrderStatusUpdateEmail
          orderNumber={orderNumber ?? ""}
          userName={user.fullName!}
          language={language}
          newStatus={normalizedNewStatus}
          oldStatus={normalizedOldStatus}
          paymentStatus={normalizedPaymentStatus}
          paymentMethod={paymentMethod}
          currency={currency || "ج.س"}
          totalAmount={Number(totalAmount)}
          subtotal={isFiniteNumber(subtotal) ? Number(subtotal) : undefined}
          shippingFee={isFiniteNumber(shippingFee) ? Number(shippingFee) : undefined}
          discountAmount={isFiniteNumber(discountAmount) ? Number(discountAmount) : undefined}
          finalTotal={isFiniteNumber(finalTotal) ? Number(finalTotal) : undefined}
          products={productsForEmail}
        />
      ),
    });

    return NextResponse.json(
      { message: "Email notification sent successfully." },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    logger.error("Error sending email notification", {
      error: errorMessage,
      orderNumber: orderNumber || requestData?.orderNumber || "unknown",
    });

    return NextResponse.json(
      { message: "Error sending email notification." },
      { status: 500 }
    );
  }
}
