import { NextRequest } from "next/server";
import { proxyToAuth } from "@/lib/authProxy";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToAuth({ path: `/tickets/${encodeURIComponent(id)}`, method: "GET" });
}
