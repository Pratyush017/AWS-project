import { NextRequest, NextResponse } from "next/server";
import { COGNITO_CONFIG, parseJwtPayload } from "@/lib/cognito";
import { docClient, PROFILES_TABLE } from "@/lib/dynamodb";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { code, redirectUri } = await request.json();

    if (!code || !redirectUri) {
      return NextResponse.json(
        { error: "Missing required parameters: code, redirectUri" },
        { status: 400 }
      );
    }

    const tokenUrl = `https://${COGNITO_CONFIG.domain}/oauth2/token`;
    const bodyParams = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: COGNITO_CONFIG.clientId,
      code,
      redirect_uri: redirectUri,
    });

    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: bodyParams.toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("[Cognito Auth Error] Token exchange failed:", errText);
      return NextResponse.json(
        { error: "Failed to exchange authorization code with Cognito", details: errText },
        { status: 400 }
      );
    }

    const tokenData = await tokenRes.json();
    const payload = parseJwtPayload(tokenData.id_token);

    if (!payload || !payload.sub) {
      return NextResponse.json({ error: "Invalid token payload" }, { status: 400 });
    }

    const userId = payload.sub;
    const email = payload.email || "";
    const name = payload.name || email.split("@")[0] || "Civic Hero";

    // Ensure user profile exists in DynamoDB
    try {
      const getProfile = await docClient.send(
        new GetCommand({
          TableName: PROFILES_TABLE,
          Key: { id: userId },
        })
      );

      if (!getProfile.Item) {
        await docClient.send(
          new PutCommand({
            TableName: PROFILES_TABLE,
            Item: {
              id: userId,
              email,
              name,
              points: 0,
              created_at: new Date().toISOString(),
            },
          })
        );
      }
    } catch (dbErr) {
      console.warn("[DynamoDB] Error syncing user profile on login:", dbErr);
    }

    const response = NextResponse.json({
      user: {
        id: userId,
        email,
        name,
      },
      idToken: tokenData.id_token,
      accessToken: tokenData.access_token,
      expiresIn: tokenData.expires_in,
    });

    // Set secure HTTP-only session cookie
    response.cookies.set("cognito_id_token", tokenData.id_token, {
      path: "/",
      maxAge: tokenData.expires_in || 3600,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
    });

    response.cookies.set("cognito_user_id", userId, {
      path: "/",
      maxAge: tokenData.expires_in || 3600,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: false,
    });

    return response;
  } catch (err: any) {
    console.error("[Cognito Token Route] Unexpected error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
