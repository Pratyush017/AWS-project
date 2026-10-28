import { NextResponse } from "next/server";
import { docClient, REPORTS_TABLE } from "@/lib/dynamodb";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";

export const runtime = "nodejs";

/**
 * GET /api/reports
 * Returns all reports from DynamoDB ordered by most recent first.
 */
export async function GET() {
  try {
    const res = await docClient.send(
      new ScanCommand({
        TableName: REPORTS_TABLE,
      })
    );

    const items = res.Items || [];
    // Sort by created_at descending
    items.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
    });

    return NextResponse.json({ reports: items });
  } catch (error: any) {
    console.error("[DynamoDB] Failed to fetch reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports from DynamoDB" },
      { status: 500 }
    );
  }
}
