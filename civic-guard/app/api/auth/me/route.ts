import { NextRequest, NextResponse } from "next/server";
import { parseJwtPayload } from "@/lib/cognito";
import { docClient, PROFILES_TABLE } from "@/lib/dynamodb";
import { GetCommand } from "@aws-sdk/lib-dynamodb";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    let token = "";
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else {
      token = request.cookies.get("cognito_id_token")?.value || "";
    }

    if (!token) {
      return NextResponse.json({ user: null, profile: null });
    }

    const payload = parseJwtPayload(token);
    if (!payload || !payload.sub) {
      return NextResponse.json({ user: null, profile: null });
    }

    const userId = payload.sub;

    let profile = {
      id: userId,
      email: payload.email || "",
      name: payload.name || payload.email?.split("@")[0] || "Civic Hero",
      points: 0,
    };

    try {
      const dbRes = await docClient.send(
        new GetCommand({
          TableName: PROFILES_TABLE,
          Key: { id: userId },
        })
      );
      if (dbRes.Item) {
        profile = {
          ...profile,
          ...dbRes.Item,
        };
      }
    } catch (err) {
      console.warn("[DynamoDB] Could not load profile:", err);
    }

    return NextResponse.json({
      user: {
        id: userId,
        email: payload.email,
        name: payload.name,
      },
      profile,
    });
  } catch (err: any) {
    return NextResponse.json({ user: null, profile: null, error: err.message });
  }
}
