/**
 * The signed-in merchant's own store profile.
 *
 * The settings page used to call the backend straight from the browser with
 * `withCredentials`, which only works while the dashboard and the API share a
 * site. Routing it through the proxy attaches a real Clerk bearer token, so it
 * keeps working when the API lives on its own origin.
 */

import { NextRequest } from "next/server";
import { proxyToAuth } from "@/lib/authProxy";

export async function GET() {
  return proxyToAuth({ path: "/merchants/my-profile", method: "GET" });
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return proxyToAuth({ path: "/merchants/my-profile", method: "PUT", body });
}
