
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { OrderStatusUpdateEmail } from '@/components/email-send';

// Define interfaces for the product structures
interface ProductWithNestedProduct {
  product: {
    name: string;
    price: number;
  };
  quantity: number;
}

interface ProductDirect {
  name: string;
  price: number;
  quantity: number;
}

type ProductInput = ProductWithNestedProduct | ProductDirect;

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

    
    
    const productsForEmail = products.map((p: ProductInput) => {
      
      // Check if it's a direct product structure
      if ('name' in p && 'price' in p && typeof p.quantity !== 'undefined') {
        return {
          name: p.name,
          quantity: p.quantity,
          price: p.price,
        };
      }
      
      // Check if it's a nested product structure
      else if ('product' in p && p.product?.name && p.product?.price && typeof p.quantity !== 'undefined') {
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
    // Log error without exposing sensitive details
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // In production, log to error tracking service instead of console
    if (process.env.NODE_ENV === 'production') {
      // errorTrackingService.captureException(error);
    } else {
      console.error('Error sending email notification:', errorMessage);
    }
    
    return NextResponse.json(
      { message: 'Error sending email notification.' },
      { status: 500 }
    );
  }
}