import { NextResponse } from "next/server";
import { docClient, REPORTS_TABLE } from "@/lib/dynamodb";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { generateCityInsights } from "@/lib/ai-router";

export const revalidate = 3600; // Cache this route's response for 1 hour

export async function GET() {
  try {
    const res = await docClient.send(
      new ScanCommand({
        TableName: REPORTS_TABLE,
      })
    );

    const reports = res.Items || [];

    // Sort by created_at descending and take top 100
    reports.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
    });

    const topReports = reports.slice(0, 100);

    if (topReports.length === 0) {
      return NextResponse.json({
        summary: "There are currently no active reports in the city. Infrastructure appears to be in excellent condition.",
        trend: "stable",
        top_recommendations: ["Encourage citizens to report any minor issues before they become major problems."],
      });
    }

    // Generate insights using AI Router
    const insights = await generateCityInsights(topReports as any);

    return NextResponse.json(insights);
  } catch (err) {
    console.error("Insights Generation Error:", err);
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
  }
}
