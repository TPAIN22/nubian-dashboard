import { NextRequest } from "next/server";
import { proxyToAuth } from "@/lib/authProxy";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  return proxyToAuth({
    path: `/tickets/${encodeURIComponent(id)}/messages`,
    method: "POST",
    body,
  });
}
