import { NextRequest, NextResponse } from "next/server";
import { Type } from "@google/genai";
import { z } from "zod";
import { docClient, REPORTS_TABLE, PROFILES_TABLE } from "@/lib/dynamodb";
import { PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { getAuthenticatedUser } from "@/lib/server-auth";
import { getGeminiClient, withGeminiRetry, parseGeminiError } from "@/lib/gemini";
import { S3Client, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";

const s3Client = new S3Client({
  region: process.env.APP_AWS_REGION || process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// ---------------------------------------------------------------------------
// 1. Zod schema — single source of truth for the Gemini response shape
// ---------------------------------------------------------------------------
const ReportAnalysisSchema = z.object({
  isAuthentic: z.boolean().describe("True if authentic civic issue, false if stock photo or invalid"),
  fraudReason: z.string().nullable().describe("Reason for rejection if isAuthentic is false"),
  title: z.string(),
  description: z.string(),
  severity: z.enum(["Low", "Medium", "Critical"]),
  category: z.string(),
});

type ReportAnalysis = z.infer<typeof ReportAnalysisSchema>;

// ---------------------------------------------------------------------------
// 2. Helper — convert Zod schema → Gemini responseSchema
// ---------------------------------------------------------------------------
function zodToGeminiSchema() {
  return {
    type: Type.OBJECT,
    properties: {
      isAuthentic: {
        type: Type.BOOLEAN,
        description: "True if the image contains a real reportable civic defect. False if it is a stock photo, screenshot, or unrelated.",
      },
      fraudReason: {
        type: Type.STRING,
        description: "If isAuthentic is false, explain why it was rejected. If true, return empty or null.",
      },
      category: {
        type: Type.STRING,
        description: "Category of the civic issue (e.g. Pothole, Graffiti, Flood).",
      },
      title: {
        type: Type.STRING,
        description: "A concise, descriptive title for the issue.",
      },
      description: {
        type: Type.STRING,
        description: "A detailed description of the issue.",
      },
      severity: {
        type: Type.STRING,
        description: "Severity of the issue: Low, Medium, or Critical",
      },
    },
    required: ["isAuthentic", "title", "description", "severity", "category"],
  };
}

// ---------------------------------------------------------------------------
// 3. POST handler
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const user = getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized - please log in" }, { status: 401 });
    }

    // ---- Parse multipart form data ----
    const formData = await request.formData();
    const imageUrl = formData.get("imageUrl") as string | null;
    const imageKey = formData.get("imageKey") as string | null;
    const latitude = formData.get("latitude") as string | null;
    const longitude = formData.get("longitude") as string | null;

    if (!imageUrl || !imageKey || !latitude || !longitude) {
      return NextResponse.json(
        { error: "Missing required fields: imageUrl, imageKey, latitude, longitude" },
        { status: 400 }
      );
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return NextResponse.json(
        { error: "latitude and longitude must be valid numbers" },
        { status: 400 }
      );
    }

    // ---- Fetch the image from S3 using AWS SDK to perform AI Triage ----
    let buffer: Buffer;
    let mimeType = "image/jpeg";
    try {
      const getCommand = new GetObjectCommand({
        Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
        Key: imageKey,
      });
      const s3Response = await s3Client.send(getCommand);
      const byteArray = await s3Response.Body?.transformToByteArray();
      if (!byteArray) throw new Error("Empty body returned from S3");
      buffer = Buffer.from(byteArray);
      mimeType = s3Response.ContentType || mimeType;
    } catch (err) {
      console.error("Failed to fetch image from S3 using SDK:", err);
      return NextResponse.json(
        { error: "Failed to fetch image from S3 for analysis" },
        { status: 400 }
      );
    }

    const publicUrl = imageUrl;

    // ---- 1st Stage: Local ONNX Routing ----
    // Dynamic import — onnxruntime-node is unavailable on Vercel (missing
    // libonnxruntime.so.1). On failure, we silently escalate to Gemini.
    let parsed!: ReportAnalysis;
    let onnxHandled = false;

    try {
      const { routeSubmission } = await import("@/lib/hazard-router");
      const route = await routeSubmission(buffer);

      if (route.action === "reject") {
        try {
          await s3Client.send(new DeleteObjectCommand({
            Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
            Key: imageKey
          }));
        } catch (delErr) {
          console.error("Failed to delete rejected image from S3:", delErr);
        }
        return NextResponse.json(
          { error: route.reason || "AI Triage Rejected: Invalid civic issue." },
          { status: 400 }
        );
      } else if (route.action === "accept") {
        const { describeReport } = await import("@/lib/describe");
        const generatedDesc = await describeReport({
          label: route.label,
          severity: route.severity,
          latitude: lat,
          longitude: lng,
        });

        const severityMapReverse: Record<number, "Low" | "Medium" | "Critical"> = {
          1: "Low",
          2: "Low",
          3: "Medium",
          4: "Medium",
          5: "Critical",
        };

        parsed = {
          isAuthentic: true,
          fraudReason: null,
          category: route.label,
          title: `${route.label.replace(/_/g, ' ').toUpperCase()} Report`,
          description: generatedDesc,
          severity: severityMapReverse[route.severity] || "Medium",
        };
        onnxHandled = true;
      }
      // action === "escalate" falls through with onnxHandled = false
    } catch (onnxError) {
      // onnxruntime-node unavailable in serverless (missing libonnxruntime.so.1).
      // Check if client-side onnxruntime-web already classified the hazard
      const clientOnnxAction = formData.get("onnxAction") as string | null;
      const clientOnnxLabel = formData.get("onnxLabel") as string | null;
      const clientOnnxSeverity = parseInt((formData.get("onnxSeverity") as string) || "3", 10);
      const clientOnnxConfidence = parseFloat((formData.get("onnxConfidence") as string) || "0");

      if (clientOnnxAction === "accept" && clientOnnxLabel && clientOnnxConfidence >= 0.70) {
        try {
          const { describeReport } = await import("@/lib/describe");
          const generatedDesc = await describeReport({
            label: clientOnnxLabel,
            severity: clientOnnxSeverity,
            latitude: lat,
            longitude: lng,
          });

          const severityMapReverse: Record<number, "Low" | "Medium" | "Critical"> = {
            1: "Low",
            2: "Low",
            3: "Medium",
            4: "Medium",
            5: "Critical",
          };

          parsed = {
            isAuthentic: true,
            fraudReason: null,
            category: clientOnnxLabel,
            title: `${clientOnnxLabel.replace(/_/g, ' ').toUpperCase()} Report`,
            description: generatedDesc,
            severity: severityMapReverse[clientOnnxSeverity] || "Medium",
          };
          onnxHandled = true;
          console.log(`[ONNX Router] Handled by browser ONNX inference: ${clientOnnxLabel} (${(clientOnnxConfidence * 100).toFixed(1)}%)`);
        } catch (descErr) {
          console.warn("[ONNX Router] Could not describe browser ONNX report:", descErr);
        }
      } else {
        console.warn("[ONNX Router] Native runtime unavailable, escalating to Gemini:", onnxError);
      }
    }

    if (!onnxHandled) {
      // escalate branch -> use ai-router (handles Gemini + Groq fallback)
      try {
        const { analyzeCivicIssue } = await import("@/lib/ai-router");
        parsed = await analyzeCivicIssue(buffer, mimeType);
      } catch (aiError) {
        console.error("AI Triage failed:", aiError);
        const errorMessage = aiError instanceof Error ? aiError.message : "AI Analysis failed";
        const status = errorMessage.includes("quota exceeded") || errorMessage.includes("rate limit") ? 429 : 500;
        return NextResponse.json(
          { error: errorMessage },
          { status }
        );
      }
    }

    if (!parsed.isAuthentic) {
      // Rejection logic & storage cleanup
      try {
        await s3Client.send(new DeleteObjectCommand({
          Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
          Key: imageKey
        }));
      } catch (delErr) {
        console.error("Failed to delete rejected image from S3:", delErr);
      }
      return NextResponse.json(
        { error: parsed.fraudReason || "AI Triage Rejected: Invalid civic issue." },
        { status: 400 }
      );
    }

    // Map severity to integer
    const severityMap: Record<string, number> = {
      Low: 1,
      Medium: 3,
      Critical: 5,
    };
    const mappedSeverity = severityMap[parsed.severity] || 3;

    // ---- Insert into DynamoDB CivicPulseReports table ----
    const report = {
      id: crypto.randomUUID(),
      title: parsed.title,
      description: parsed.description,
      category: parsed.category,
      severity_score: mappedSeverity,
      latitude: lat,
      longitude: lng,
      image_url: publicUrl,
      status: "Reported",
      user_id: user.id,
      created_at: new Date().toISOString(),
    };

    try {
      await docClient.send(
        new PutCommand({
          TableName: REPORTS_TABLE,
          Item: report,
        })
      );
    } catch (insertError) {
      console.error("[DynamoDB] Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to save report to DynamoDB database" },
        { status: 500 }
      );
    }

    // Give civic points securely in DynamoDB CivicPulseProfiles table
    try {
      await docClient.send(
        new UpdateCommand({
          TableName: PROFILES_TABLE,
          Key: { id: user.id },
          UpdateExpression: "ADD points :pts",
          ExpressionAttributeValues: { ":pts": 10 },
        })
      );
    } catch (ptsErr) {
      console.warn("[DynamoDB] Failed to increment points:", ptsErr);
    }

    return NextResponse.json({ report }, { status: 201 });
  } catch (err) {
    console.error("Unhandled error in POST /api/report:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
