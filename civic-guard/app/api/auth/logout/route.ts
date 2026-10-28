import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("cognito_id_token");
  response.cookies.delete("cognito_user_id");
  return response;
}
