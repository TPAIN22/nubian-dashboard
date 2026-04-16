import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { description } = await req.json();

    // Mock AI analysis delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simple mock logic based on description keywords
    const text = description.toLowerCase();
    const categories = [];
    
    if (text.includes('clothes') || text.includes('fashion')) categories.push('Fashion');
    if (text.includes('tech') || text.includes('electronics')) categories.push('Electronics');
    if (text.includes('food') || text.includes('grocery')) categories.push('Food & Groceries');
    
    if (categories.length === 0) categories.push('General Store');
    categories.push('New Arrivals'); // default suggestion

    return NextResponse.json({ categories }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Failed to generate categories', error: error.message },
      { status: 500 }
    );
  }
}
