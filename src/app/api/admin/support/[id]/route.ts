import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/connect';
import SupportTicket from '@/models/SupportTicket';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connect();

    // The ID in the URL can be the mongo _id or the NB-XXXX ticketId
    const ticket = await SupportTicket.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : undefined },
        { ticketId: id }
      ].filter(condition => condition !== undefined)
    });

    if (!ticket) {
      return NextResponse.json({ message: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json({ ticket }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching ticket details:', error);
    return NextResponse.json(
      { message: 'Failed to fetch ticket', error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    await connect();

    const ticket = await SupportTicket.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : undefined },
        { ticketId: id }
      ].filter(condition => condition !== undefined)
    });

    if (!ticket) {
      return NextResponse.json({ message: 'Ticket not found' }, { status: 404 });
    }

    const { status, priority, riskScore, reply } = body;

    if (status) ticket.status = status;
    if (priority) ticket.priority = priority;
    if (riskScore !== undefined) ticket.riskScore = riskScore;

    if (reply) {
      ticket.messages.push({
        sender: 'Support Team',
        role: 'support',
        text: reply,
        timestamp: new Date()
      });
    }

    await ticket.save();

    return NextResponse.json({ ticket }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating ticket:', error);
    return NextResponse.json(
      { message: 'Failed to update ticket', error: error.message },
      { status: 500 }
    );
  }
}
