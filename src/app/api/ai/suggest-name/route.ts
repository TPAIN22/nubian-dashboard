import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { keyword } = await req.json();

    // Mock AI delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simulated AI recommendations based on context
    const suggestions = [
      `${keyword} Hub`,
      `The ${keyword} Store`,
      `${keyword} Express`,
      `Premium ${keyword}`,
      `${keyword} & Co.`,
    ];

    return NextResponse.json({ suggestions }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Failed to generate suggestions', error: error.message },
      { status: 500 }
    );
  }
}
