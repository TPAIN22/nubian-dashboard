import * as React from 'react';
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
} from '@react-email/components';

// تعريف الـ Props التي سيستقبلها قالب البريد الإلكتروني
interface OrderStatusUpdateEmailProps {
  orderNumber: string;
  userName: string;
  newStatus: string;
  oldStatus: string;
  paymentStatus: string;
  totalAmount: number;
  products: { name: string; quantity: number; price: number }[];
  companyName?: string;
  logoUrl?: string;
  supportEmail?: string;
  trackingUrl?: string;
  language?: 'ar' | 'en'; // إضافة دعم اللغة
}

// نصوص ثنائية اللغة
const translations = {
  ar: {
    statusLabels: {
      pending: "بانتظار التأكيد",
      confirmed: "تم التأكيد",
      processing: "قيد التجهيز",
      shipped: "تم الشحن",
      delivered: "تم التوصيل",
      cancelled: "ملغي",
    },
    paymentStatusLabels: {
      pending: "عند الاستلام",
      paid: "مدفوع",
      failed: "فشل في الدفع",
      refunded: "تم الاسترداد",
    },
    preview: (orderNumber: string, newStatus: string) => `تحديث حالة طلبك #${orderNumber} - ${newStatus}`,
    greeting: (userName: string) => `مرحباً ${userName} 👋`,
    mainMessage: "نود إعلامك بأنه قد تم تحديث حالة طلبك رقم",
    orderDetails: "📋 تفاصيل الطلب",
    oldStatus: "الحالة السابقة:",
    newStatus: "الحالة الحالية:",
    paymentStatus: "حالة الدفع:",
    totalAmount: "المبلغ الإجمالي:",
    products: "🛍️ المنتجات",
    quantity: "الكمية",
    price: "السعر",
    trackOrder: "تتبع الشحنة",
    ifAnyQuestion: (supportEmail: string) => `إذا كان لديك أي استفسار، لا تتردد في التواصل معنا على `,
    thanks: (companyName: string) => `شكراً لثقتك بنا! 💙\nفريق ${companyName}`,
    autoEmail: "هذا الإيميل تم إرساله تلقائياً، يرجى عدم الرد عليه مباشرة.",
    currency: "جنيه",
  },
  en: {
    statusLabels: {
      pending: "Pending Confirmation",
      confirmed: "Confirmed",
      processing: "Processing",
      shipped: "Shipped",
      delivered: "Delivered",
      cancelled: "Cancelled",
    },
    paymentStatusLabels: {
      pending: "Cash on Delivery",
      paid: "Paid",
      failed: "Payment Failed",
      refunded: "Refunded",
    },
    preview: (orderNumber: string, newStatus: string) => `Order #${orderNumber} status update - ${newStatus}`,
    greeting: (userName: string) => `Hello ${userName} 👋`,
    mainMessage: "We would like to inform you that the status of your order number",
    orderDetails: "📋 Order Details",
    oldStatus: "Previous Status:",
    newStatus: "Current Status:",
    paymentStatus: "Payment Status:",
    totalAmount: "Total Amount:",
    products: "🛍️ Products",
    quantity: "Qty",
    price: "Price",
    trackOrder: "Track Shipment",
    ifAnyQuestion: (supportEmail: string) => `If you have any questions, feel free to contact us at `,
    thanks: (companyName: string) => `Thank you for your trust! 💙\n${companyName} Team`,
    autoEmail: "This email was sent automatically, please do not reply directly.",
    currency: "EGP",
  },
};

// خرائط التسميات العربية
const statusLabels: Record<string, string> = {
  pending: "بانتظار التأكيد",
  confirmed: "تم التأكيد",
  processing: "قيد التجهيز",
  shipped: "تم الشحن",
  delivered: "تم التوصيل",
  cancelled: "ملغي",
};

const paymentStatusLabels: Record<string, string> = {
  pending: "عند الاستلام",
  paid: "مدفوع",
  failed: "فشل في الدفع",
  refunded: "تم الاسترداد",
};

// دالة لتحديد لون الحالة
const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: "#f59e0b",
    confirmed: "#10b981", 
    processing: "#3b82f6",
    shipped: "#8b5cf6",
    delivered: "#059669",
    cancelled: "#ef4444",
  };
  return colors[status] || "#6b7280";
};

export const OrderStatusUpdateEmail = ({
  orderNumber,
  userName,
  newStatus,
  oldStatus,
  paymentStatus,
  totalAmount,
  products,
  companyName = "Nubian",
  logoUrl,
  supportEmail = "support@nubian.com",
  trackingUrl,
  language = 'ar', // الافتراضي عربي
}: OrderStatusUpdateEmailProps) => {
  const t = translations[language];
  const dir = language === 'ar' ? 'rtl' : 'ltr';
  const align = language === 'ar' ? 'right' : 'left';
  const statusLabel = t.statusLabels[newStatus as keyof typeof t.statusLabels] ?? newStatus;
  const oldStatusLabel = t.statusLabels[oldStatus as keyof typeof t.statusLabels] ?? oldStatus;
  const paymentStatusLabel = t.paymentStatusLabels[paymentStatus as keyof typeof t.paymentStatusLabels] ?? paymentStatus;
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
            .mobile-hide { display: none !important; }
            .mobile-center { text-align: center !important; }
          }
        `}</style>
      </Head>
      <Preview>{t.preview(orderNumber, statusLabel)}</Preview>
      <Body style={{...main, direction: dir, padding: '0 10px'}}>
        <Container style={{...container, direction: dir, margin: '0 auto', maxWidth: 600, width: '100%'}} align="center">
          {/* Header Section */}
          <Section style={{...header, textAlign: 'center'}}>
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
          <Section style={{...statusBadgeSection, textAlign: 'center'}}>
            <div style={{
              ...statusBadge,
              backgroundColor: getStatusColor(newStatus),
            }}>
              <Text style={statusBadgeText}>
                {statusLabel}
              </Text>
            </div>
          </Section>

          {/* Greeting */}
          <Text style={{...greeting, textAlign: align}}>{t.greeting(userName)}</Text>
          
          {/* Main Message */}
          <Section style={messageSection}>
            <Text style={{...mainMessage, textAlign: align}}>
              {t.mainMessage} <span style={{fontWeight:'bold'}}>#{orderNumber}</span>
            </Text>
          </Section>

          {/* Order Details Card */}
          <Section style={card}>
            <Text style={{...cardTitle, textAlign: align}}>{t.orderDetails}</Text>
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
                  <Text style={{...valueText, color: getStatusColor(newStatus)}}>
                    {statusLabel}
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
            <Section style={detailRow}>
              <Row>
                <Column style={detailLabel} className="mobile-column">
                  <Text style={labelText}>{t.totalAmount}</Text>
                </Column>
                <Column style={detailValue} className="mobile-column">
                  <Text style={{...valueText, fontSize: '18px', fontWeight: 'bold'}}>
                    {totalAmount.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })} {t.currency}
                  </Text>
                </Column>
              </Row>
            </Section>
          </Section>

          {/* Products Card */}
          <Section style={card}>
            <Text style={{...cardTitle, textAlign: align}}>{t.products}</Text>
            {/* رأس الجدول */}
            <Section style={{...productItem, fontWeight:'bold', borderBottom:'1px solid #e5e7eb', display:'flex', flexDirection:'row', justifyContent:'space-between'}}>
              <span style={{width:'60%', textAlign:align}}>{language==='ar'? 'المنتج' : 'Product'}</span>
              <span style={{width:'20%', textAlign:'center'}}>{t.quantity}</span>
              <span style={{width:'20%', textAlign:language==='ar'?'left':'right'}}>{t.price}</span>
            </Section>
            {products.map((product, index) => (
              <Section key={index} style={productItem}>
                <Row>
                  <Column style={{width: '60%', textAlign:align}} className="mobile-column">
                    <Text style={productName}>{product.name}</Text>
                  </Column>
                  <Column style={{width: '20%', textAlign: 'center'}} className="mobile-column">
                    <Text style={productQuantity}>× {product.quantity}</Text>
                  </Column>
                  <Column style={{width: '20%', textAlign:language==='ar'?'left':'right'}} className="mobile-column">
                    <Text style={productPrice}>
                      {product.price.toLocaleString(language==='ar'?'ar-EG':'en-US', { 
                        minimumFractionDigits: 2 
                      })} {t.currency}
                    </Text>
                  </Column>
                </Row>
                {index < products.length - 1 && <div style={productDivider} />}
              </Section>
            ))}
          </Section>

          {/* زر تتبع الشحنة */}
          {trackingUrl && (
            <Section style={{textAlign:'center', margin:'24px 0'}}>
              <a href={trackingUrl} style={{
                display:'inline-block',
                backgroundColor:'#3b82f6',
                color:'#fff',
                padding:'12px 32px',
                borderRadius:'8px',
                fontWeight:'bold',
                fontSize:'16px',
                textDecoration:'none',
                margin:'0 auto',
                direction:dir,
              }}>{t.trackOrder}</a>
            </Section>
          )}

          {/* Footer Message */}
          <Text style={{...footerMessage, textAlign:align}}>
            {t.ifAnyQuestion(supportEmail)}
            <Link href={`mailto:${supportEmail}`} style={link}>
              {supportEmail}
            </Link>
          </Text>

          {/* Footer */}
          <Section style={{...footer, textAlign: 'center'}}>
            <Text style={{...footerText, textAlign:align}}>
              {t.thanks(companyName)}
            </Text>
            <Text style={{...footerSubtext, textAlign:align}}>
              {t.autoEmail}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default OrderStatusUpdateEmail;

// الأنماط المحسنة للجوالات
const main = {
  backgroundColor: '#f8fafc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  WebkitFontSmoothing: 'antialiased',
  MozOsxFontSmoothing: 'grayscale',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '0',
  width: '100%',
  maxWidth: '600px',
  direction: 'rtl' as const,
};

// قلل المسافات الرأسية في الأنماط:
const header = {
  backgroundColor: '#ffffff',
  padding: '16px 10px', // كان 30px 20px
  textAlign: 'center' as const,
  borderBottom: '1px solid #e5e7eb',
};

const logo = {
  margin: '0 auto',
  display: 'block',
};

const companyNameText = {
  fontSize: '28px',
  fontWeight: 'bold',
  color: '#1f2937',
  margin: '0',
  textAlign: 'center' as const,
};

const statusBadgeSection = {
  padding: '10px', // كان 20px
  textAlign: 'center' as const,
};

const statusBadge = {
  display: 'inline-block',
  padding: '12px 24px',
  borderRadius: '25px',
  color: '#ffffff',
  fontWeight: 'bold',
  fontSize: '16px',
  textAlign: 'center' as const,
};

const statusBadgeText = {
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0',
};

const greeting = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#1f2937',
  textAlign: 'center' as const,
  margin: '10px 10px 5px', // كان 20px 20px 10px
};

const messageSection = {
  textAlign: 'center' as const,
  margin: '0 10px 15px', // كان 0 20px 30px
};

const mainMessage = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#4b5563',
  textAlign: 'center' as const,
  margin: '0 0 8px 0',
};

const orderNumberText = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#3b82f6',
  backgroundColor: '#eff6ff',
  padding: '8px 16px',
  borderRadius: '6px',
  textAlign: 'center' as const,
  margin: '0',
  display: 'inline-block',
};

const card = {
  backgroundColor: '#ffffff',
  margin: '0 10px 10px', // كان 0 20px 20px
  padding: '12px', // كان 20px
  borderRadius: '10px', // كان 12px
  border: '1px solid #e5e7eb',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.07)', // أخف
};

const cardTitle = {
  fontSize: '16px', // كان 18px
  fontWeight: 'bold',
  color: '#1f2937',
  margin: '0 0 8px 0', // كان 0 0 15px 0
  borderBottom: '2px solid #f3f4f6',
  paddingBottom: '4px', // كان 8px
};

const detailRow = {
  margin: '6px 0', // كان 12px 0
  padding: '4px 0', // كان 8px 0
  borderBottom: '1px solid #f9fafb',
};

const detailLabel = {
  width: '40%',
  verticalAlign: 'top',
};

const detailValue = {
  width: '60%',
  verticalAlign: 'top',
};

const labelText = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '0',
  fontWeight: '500',
};

const valueText = {
  fontSize: '15px',
  color: '#1f2937',
  margin: '0',
  fontWeight: 'bold',
};

const productItem = {
  margin: '5px 0', // كان 10px 0
  padding: '6px 0', // كان 12px 0
};

const productDivider = {
  height: '1px',
  backgroundColor: '#f3f4f6',
  margin: '4px 0', // كان 8px 0
};

const productName = {
  fontSize: '15px',
  color: '#1f2937',
  margin: '0',
  fontWeight: '500',
};

const productQuantity = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '0',
  fontWeight: 'bold',
};

const productPrice = {
  fontSize: '15px',
  color: '#1f2937',
  margin: '0',
  fontWeight: 'bold',
};

const buttonSection = {
  textAlign: 'center' as const,
  margin: '30px 20px',
};

const primaryButton = {
  backgroundColor: '#3b82f6',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontSize: '16px',
  fontWeight: 'bold',
  display: 'inline-block',
  margin: '5px',
  border: 'none',
};

const secondaryButton = {
  backgroundColor: 'transparent',
  color: '#3b82f6',
  padding: '12px 24px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontSize: '16px',
  fontWeight: 'bold',
  display: 'inline-block',
  margin: '5px',
  border: '2px solid #3b82f6',
};

const footerMessage = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#6b7280',
  textAlign: 'center' as const,
  margin: '10px', // كان 20px
};

const footer = {
  backgroundColor: '#f9fafb',
  padding: '16px 10px', // كان 30px 20px
  textAlign: 'center' as const,
  marginTop: '16px', // كان 30px
};

const footerText = {
  fontSize: '16px',
  color: '#1f2937',
  margin: '0 0 10px 0',
  fontWeight: '500',
};

const footerSubtext = {
  fontSize: '12px',
  color: '#9ca3af',
  margin: '0',
};

const link = {
  color: '#3b82f6',
  textDecoration: 'none',
  fontWeight: '500',
};