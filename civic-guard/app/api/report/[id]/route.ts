import { NextRequest, NextResponse } from "next/server";
import { docClient, REPORTS_TABLE, PROFILES_TABLE } from "@/lib/dynamodb";
import { GetCommand, DeleteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { getAuthenticatedUser } from "@/lib/server-auth";

export const runtime = "nodejs";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Missing report ID" }, { status: 400 });
    }

    // Fetch report to verify ownership before deletion
    const fetchRes = await docClient.send(
      new GetCommand({
        TableName: REPORTS_TABLE,
        Key: { id },
      })
    );

    const report = fetchRes.Item;

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (report.user_id && report.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete the report from DynamoDB
    await docClient.send(
      new DeleteCommand({
        TableName: REPORTS_TABLE,
        Key: { id },
      })
    );

    // If this was the user's report, deduct 10 points safely
    if (report.user_id === user.id) {
      try {
        const profRes = await docClient.send(
          new GetCommand({
            TableName: PROFILES_TABLE,
            Key: { id: user.id },
          })
        );
        const currentPoints = profRes.Item?.points || 0;
        const toDeduct = Math.min(10, currentPoints);
        if (toDeduct > 0) {
          await docClient.send(
            new UpdateCommand({
              TableName: PROFILES_TABLE,
              Key: { id: user.id },
              UpdateExpression: "ADD points :pts",
              ExpressionAttributeValues: { ":pts": -toDeduct },
            })
          );
        }
      } catch (ptsErr) {
        console.warn("[DynamoDB] Error deducting points on delete:", ptsErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[DynamoDB] Unhandled error in DELETE /api/report/[id]:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
