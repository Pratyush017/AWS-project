import { NextRequest } from "next/server";
import { parseJwtPayload } from "@/lib/cognito";

export interface ServerAuthUser {
  id: string;
  email: string;
  name?: string;
}

/**
 * Extracts and verifies the authenticated Cognito user from request cookies or headers
 */
export function getAuthenticatedUser(request: NextRequest): ServerAuthUser | null {
  const authHeader = request.headers.get("authorization");
  let token = "";
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  } else {
    token = request.cookies.get("cognito_id_token")?.value || "";
  }

  if (!token) return null;

  const payload = parseJwtPayload(token);
  if (!payload || !payload.sub) return null;

  return {
    id: payload.sub,
    email: payload.email || "",
    name: payload.name || payload.email?.split("@")[0] || "Civic Hero",
  };
}

