import { NextResponse } from 'next/server';


 
export async function GET() {
  return new NextResponse("PONG", { status: 200 });
}
