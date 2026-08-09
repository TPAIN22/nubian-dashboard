/**
 * Every store the signed-in user belongs to, plus any invitations waiting for
 * them.
 *
 * Authenticated-only on the backend, deliberately: it is what feeds the store
 * switcher AND what tells someone with a pending invite that they have one.
 * Requiring an existing membership would make invitations undiscoverable to
 * anyone whose invitation email went astray.
 */

import { proxyToAuth } from "@/lib/authProxy";

export async function GET() {
  return proxyToAuth({ path: "/merchants/my-memberships", method: "GET" });
}
