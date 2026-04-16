import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/connect';
import SupportTicket from '@/models/SupportTicket';

export async function GET(req: NextRequest) {
  try {
    await connect();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const searchTerm = searchParams.get('query');

    const query: any = {};
    if (status && status !== 'all') query.status = status;
    if (category && category !== 'all') query.category = category;
    if (searchTerm) {
      query.$or = [
        { subject: { $regex: searchTerm, $options: 'i' } },
        { ticketId: { $regex: searchTerm, $options: 'i' } },
        { userName: { $regex: searchTerm, $options: 'i' } },
        { userEmail: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    const tickets = await SupportTicket.find(query).sort({ createdAt: -1 });

    // Calculate stats
    const totalOpen = await SupportTicket.countDocuments({ status: 'open' });
    const highRiskCount = await SupportTicket.countDocuments({ riskScore: { $gte: 50 }, status: { $ne: 'resolved' } });
    const disputesCount = await SupportTicket.countDocuments({ type: 'complaint' });
    const overdueCount = await SupportTicket.countDocuments({ 
      slaDue: { $lt: new Date() }, 
      status: { $nin: ['resolved', 'closed'] } 
    });

    return NextResponse.json({ 
      tickets,
      stats: {
        totalOpen,
        highRiskCount,
        disputesCount,
        overdueCount
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching support tickets:', error);
    return NextResponse.json(
      { message: 'Failed to fetch tickets', error: error.message },
      { status: 500 }
    );
  }
}
