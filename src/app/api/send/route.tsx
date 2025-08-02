
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { OrderStatusUpdateEmail } from '@/components/email-send';
import { Product } from '@/app/products/productsTable';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const {
      user,
      orderNumber,
      totalAmount,
      products, 
      oldStatus,
      newStatus,
      paymentStatus,
    } = await request.json();

    if (
      !user?.emailAddress ||
      !user?.fullName ||
      !orderNumber ||
      !totalAmount ||
      !products ||
      !oldStatus ||
      !newStatus ||
      !paymentStatus
    ) {
      return NextResponse.json(
        { message: 'Missing required data for sending email notification.' },
        { status: 400 }
      );
    }

    
    
    const productsForEmail = products.map((p: Product | any) => {
      
      if (p.name && p.price && typeof p.quantity !== 'undefined') {
        return {
          name: p.name,
          quantity: p.quantity,
          price: p.price,
        };
      }
      
      else if (p.product?.name && p.product?.price && typeof p.quantity !== 'undefined') {
        return {
          name: p.product.name,
          quantity: p.quantity,
          price: p.product.price,
        };
      }
      
      return {
        name: 'منتج غير معروف',
        quantity: p.quantity || 1, 
        price: 0,
      };
    });
    

    await resend.emails.send({
      from: 'Nubian <nubiang@nubian-sd.info>',
      to: user.emailAddress,
      subject: `تحديث هام بخصوص طلبك رقم #${orderNumber}`,
      react: (
        <OrderStatusUpdateEmail
          orderNumber={orderNumber}
          userName={user.fullName}
          newStatus={newStatus}
          oldStatus={oldStatus}
          paymentStatus={paymentStatus}
          totalAmount={totalAmount}
          products={productsForEmail} 
        />
      ),
    });
    return NextResponse.json(
      { message: 'Email notification sent successfully.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending email notification:', error);
    return NextResponse.json(
      { message: 'Error sending email notification.' },
      { status: 500 }
    );
  }
}