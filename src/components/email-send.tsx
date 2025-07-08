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
}

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
}: OrderStatusUpdateEmailProps) => (
  <Html lang="ar" dir="rtl">
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
    <Preview>تحديث حالة طلبك #{orderNumber} - {statusLabels[newStatus] || newStatus}</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header Section */}
        <Section style={header}>
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
        <Section style={statusBadgeSection}>
          <div style={{
            ...statusBadge,
            backgroundColor: getStatusColor(newStatus),
          }}>
            <Text style={statusBadgeText}>
              {statusLabels[newStatus] || newStatus}
            </Text>
          </div>
        </Section>

        {/* Greeting */}
        <Text style={greeting}>مرحباً {userName} 👋</Text>
        
        {/* Main Message */}
        <Section style={messageSection}>
          <Text style={mainMessage}>
            نود إعلامك بأنه قد تم تحديث حالة طلبك رقم
          </Text>
          <Text style={orderNumberText}>#{orderNumber}</Text>
        </Section>

        {/* Order Details Card */}
        <Section style={card}>
          <Text style={cardTitle}>📋 تفاصيل الطلب</Text>
          
          <Section style={detailRow}>
            <Row>
              <Column style={detailLabel} className="mobile-column">
                <Text style={labelText}>الحالة السابقة:</Text>
              </Column>
              <Column style={detailValue} className="mobile-column">
                <Text style={valueText}>{statusLabels[oldStatus] || oldStatus}</Text>
              </Column>
            </Row>
          </Section>

          <Section style={detailRow}>
            <Row>
              <Column style={detailLabel} className="mobile-column">
                <Text style={labelText}>الحالة الحالية:</Text>
              </Column>
              <Column style={detailValue} className="mobile-column">
                <Text style={{...valueText, color: getStatusColor(newStatus)}}>
                  {statusLabels[newStatus] || newStatus}
                </Text>
              </Column>
            </Row>
          </Section>

          <Section style={detailRow}>
            <Row>
              <Column style={detailLabel} className="mobile-column">
                <Text style={labelText}>حالة الدفع:</Text>
              </Column>
              <Column style={detailValue} className="mobile-column">
                <Text style={valueText}>
                  {paymentStatusLabels[paymentStatus] || paymentStatus}
                </Text>
              </Column>
            </Row>
          </Section>

          <Section style={detailRow}>
            <Row>
              <Column style={detailLabel} className="mobile-column">
                <Text style={labelText}>المبلغ الإجمالي:</Text>
              </Column>
              <Column style={detailValue} className="mobile-column">
                <Text style={{...valueText, fontSize: '18px', fontWeight: 'bold'}}>
                  {totalAmount.toLocaleString('ar-EG', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })} جنيه
                </Text>
              </Column>
            </Row>
          </Section>
        </Section>

        {/* Products Card */}
        <Section style={card}>
          <Text style={cardTitle}>🛍️ المنتجات</Text>
          {products.map((product, index) => (
            <Section key={index} style={productItem}>
              <Row>
                <Column style={{width: '60%'}} className="mobile-column">
                  <Text style={productName}>{product.name}</Text>
                </Column>
                <Column style={{width: '20%', textAlign: 'center'}} className="mobile-column">
                  <Text style={productQuantity}>× {product.quantity}</Text>
                </Column>
                <Column style={{width: '20%', textAlign: 'left'}} className="mobile-column">
                  <Text style={productPrice}>
                    {product.price.toLocaleString('ar-EG', { 
                      minimumFractionDigits: 2 
                    })} ج
                  </Text>
                </Column>
              </Row>
              {index < products.length - 1 && <div style={productDivider} />}
            </Section>
          ))}
        </Section>

        {/* Footer Message */}
        <Text style={footerMessage}>
          إذا كان لديك أي استفسار، لا تتردد في التواصل معنا على{' '}
          <Link href={`mailto:${supportEmail}`} style={link}>
            {supportEmail}
          </Link>
        </Text>

        {/* Footer */}
        <Section style={footer}>
          <Text style={footerText}>
            شكراً لثقتك بنا! 💙<br />
            فريق {companyName}
          </Text>
          <Text style={footerSubtext}>
            هذا الإيميل تم إرساله تلقائياً، يرجى عدم الرد عليه مباشرة.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

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

const header = {
  backgroundColor: '#ffffff',
  padding: '30px 20px',
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
  padding: '20px',
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
  margin: '20px 20px 10px',
};

const messageSection = {
  textAlign: 'center' as const,
  margin: '0 20px 30px',
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
  margin: '0 20px 20px',
  padding: '20px',
  borderRadius: '12px',
  border: '1px solid #e5e7eb',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
};

const cardTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#1f2937',
  margin: '0 0 15px 0',
  borderBottom: '2px solid #f3f4f6',
  paddingBottom: '8px',
};

const detailRow = {
  margin: '12px 0',
  padding: '8px 0',
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
  margin: '10px 0',
  padding: '12px 0',
};

const productDivider = {
  height: '1px',
  backgroundColor: '#f3f4f6',
  margin: '8px 0',
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
  margin: '20px',
};

const footer = {
  backgroundColor: '#f9fafb',
  padding: '30px 20px',
  textAlign: 'center' as const,
  marginTop: '30px',
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