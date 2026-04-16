import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/connect';
import MerchantApplication from '@/models/MerchantApplication';
import { clerkClient } from '@clerk/nextjs/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// GET: Fetch a single merchant application by ID
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connect();
    
    const application = await MerchantApplication.findById(id).lean();
    
    if (!application) {
      return NextResponse.json({ message: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json({ application }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Failed to fetch application', error: error.message },
      { status: 500 }
    );
  }
}

// PATCH: Update the status of a merchant application
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, rejectionReason, revisionNotes, suspensionReason } = body;

    if (!['approved', 'rejected', 'needs_revision', 'suspended'].includes(status)) {
      return NextResponse.json({ message: 'Invalid status' }, { status: 400 });
    }

    await connect();
    
    // 1. Update the Application Status
    const application = await MerchantApplication.findByIdAndUpdate(
      id,
      { 
        status,
        ...(rejectionReason && { rejectionReason }),
        ...(revisionNotes && { revisionNotes }),
        ...(suspensionReason && { suspensionReason }),
        // Clear notes when moving back to pending/approved/rejected if they were resolved
        ...(status !== 'needs_revision' && { revisionNotes: undefined }),
        ...(status !== 'rejected' && { rejectionReason: undefined }),
        ...(status === 'approved' && { suspensionReason: undefined })
      },
      { new: true }
    );

    if (!application) {
      return NextResponse.json({ message: 'Application not found' }, { status: 404 });
    }

    // 2. Cascade deactivation to products if suspended
    const Product = (await import('@/models/Product')).default;
    if (status === 'suspended') {
      const productResult = await Product.updateMany(
        { merchantId: id },
        { isActive: false }
      );
      console.log(`Merchant ${id} suspended. ${productResult.modifiedCount} products deactivated.`);
    }

    // 3. Sync status and role to Clerk metadata
    if (application.userId) {
      const client = await clerkClient();
      await client.users.updateUserMetadata(application.userId, {
        publicMetadata: {
          role: (status === 'approved' || status === 'suspended') ? 'merchant' : undefined,
          merchantStatus: status, // 'approved', 'rejected', 'needs_revision', 'suspended'
          merchantId: application._id.toString(),
          storeName: application.storeName
        }
      });
      console.log(`Clerk user ${application.userId} metadata updated: status=${status}`);
    }

    // 4. Send Email Notification
    try {
      const statusLabels: Record<string, string> = {
        approved: 'مقبول',
        rejected: 'مرفوض',
        needs_revision: 'يتطلب تعديلات',
        suspended: 'موقوف مؤقتاً'
      };

      const emailSubject = `تحديث بخصوص وضع حساب التاجر الخاص بك - ${application.storeName}`;
      const statusLabel = statusLabels[status] || status;

      let emailHtml = `
        <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; padding: 20px;">
          <h2>مرحباً ${application.ownerName}،</h2>
          <p>نود إخطارك بتحديث بخصوص وضع حساب المتجر الخاص بك <strong>${application.storeName}</strong>.</p>
          <p>حالة الحساب الحالية: <strong>${statusLabel}</strong></p>
      `;

      if (status === 'suspended') {
        emailHtml += `
          <div style="background-color: #fffbeb; border: 1px solid #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #92400e; font-weight: bold; margin-top: 0;">ملاحظة هامة:</p>
            <p style="color: #92400e;">لقد تم إيقاف حسابك ومنتجاتك مؤقتاً. يرجى التواصل مع الإدارة لمزيد من التفاصيل.</p>
          </div>
        `;
      } else if (status === 'needs_revision' && revisionNotes) {
        emailHtml += `
          <div style="background-color: #fffbeb; border: 1px solid #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #92400e; font-weight: bold; margin-top: 0;">ملاحظات المراجعة:</p>
            <p style="color: #92400e;">${revisionNotes}</p>
          </div>
          <p>يرجى تسجيل الدخول إلى لوحة التحكم وتعديل الطلب بناءً على الملاحظات أعلاه لإعادة إرساله للمراجعة.</p>
        `;
      } else if (status === 'approved') {
        emailHtml += `<p>تم تفعيل حسابك بنجاح. يمكنك الآن البدء في إدارة منتجاتك.</p>`;
      } else if (status === 'rejected' && rejectionReason) {
        emailHtml += `
          <div style="background-color: #fef2f2; border: 1px solid #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #b91c1c; font-weight: bold; margin-top: 0;">سبب الرفض:</p>
            <p style="color: #b91c1c;">${rejectionReason}</p>
          </div>
        `;
      }

      emailHtml += `
          <p style="margin-top: 30px;">شكراً لك،<br>فريق نوبيان</p>
        </div>
      `;

      await resend.emails.send({
        from: 'Nubian <nubiang@nubian-sd.info>',
        to: application.email,
        subject: emailSubject,
        html: emailHtml
      });

      console.log(`Notification email sent to ${application.email} for status ${status}`);
    } catch (emailError) {
      console.error('Failed to send notification email:', emailError);
    }

    return NextResponse.json({ message: `Successfully ${status}`, application }, { status: 200 });

  } catch (error: any) {
    console.error('Admin approval error:', error);
    return NextResponse.json(
      { message: 'Failed to update application', error: error.message },
      { status: 500 }
    );
  }
}
