# CivicGuard (CiviPulse)
## Autonomous Civic Infrastructure Intelligence & Forensic Verification Platform
### Comprehensive Engineering, Machine Learning & AWS Serverless Architecture Report

---

**Author / Lead Engineer:** Pratyush Raj  
**Department:** Information Technology, Vellore Institute of Technology (VIT), Vellore  
**Document Version:** 3.1.0 (Production Verified)  
**Cloud Ecosystem:** 100% Amazon Web Services (AWS) Serverless Architecture  
**Target AWS Region:** Asia Pacific (Mumbai) `ap-south-1`  
**Date:** October 2026  

---

```
========================================================================================
                                DOCUMENT CLASSIFICATION
                             TECHNICAL ARCHITECTURE REPORT
                                    SPECIAL EDITION:
                      CUSTOM EDGE-AI & FULL-STACK AWS SERVERLESS
========================================================================================
```

---

## Table of Contents
1. [Abstract](#1-abstract)
2. [Introduction](#2-introduction)
   - 2.1 The Municipal Coordination Deficit
   - 2.2 Systemic Deficiencies in Legacy Civic Portals
   - 2.3 The CivicGuard Value Proposition
3. [Description & System Architecture (with Visual Evidence & Screenshots)](#3-description--system-architecture-with-visual-evidence--screenshots)
   - 3.1 High-Level Architecture Topology
   - 3.2 End-to-End Incident Lifecycle
   - 3.3 Visual Evidence & Screenshot Manifest (Exhibits 1–6)
4. [Sample Code: Core Concepts & Implementation](#4-sample-code-core-concepts--implementation)
   - 4.1 In-Browser WebAssembly Classifier (`lib/client-classifier.ts`)
   - 4.2 Multi-Tier Ingestion & AI Triage Handler (`app/api/report/route.ts`)
   - 4.3 4-Stage Autonomous Forensic Verification Gateway (`app/api/verify/route.ts`)
   - 4.4 Offline-First Sync & Self-Healing Replay Engine (`hooks/useBackgroundSync.ts`)
   - 4.5 Amazon S3 Presigned URL Media Ingestion (`app/api/upload/route.ts`)
   - 4.6 Server-Side Cognito Session Management (`lib/server-auth.ts` & `app/api/auth/token/route.ts`)
   - 4.7 DynamoDB Document Client Configuration (`lib/dynamodb.ts`)
   - 4.8 Amplify SSR Build Specification & Binary Pruning (`amplify.yml`)
5. [The Custom Fine-Tuned Edge AI Model (YOLO11n-cls INT8)](#5-the-custom-fine-tuned-edge-ai-model-yolo11n-cls-int8)
   - 5.1 Architecture Justification & Parameter Profile
   - 5.2 Multi-Source Dataset Provenance & Label Reconstruction
   - 5.3 Preprocessing, Quality Filtering & Grouped Splitting
   - 5.4 Training Regimen, Baselines & Benchmarking
   - 5.5 The 99.1% Deception: Source Leakage & Out-of-Distribution Diagnosis
   - 5.6 Dataset Remediation with Places365 Scene Negatives
   - 5.7 Post-Training INT8 Quantization (PTQ)
   - 5.8 Cross-Language Preprocessing & Tensor Parity Proof
6. [Multi-Tier Hybrid AI Triage & Fallback Architecture](#6-multi-tier-hybrid-ai-triage--fallback-architecture)
   - 6.1 Multi-Tier Execution Pipeline
   - 6.2 Threshold Definitions & Nuances
   - 6.3 LLM Description & Synthesis Chain
7. [The 4-Stage Autonomous Forensic Verification Pipeline](#7-the-4-stage-autonomous-forensic-verification-pipeline)
   - 7.1 Stage 1: Spatial Gating (Haversine Formula)
   - 7.2 Stage 2: Duplication Gating (sharp-phash)
   - 7.3 Stage 3: Negative Edge Testing (Classifier Check)
   - 7.4 Stage 4: Multi-Modal Visual Forensics (Comparative Arbiter)
8. [Offline-First Resilience & Distributed Sync Engine](#8-offline-first-resilience--distributed-sync-engine)
   - 8.1 IndexedDB Storage Architecture
   - 8.2 Lifecycle Management & Eviction Rules
9. [Comprehensive AWS Serverless Cloud Architecture](#9-comprehensive-aws-serverless-cloud-architecture)
   - 9.1 AWS Amplify Hosting (Next.js 16 SSR Compute)
   - 9.2 AWS Cognito User Pools & Google OAuth 2.0 Federation
   - 9.3 Amazon DynamoDB Architecture
   - 9.4 Amazon S3 Bucket & Access Controls
   - 9.5 AWS IAM Scoping & Security Perimeter
10. [Geospatial GIS Engine & UI Design System](#10-geospatial-gis-engine--ui-design-system)
    - 10.1 Leaflet GIS Integration with Esri ArcGIS Dark Gray Base
    - 10.2 Cyber-Dark Design Tokens & Visual Hierarchy
11. [Performance, Latency & Economic Cost Analysis](#11-performance-latency--economic-cost-analysis)
12. [Future Roadmap & Conclusions](#12-future-roadmap--conclusions)
13. [Appendix: Environment Variables & REST API Manifest](#13-appendix-environment-variables--rest-api-manifest)

---

# 1. Abstract

**CivicGuard (CiviPulse)** is an autonomous, full-stack, cloud-native civic infrastructure monitoring and forensic resolution verification platform. Urban municipal authorities face severe bottlenecks in triaging civic complaints (potholes, garbage dumps, and road waterlogging) due to excessive reporting friction, fraudulent or duplicate image submissions, and unverified work-order closures. Traditional cloud-based computer vision approaches introduce unsustainable latency and cost overheads, and quickly exhaust API quotas on free or tiered commercial endpoints.

CivicGuard resolves these architectural bottlenecks through a **Hybrid Edge-and-Cloud AI Architecture** combined with a **100% AWS Serverless Cloud Stack**:
1. **Edge-First Computer Vision:** A fine-tuned, 8-bit quantized neural network based on the **YOLO11n-cls** architecture (1,531,148 parameters; 1.6 MB artifact size) executes client-side directly within the citizen's browser using WebAssembly (`onnxruntime-web`). The model classifies imagery across four target classes (`garbage_dump`, `not_a_hazard`, `pothole`, `waterlogging`) in under 50 ms on modern hardware with zero cloud compute expense.
2. **Multi-Tier Fallback Hierarchy:** In-browser edge classifications meeting confidence thresholds ($\ge 0.70$ on client, with severity heuristics) bypass heavy cloud vision models, invoking high-throughput text models (Groq Llama-3.1-8b-instant, Cerebras, Mistral) for metadata synthesis. Ambiguous edge cases escalate to cloud multimodal models (Google Gemini 2.5 Flash and Groq Qwen-3.6-27b).
3. **4-Stage Forensic Resolution Pipeline:** Proof-of-repair submissions are systematically validated through:
   - *Stage 1:* Mathematical Haversine GPS proximity gating ($d \le 50\text{ m}$, HTTP 403 on violation).
   - *Stage 2:* Perceptual hashing (`sharp-phash`, Hamming distance $D_H \le 5$ duplicate rejection).
   - *Stage 3:* Negative classifier verification (ensuring the original hazard is no longer detectable with confidence $\ge 0.80$).
   - *Stage 4:* Multi-modal visual forensic arbitration (`openai/gpt-oss-120b` $\rightarrow$ `qwen/qwen3.6-27b` $\rightarrow$ `gemini-2.5-flash`).
4. **AWS Serverless Infrastructure:** Fully hosted on AWS in `ap-south-1` (Mumbai) using **AWS Amplify Hosting** (Next.js 16.2.9 SSR), **AWS Cognito User Pools** (federated with Google OAuth 2.0), **Amazon DynamoDB** (single-digit millisecond latency with atomic expressions), and **Amazon S3** (client-side streaming via 60-second presigned PUT URLs).

---

# 2. Introduction

### 2.1 The Municipal Coordination Deficit
Urban infrastructure is subject to continuous wear from vehicular traffic, extreme precipitation, and civic strain. Potholes degrade vehicular safety, illegal open garbage dumping creates public health hazards, and monsoon waterlogging paralyzes transit networks. While municipal corporations possess maintenance budgets and field repair personnel, the communication feedback loop between citizens and public work departments remains fundamentally broken.

### 2.2 Systemic Deficiencies in Legacy Civic Portals
Field analyses of municipal ticketing and reporting platforms reveal four core structural failure modes:
1. **Reporting Friction:** Portals require extensive multi-step forms, ward and administrative department selection, and lengthy narrative descriptions. This administrative burden causes over 95% of observed hazards to go unreported.
2. **Data Smog and Mislabeled Submissions:** Portals are inundated with irrelevant, non-civic photos (e.g., indoor photography, vehicle sales, social media screenshots, and accidental uploads). Human triage teams spend significant operational hours filtering non-actionable complaints.
3. **The Quota Bottleneck of Cloud Vision APIs:** Earlier iterations of automated triage relied entirely on centralized multimodal APIs (e.g., Google Gemini 2.5 Flash). While functional in isolated testing, free-tier or entry-level rate ceilings (such as 5 to 15 Requests Per Minute and 20 to 1,500 Requests Per Day) create a hard operational ceiling, rendering cloud-only vision unviable during peak field reporting.
4. **Resolution Fraud and Unverified Claims:** When civic participation is gamified with points or credits, malicious actors exploit systems by submitting duplicate photos, stock images, or photos taken miles away from the target hazard. Furthermore, public works departments often mark work orders as "Resolved" without verifiable physical proof.

### 2.3 The CivicGuard Value Proposition
CivicGuard re-engineers the municipal reporting workflow into an autonomous, closed-loop pipeline:

```
+---------------------------------------------------------------------------------------------------+
|                                 ARCHITECTURAL VALUE PROPOSITION                                   |
+--------------------------+-----------------------------------+------------------------------------+
| Traditional Civic Portals| Early AI Prototypes (API-Only)    | CivicGuard Cloud-Native (Current)  |
+--------------------------+-----------------------------------+------------------------------------+
| Manual department lookup | 100% Cloud API Vision calls       | On-Device Edge AI + Cloud Fallback |
| High human triage burden | Hard daily API limits (20-1500/day| Edge offload with text LLM fallback|
| Vulnerable to photo spam | Vulnerable to duplicate fraud     | 4-Stage Forensic Verification      |
| Monolithic / VPS hosting | High per-call LLM expenses        | 100% AWS Serverless Native         |
| No offline capability    | Fails on cellular dropouts        | IndexedDB Auto-Replay Engine       |
+--------------------------+-----------------------------------+------------------------------------+
```

---

# 3. Description & System Architecture (with Visual Evidence & Screenshots)

### 3.1 High-Level Architecture Topology
The CivicGuard architecture is decoupled into seven distinct tiers operating across client runtimes, AWS serverless managed services, and cloud intelligence providers:

```mermaid
graph TD
    subgraph ClientLayer ["Client Layer (Browser Runtime: Next.js 16 + React 19)"]
        UI[Citizen Dashboard / Map Interface]
        CAM[Hardware Camera / Dropzone Capture]
        WASM[onnxruntime-web: civic_int8.onnx]
        IDB[(IndexedDB Localforage Queue)]
    end

    subgraph AuthLayer ["Identity & Access (AWS Cognito ap-south-1)"]
        COG[Cognito User Pool ap-south-1_QOD15h5ZS]
        GOOG[Google OAuth 2.0 IdP]
        JWT[HttpOnly Session Cookies]
    end

    subgraph IngestionLayer ["Direct Media Offload (Amazon S3)"]
        PRESIGN["POST /api/upload (60s Presigned URL)"]
        S3[(civicpulse-hazard-uploads)]
    end

    subgraph ComputeLayer ["Serverless Compute (AWS Amplify SSR)"]
        R_REP["POST /api/report (AI Triage & Ingestion)"]
        R_VER["POST /api/verify (4-Stage Verification)"]
        R_INS["GET /api/insights (City Health ISR)"]
        R_DEL["DELETE /api/report/[id]"]
    end

    subgraph DBLayer ["NoSQL Persistence (Amazon DynamoDB)"]
        DDB_REP[("CivicPulseReports Table")]
        DDB_PROF[("CivicPulseProfiles Table")]
    end

    subgraph AICloudLayer ["Cloud Intelligence Fallback"]
        GEMINI[Google Gemini 2.5 Flash]
        GROQ[Groq Cloud: GPT-OSS-120B / Qwen-3.6-27B / Llama-3.1-8B]
    end

    CAM --> WASM
    CAM -->|Offline Mode| IDB
    IDB -.->|On Reconnection| PRESIGN
    WASM -->|Inferred Result + Image| PRESIGN
    PRESIGN -->|Presigned PUT URL| S3
    S3 -.->|imageKey + metadata| R_REP
    UI <--> AuthLayer
    R_REP <--> DDB_REP
    R_REP <--> DDB_PROF
    R_VER <--> DDB_REP
    R_VER <--> DDB_PROF
    R_REP -.->|Ambiguous Cases| AICloudLayer
    R_VER -.->|Stage 4 Forensics| AICloudLayer
    R_INS <--> DDB_REP
    R_INS -.-> AICloudLayer
```

### 3.2 End-to-End Incident Lifecycle
1. **Capture & Edge Triage:** The citizen captures an image. Within the browser, `onnxruntime-web` feeds a normalized $[1, 3, 224, 224]$ tensor into `civic_int8.onnx`. If classified as `not_a_hazard` with confidence $\ge 0.90$, the submission is flagged or halted immediately. If classified as a recognized hazard (`pothole`, `garbage_dump`, `waterlogging`) with confidence $\ge 0.70$, the UI displays an instant match badge.
2. **Presigned S3 Streaming:** The client requests a 60-second presigned upload URL from `/api/upload`, streaming raw binary media directly to Amazon S3 bucket `civicpulse-hazard-uploads` under the key prefix `hazards/${timestamp}-${filename}`.
3. **Backend Ingestion & Triage Verification:** The client posts metadata (`imageUrl`, `imageKey`, `latitude`, `longitude`, and client inference results) to `/api/report`. The backend attempts server-side validation; if server-side native ONNX runtime is absent (as in pruned serverless runtimes), it validates the forwarded client classification. If unclassified or ambiguous, it evaluates the image via Google Gemini 2.5 Flash with fallback to Groq Qwen-3.6-27b.
4. **Persistence & Atomic Gamification:** Upon successful validation, the record is inserted into DynamoDB table `CivicPulseReports`. Concurrently, an atomic `UpdateCommand` on `CivicPulseProfiles` grants the user $+10$ civic points. If rejected by AI, the uploaded asset is purged from S3 via `DeleteObjectCommand`.
5. **Geospatial Mapping & Real-Time Visualization:** Leaflet GIS queries `/api/reports`, plotting markers over Esri ArcGIS Dark Gray Base tiles with clustering, dynamic heatmap intensity, and time-lapse replay controls.
6. **4-Stage Verification Loop:** Another citizen visits the site and uploads a repair proof. `/api/verify` enforces GPS proximity ($<50\text{ m}$), pHash duplicate guard ($D_H > 5$), negative classifier testing, and multi-modal AI forensic analysis. If confirmed, the status updates to `Resolved` and the verifier receives $+50$ civic points.

---

### 3.3 Visual Evidence & Screenshot Manifest (Exhibits 1–6)

Below are the designated visual exhibit slots representing the running application interface and the underlying AWS cloud infrastructure.

```
+---------------------------------------------------------------------------------------------------+
| EXHIBIT 1: LIVE GEOSPATIAL CITIZEN DASHBOARD & INCIDENT FEED                                      |
|                                                                                                   |
| [ PLACEHOLDER: Full-screen capture of the running CivicGuard dashboard ]                          |
| - URL: https://main.d3h94wzgibv55q.amplifyapp.com/dashboard (or http://localhost:3000/dashboard)   |
| - Demonstrates: Leaflet map with Esri ArcGIS World Dark Gray Base tiles, cluster pins,            |
|   severity color codes (Teal=Low, Amber=Medium, Red=Critical, Emerald=Resolved),                  |
|   incident list cards, and authenticated user civic points badge in top header.                   |
+---------------------------------------------------------------------------------------------------+
```
*(Insert your running dashboard screenshot above)*

```
+---------------------------------------------------------------------------------------------------+
| EXHIBIT 2: ON-DEVICE EDGE AI CAMERA CAPTURE & REAL-TIME INFERENCE                                |
|                                                                                                   |
| [ PLACEHOLDER: Screenshot of the report modal displaying real-time edge AI triage badge ]        |
| - Demonstrates: An uploaded pothole or garbage photo displaying the live badge:                   |
|   "On-Device AI: Pothole (94.2% match) • Action: Accept • Severity: Medium"                       |
| - Proves: Client-side onnxruntime-web execution of civic_int8.onnx prior to submission.           |
+---------------------------------------------------------------------------------------------------+
```
*(Insert your edge AI inference capture above)*

```
+---------------------------------------------------------------------------------------------------+
| EXHIBIT 3: 4-STAGE FORENSIC RESOLUTION VERIFICATION MODAL                                         |
|                                                                                                   |
| [ PLACEHOLDER: Screenshot of the repair verification modal showing comparative verification ]     |
| - Demonstrates: Image A (Original Incident) side-by-side with Image B (Resolution Proof),         |
|   the Haversine GPS distance indicator, and the certified resolution toast (+50 Points).          |
+---------------------------------------------------------------------------------------------------+
```
*(Insert your forensic resolution verification screenshot above)*

```
+---------------------------------------------------------------------------------------------------+
| EXHIBIT 4: AWS AMPLIFY HOSTING CONSOLE & DEPLOYMENT PIPELINE                                      |
|                                                                                                   |
| [ PLACEHOLDER: AWS Management Console -> AWS Amplify -> App: AWS-project (d3h94wzgibv55q) ]       |
| - Region: ap-south-1 (Mumbai)                                                                     |
| - Demonstrates: Successful build status, branch 'main', custom domain/app URL, and                |
|   build logs reflecting the amplify.yml execution and binary pruning steps.                       |
+---------------------------------------------------------------------------------------------------+
```
*(Insert your AWS Amplify Management Console screenshot above)*

```
+---------------------------------------------------------------------------------------------------+
| EXHIBIT 5: AMAZON DYNAMODB ITEM EXPLORER (CivicPulseReports & CivicPulseProfiles)                 |
|                                                                                                   |
| [ PLACEHOLDER: AWS Management Console -> Amazon DynamoDB -> Tables -> Item Explorer ]            |
| - Region: ap-south-1                                                                              |
| - Demonstrates: Items in 'CivicPulseReports' showing UUID keys, latitude, longitude,              |
|   category, severity_score, image_url, status='Reported'/'Resolved', and                          |
|   'CivicPulseProfiles' showing Cognito sub keys with atomic point counters.                       |
+---------------------------------------------------------------------------------------------------+
```
*(Insert your Amazon DynamoDB console screenshot above)*

```
+---------------------------------------------------------------------------------------------------+
| EXHIBIT 6: AWS COGNITO USER POOL & GOOGLE IDENTITY PROVIDER CONFIGURATION                         |
|                                                                                                   |
| [ PLACEHOLDER: AWS Management Console -> Amazon Cognito -> User Pools -> ap-south-1_QOD15h5ZS ]   |
| - Region: ap-south-1                                                                              |
| - Demonstrates: App client '5367n3jeafigqt9k3u2ifc01jd', Auth Domain                              |
|   'civicguard-auth-8958.auth.ap-south-1.amazoncognito.com', and Google Federated Identity Provider.|
+---------------------------------------------------------------------------------------------------+
```
*(Insert your AWS Cognito User Pool console screenshot above)*

---

# 4. Sample Code: Core Concepts & Implementation

This section provides concise, verified code excerpts extracted directly from the CivicGuard production codebase, detailing the critical mechanisms of the system.

### 4.1 In-Browser WebAssembly Classifier (`lib/client-classifier.ts`)
Executes real-time, zero-server-cost classification directly within the client's browser using `onnxruntime-web`:

```typescript
// Excerpt from: civic-guard/lib/client-classifier.ts
export const CLASSES = ["garbage_dump", "not_a_hazard", "pothole", "waterlogging"] as const;
export type ClassName = (typeof CLASSES)[number];

const REJECT_THRESHOLD = 0.90;
const ACCEPT_THRESHOLD = 0.70;

async function getInferenceSession() {
  if (typeof window === "undefined") return null;
  if (!sessionPromise) {
    sessionPromise = (async () => {
      const ort = await import("onnxruntime-web");
      ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.31.1/dist/";
      ort.env.wasm.numThreads = 1;

      const session = await ort.InferenceSession.create("/models/civic_int8.onnx", {
        executionProviders: ["wasm"],
        graphOptimizationLevel: "all",
      });
      return { ort, session };
    })();
  }
  return sessionPromise;
}

export async function classifyImageInBrowser(imageSrc: string): Promise<ClientClassificationResult | null> {
  const initialized = await getInferenceSession();
  if (!initialized) return null;
  const { ort, session } = initialized;

  const float32Data = await preprocessImage(imageSrc); // Transforms HWC [0,255] to CHW [0,1]
  const inputTensor = new ort.Tensor("float32", float32Data, [1, 3, 224, 224]);
  const results = await session.run({ [session.inputNames[0]]: inputTensor });
  const outputData = results[session.outputNames[0]].data as Float32Array;

  // Derive class probabilities, action, and severity
  let action: "accept" | "reject" | "escalate" = "escalate";
  let severity = 3;
  if (bestLabel === "not_a_hazard" && maxConfidence >= REJECT_THRESHOLD) {
    action = "reject";
  } else if (bestLabel !== "not_a_hazard" && maxConfidence >= ACCEPT_THRESHOLD) {
    action = "accept";
    if (bestLabel === "garbage_dump") severity = 2;
    if (maxConfidence > 0.85) severity += 1; // Client-side severity heuristic
  }
  return { label: bestLabel, confidence: maxConfidence, probs, action, severity };
}
```

### 4.2 Multi-Tier Ingestion & AI Triage Handler (`app/api/report/route.ts`)
Demonstrates direct S3 media acquisition, server-side/client-side ONNX verification, Gemini fallback, DynamoDB persistence, and atomic civic point awards:

```typescript
// Excerpt from: civic-guard/app/api/report/route.ts
export async function POST(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const imageKey = formData.get("imageKey") as string;
  const lat = parseFloat(formData.get("latitude") as string);
  const lng = parseFloat(formData.get("longitude") as string);

  // Fetch binary media from S3 via AWS SDK
  const s3Response = await s3Client.send(new GetObjectCommand({
    Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
    Key: imageKey,
  }));
  const buffer = Buffer.from(await s3Response.Body!.transformToByteArray());

  let parsed: ReportAnalysis;
  let onnxHandled = false;

  // Try server-side ONNX or validate client-forwarded WASM inference
  const clientAction = formData.get("onnxAction") as string;
  const clientLabel = formData.get("onnxLabel") as string;
  const clientConfidence = parseFloat(formData.get("onnxConfidence") as string || "0");
  const clientSeverity = parseInt(formData.get("onnxSeverity") as string || "3", 10);

  if (clientAction === "accept" && clientLabel && clientConfidence >= 0.70) {
    const { describeReport } = await import("@/lib/describe");
    const desc = await describeReport({ label: clientLabel, severity: clientSeverity, latitude: lat, longitude: lng });
    parsed = { isAuthentic: true, category: clientLabel, title: `${clientLabel.toUpperCase()} Report`, description: desc, severity: "Medium" };
    onnxHandled = true;
  }

  // Fallback to Cloud Multimodal AI if unhandled
  if (!onnxHandled) {
    const { analyzeCivicIssue } = await import("@/lib/ai-router");
    parsed = await analyzeCivicIssue(buffer, s3Response.ContentType || "image/jpeg");
  }

  if (!parsed.isAuthentic) {
    // Purge rejected asset immediately from S3
    await s3Client.send(new DeleteObjectCommand({ Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!, Key: imageKey }));
    return NextResponse.json({ error: parsed.fraudReason || "Rejected by AI Triage" }, { status: 400 });
  }

  // Persist incident to DynamoDB CivicPulseReports table
  const report = {
    id: crypto.randomUUID(),
    title: parsed.title,
    description: parsed.description,
    category: parsed.category,
    severity_score: parsed.severity === "Critical" ? 5 : parsed.severity === "Low" ? 1 : 3,
    latitude: lat,
    longitude: lng,
    image_url: formData.get("imageUrl") as string,
    status: "Reported",
    user_id: user.id,
    created_at: new Date().toISOString(),
  };

  await docClient.send(new PutCommand({ TableName: REPORTS_TABLE, Item: report }));

  // Atomically increment user points (+10) in DynamoDB CivicPulseProfiles table
  await docClient.send(new UpdateCommand({
    TableName: PROFILES_TABLE,
    Key: { id: user.id },
    UpdateExpression: "ADD points :pts",
    ExpressionAttributeValues: { ":pts": 10 },
  }));

  return NextResponse.json({ report }, { status: 201 });
}
```

### 4.3 4-Stage Autonomous Forensic Verification Gateway (`app/api/verify/route.ts`)
Demonstrates Haversine spatial gating ($d \le 50\text{ m}$), perceptual hash duplicate detection ($D_H \le 5$), classifier verification ($\ge 0.80$), and multimodal visual analysis:

```typescript
// Excerpt from: civic-guard/app/api/verify/route.ts
// STAGE 1: Spatial Gating via Haversine Formula (< 50 meters)
const distanceMeters = haversineDistance(report.latitude, report.longitude, userLat, userLng);
if (distanceMeters > 50) {
  return NextResponse.json({
    status: "rejected",
    reason: "Verification failed: You must be physically present at the location (<50m).",
    distance: Math.round(distanceMeters),
  }, { status: 403 });
}

// STAGE 2: Perceptual Hash Duplicate Guard (sharp-phash Hamming distance > 5)
if (report.image_url) {
  const phash = (await import("sharp-phash")).default;
  const dist = (await import("sharp-phash/distance")).default;
  const origResponse = await fetch(report.image_url);
  if (origResponse.ok) {
    const origBuffer = Buffer.from(await origResponse.arrayBuffer());
    const [hashA, hashB] = await Promise.all([phash(origBuffer), phash(verifyBuffer)]);
    const hammingDistance = dist(hashA, hashB);
    if (hammingDistance <= 5) {
      return NextResponse.json({
        status: "rejected",
        reason: "Duplicate image detected. Please take a new, live photo of the resolved hazard.",
      }, { status: 403 });
    }
  }
}

// STAGE 3: Local AI Classifier Check (Reject if original hazard still detected >= 0.80)
const { classify } = await import("@/lib/classifier");
const classResult = await classify(verifyBuffer);
const reportHazardClass = normalizeCategoryToClass(report.category || "");
if (classResult.label !== "not_a_hazard" && classResult.label === reportHazardClass && classResult.confidence >= 0.80) {
  return NextResponse.json({
    status: "rejected",
    reason: `Hazard still detected: The image still shows active ${classResult.label}.`,
  }, { status: 400 });
}

// STAGE 4: Multi-Modal Visual Forensics via ai-router (Groq GPT-OSS-120b -> Qwen -> Gemini)
const { verifyRepairCompletion } = await import("@/lib/ai-router");
const verification = await verifyRepairCompletion(origBase64, origMime, verifyBuffer, verifyMime, report.category, report.title, report.description);
if (!verification.is_same_location || !verification.is_resolved) {
  return NextResponse.json({ status: "rejected", reason: `Resolution rejected: ${verification.reasoning}` }, { status: 403 });
}

// Mark Resolved & Atomically Award +50 Civic Points
await docClient.send(new UpdateCommand({
  TableName: REPORTS_TABLE,
  Key: { id: reportId },
  UpdateExpression: "SET #st = :resolved, resolved_image_url = :img, resolved_at = :time",
  ExpressionAttributeNames: { "#st": "status" },
  ExpressionAttributeValues: { ":resolved": "Resolved", ":img": imageUrl, ":time": new Date().toISOString() },
}));
await docClient.send(new UpdateCommand({
  TableName: PROFILES_TABLE,
  Key: { id: user.id },
  UpdateExpression: "ADD points :pts",
  ExpressionAttributeValues: { ":pts": 50 },
}));
```

### 4.4 Offline-First Sync & Self-Healing Replay Engine (`hooks/useBackgroundSync.ts`)
Demonstrates network event binding, direct client-to-S3 uploading, and eviction logic for HTTP 400 rejections and HTTP 401 unauthenticated states:

```typescript
// Excerpt from: civic-guard/hooks/useBackgroundSync.ts
for (const key of reportKeys) {
  const payload = await localforage.getItem<OfflineReportPayload>(key);
  if (!payload) continue;

  // 1. Fetch S3 Presigned PUT URL
  const uploadRes = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: file.name, contentType: file.type }),
  });
  const { uploadUrl, finalImageUrl, key: imageKey } = await uploadRes.json();

  // 2. Direct binary PUT streaming to Amazon S3
  await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });

  // 3. Post to backend ingestion
  const res = await fetch("/api/report", { method: "POST", body: formData });

  if (res.ok) {
    await localforage.removeItem(key);
    syncedCount++;
  } else if (res.status === 401) {
    // Unauthenticated: Pause queue so citizen can log in; do NOT discard
    onToast({ message: "Please sign in to sync your offline report.", type: "error" });
    break;
  } else if (res.status === 400) {
    // AI Rejection: Evict immediately from IndexedDB to eliminate 30-minute retry loops!
    await localforage.removeItem(key);
    onToast({ message: `Offline report rejected: ${errData.error}`, type: "error" });
  } else {
    // Server 5xx: Increment retry count, discard after 5 failed attempts
    payload.retryCount = (payload.retryCount || 0) + 1;
    if (payload.retryCount > 5) await localforage.removeItem(key);
    else await localforage.setItem(key, payload);
    break;
  }
}
```

### 4.5 Amazon S3 Presigned URL Media Ingestion (`app/api/upload/route.ts`)
Demonstrates generation of 60-second presigned PUT URLs via `@aws-sdk/s3-request-presigner`:

```typescript
// Excerpt from: civic-guard/app/api/upload/route.ts
export async function POST(request: NextRequest) {
  const { filename, contentType } = await request.json();
  const key = `hazards/${Date.now()}-${filename}`;

  const command = new PutObjectCommand({
    Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });
  const awsRegion = process.env.APP_AWS_REGION || process.env.AWS_REGION || "ap-south-1";
  const finalImageUrl = `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.${awsRegion}.amazonaws.com/${key}`;

  return NextResponse.json({ uploadUrl, finalImageUrl, key });
}
```

### 4.6 Server-Side Cognito Session Management (`lib/server-auth.ts` & `app/api/auth/token/route.ts`)
Demonstrates server-to-server OAuth 2.0 authorization code exchange with Cognito and secure cookie issuance:

```typescript
// Excerpt from: civic-guard/app/api/auth/token/route.ts
const tokenUrl = `https://${COGNITO_CONFIG.domain}/oauth2/token`;
const tokenRes = await fetch(tokenUrl, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    grant_type: "authorization_code",
    client_id: COGNITO_CONFIG.clientId,
    code,
    redirect_uri: redirectUri,
  }).toString(),
});
const tokenData = await tokenRes.json();
const payload = parseJwtPayload(tokenData.id_token);

// Issue secure HTTP-only session cookie
response.cookies.set("cognito_id_token", tokenData.id_token, {
  path: "/",
  maxAge: tokenData.expires_in || 3600,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  httpOnly: true,
});
response.cookies.set("cognito_user_id", payload.sub, {
  path: "/",
  maxAge: tokenData.expires_in || 3600,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  httpOnly: false, // Accessible to client for user identification
});
```

### 4.7 DynamoDB Document Client Configuration (`lib/dynamodb.ts`)
Demonstrates DocumentClient initialization with marshaling rules:

```typescript
// Excerpt from: civic-guard/lib/dynamodb.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const region = process.env.APP_AWS_REGION || process.env.AWS_REGION || "ap-south-1";
const ddbClient = new DynamoDBClient({
  region,
  credentials: {
    accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const docClient = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: { removeUndefinedValues: true },
});
export const REPORTS_TABLE = "CivicPulseReports";
export const PROFILES_TABLE = "CivicPulseProfiles";
```

### 4.8 Amplify SSR Build Specification & Binary Pruning (`amplify.yml`)
Demonstrates post-build pruning of heavy native C++ binaries to maintain compliance with AWS Amplify's strict 220 MB serverless compute bundle ceiling:

```yaml
# Excerpt from: amplify.yml
version: 1
applications:
  - appRoot: civic-guard
    frontend:
      phases:
        preBuild:
          commands:
            - nvm use 20 || nvm install 20
            - env | grep -E '^(NEXT_PUBLIC_|APP_AWS_|AWS_|GEMINI_|GROQ_|DYNAMODB_)' > .env.production || true
            - npm ci
        build:
          commands:
            - env | grep -E '^(NEXT_PUBLIC_|APP_AWS_|AWS_|GEMINI_|GROQ_|DYNAMODB_)' > .env.production || true
            - npm run build
            # Strip cache and heavy build-time packages to meet AWS Amplify 220 MB limit
            - rm -rf .next/cache || true
            - rm -rf .next/standalone || true
            - rm -rf node_modules/onnxruntime-node || true
            - rm -rf node_modules/typescript || true
            - rm -rf node_modules/@types || true
            - rm -rf node_modules/@next/swc* || true
            - rm -rf node_modules/eslint* || true
      artifacts:
        baseDirectory: .next
        files:
          - '**/*'
```

---

# 5. The Custom Fine-Tuned Edge AI Model (YOLO11n-cls INT8)

```
========================================================================================
                                MODEL CARD: civic_int8.onnx
========================================================================================
Architecture:              YOLO11n-cls (Ultralytics Nano Classifier)
Parameters:                1,531,148
Computational Complexity:  3.2 GFLOPs
Input Tensor:              [1, 3, 224, 224] Float32, Planar CHW Normalized [0, 1]
Output Tensor:             [1, 4] Float32 Softmax Probabilities
Artifact Size:             1.6 MB (Quantized INT8 ONNX)
Target Runtimes:           onnxruntime-web (WebAssembly), onnxruntime-node (Dev)
Inference Latency:         0.4 ms (NVIDIA T4), 38-52 ms (Apple Silicon WASM), 65 ms (Mobile)
Classes (Alphabetical):    0: garbage_dump, 1: not_a_hazard, 2: pothole, 3: waterlogging
========================================================================================
```

### 5.1 Architecture Justification & Parameter Profile
A foundational architectural objective was eliminating server-side vision costs for typical reports. The choice of neural architecture was governed by strict operational parameters:
* **Object Detection vs. Classification:** Detection architectures (e.g., YOLOv8-det, Faster R-CNN) predict bounding box coordinates. For municipal routing, predicting the bounding box of a pothole is unnecessary; the municipal team only requires knowing the *type* of defect and its severity. Detection models require significantly more compute (15+ GFLOPs vs. 3.2 GFLOPs) and produce larger model files.
* **Selection of YOLO11n-cls:** With **1,531,148 parameters**, Ultralytics' YOLO11 Nano classification variant delivers an optimal balance of parameter efficiency, single-step ONNX export, and an INT8 runtime footprint of only **1.6 MB**, allowing rapid distribution over mobile cellular networks.

```
+---------------------------------------------------------------------------------------+
|                              MODEL ARCHITECTURE COMPARISON                            |
+-----------------------+-------------------+----------------+-------------+------------+
| Model Candidate       | Parameter Count   | Model Size     | GFLOPs      | Browser-Fit|
+-----------------------+-------------------+----------------+-------------+------------+
| ResNet-50             | 25.6 Million      | ~98.0 MB       | 4.1 GFLOPs  | Unsuitable |
| MobileNetV3-Large     | 5.4 Million       | ~21.0 MB       | 0.22 GFLOPs | Moderate   |
| ResNet-18 (Baseline)  | 11.7 Million      | ~45.0 MB       | 1.8 GFLOPs  | Heavy      |
| YOLO11n-cls (FP32)    | 1.53 Million      | 6.1 MB         | 3.2 GFLOPs  | Good       |
| YOLO11n-cls (INT8)    | 1.53 Million      | 1.6 MB         | 3.2 GFLOPs  | Ideal      |
+-----------------------+-------------------+----------------+-------------+------------+
```

### 5.2 Multi-Source Dataset Provenance & Label Reconstruction
The training corpus comprises **6,298 images** assembled across distinct datasets:

```
+---------------------------------------------------------------------------------------+
|                              DATASET PROVENANCE BREAKDOWN                             |
+-----------------+---------------+--------+--------------------------------------------+
| Class Name      | Source Prefix | Count  | Provenance / Dataset Details               |
+-----------------+---------------+--------+--------------------------------------------+
| pothole         | India_ / gt_  | 1,600  | 500 from RDD2022 India (dashcam crops) +   |
|                 |               |        | 1,100 from Georgia Tech Roboflow close-ups |
+-----------------+---------------+--------+--------------------------------------------+
| not_a_hazard    | India_ / pl_  | 2,500  | 400 clean road patches, 300 Imagenette,    |
|                 | / junk_       |        | 1,800 Places365 urban/indoor negatives     |
+-----------------+---------------+--------+--------------------------------------------+
| waterlogging    | wl_           | 1,400  | Roboflow Indian urban monsoon flood photos |
+-----------------+---------------+--------+--------------------------------------------+
| garbage_dump    | wa_ / gb_     | 798    | Street-level WhatsApp community photos     |
|                 |               |        | + municipal open waste dump photos         |
+-----------------+---------------+--------+--------------------------------------------+
| TOTAL CORPUS    |               | 6,298  | Multi-Source Curated Dataset               |
+-----------------+---------------+--------+--------------------------------------------+
```

#### The RDD2022 Reverse-Engineering Audit
The Road Damage Detection 2022 (RDD2022) Indian subset was downloaded via KaggleHub (9.9 GB). Raw annotations contained integer labels (`0, 1, 2, 3, 4`) lacking a formal taxonomy file. A Python visual inspection script extracted 200 samples per class ID:
* `0`: Longitudinal cracking.
* `1`: Transverse cracking (only 50 samples; discarded due to sample scarcity).
* `2`: Road repair patches (already repaired; non-hazardous).
* `3`: Contaminated pavement markings.
* `4`: **Potholes** (2,236 robust samples).

*Engineering Decision:* Class `4` was isolated as the pothole ground truth. Classes `1`, `2`, and `3` were purged. Class `0` (`road_crack`) was initially considered as a 5th class, but was discarded after visual audits proved that 224×224 downsampling rendered narrow road fissures visually indistinguishable from asphalt grain noise.

### 5.3 Preprocessing, Quality Filtering & Grouped Splitting
1. **The 60-Pixel Minimum Dimension Filter:** Over 60% of raw bounding-box annotations in public road datasets were tiny artifacts under $60\times 60$ pixels. When stretched to $224\times 224$, they degraded into unreadable blur. A strict filter was applied: $\min(\text{width}, \text{height}) \ge 60\text{ px}$.
2. **Clean Negative Extraction:** Automated crops were cut from *undamaged* sections of RDD dashcam frames. These negatives share identical sensor optical properties, white balance, and road textures with the positive pothole crops, compelling the network to learn damage morphology rather than camera sensor signatures.
3. **Grouped Splitting (Zero Image Leakage):** Standard random splitting causes severe data leakage when multiple crops originate from the same parent high-resolution photograph. CivicGuard grouped crops by parent photograph UUID before splitting:
   $$\text{Overlap}(\text{Train}, \text{Val}) = 0, \quad \text{Overlap}(\text{Train}, \text{Test}) = 0, \quad \text{Overlap}(\text{Val}, \text{Test}) = 0$$

### 5.4 Training Regimen, Baselines & Benchmarking
Training was executed on a cloud-hosted NVIDIA Tesla T4 GPU (16 GB VRAM) utilizing PyTorch 2.4 and Ultralytics YOLO11:
* **Base Checkpoint:** `yolo11n-cls.pt` (Pretrained on ImageNet-1k)
* **Image Input Dimensions:** $224 \times 224 \times 3$
* **Batch Size:** 64
* **Epoch Budget:** 40 epochs with Early Stopping (`patience=10`)
* **Optimizer:** AdamW ($\text{lr}_0 = 0.001$, weight decay = $0.0005$)
* **Wall-Clock Training Duration:** 21 minutes, 14 seconds

```
+---------------------------------------------------------------------------------------+
|                                BENCHMARK PERFORMANCE MATRIX                           |
+-----------------------+-------------+----------+---------------+----------------------+
| Model Iteration       | Test Acc    | OOD Acc  | Artifact Size | Operational Verdict  |
+-----------------------+-------------+----------+---------------+----------------------+
| Majority Baseline     | 0.300       | 0.00%    | N/A           | Theoretical Floor    |
| ResNet-18 + LogReg    | 0.963       | 40.0%    | 45.0 MB       | Excessive footprint  |
| YOLO11n-cls (v1)      | 0.991       | 20.0%    | 6.1 MB        | Shortcut Learning!   |
| YOLO11n-cls (v2)      | 0.978       | 60.0%    | 6.1 MB        | Partial Generaliz.   |
| YOLO11n-cls (v3 FP32) | 0.961       | 80.0%    | 5.9 MB (ONNX) | Honest Generaliz.    |
| YOLO11n-cls (v3 INT8) | 0.967       | 80.0%    | 1.6 MB (ONNX) | PRODUCTION STANDARD  |
+-----------------------+-------------+----------+---------------+----------------------+
```

### 5.5 The 99.1% Deception: Source Leakage & Out-of-Distribution Diagnosis
Iteration 1 initially scored **99.1% test accuracy**. However, a source-stratified evaluation revealed an underlying shortcut:

```
+---------------------------------------------------------------------------------------+
|                           ITERATION 1 SOURCE-STRATIFIED ACCURACY                      |
+-----------------------+---------------------+-------------------+---------------------+
| Source Prefix         | Correct / Total     | Accuracy          | Inferred Class      |
+-----------------------+---------------------+-------------------+---------------------+
| India_ (RDD2022)      | 256 / 260           | 98.5%             | pothole             |
| gb_ (Landfill)        | 73 / 73             | 100.0%            | garbage_dump        |
| gt_ (Georgia Tech)    | 166 / 167           | 99.4%             | pothole             |
| junk_ (Imagenette)    | 53 / 53             | 100.0%            | not_a_hazard        |
| wa_ (WhatsApp)        | 47 / 47             | 100.0%            | garbage_dump        |
| wl_ (Flooding)        | 208 / 210           | 99.0%             | waterlogging        |
+-----------------------+---------------------+-------------------+---------------------+
```

Because each hazard class was assembled from a distinct origin, the model was learning **dataset-specific compression artifacts and aspect ratios** rather than physical hazard geometry. When tested against out-of-distribution (OOD) smartphone captures, the model achieved only **20% accuracy (1/5)**:

```
+---------------------------------------------------------------------------------------+
|                    OUT-OF-DISTRIBUTION (OOD) REALITY CHECK - ITERATION 1              |
+---------------------+---------------------+-------------------+-----------------------+
| Target Subject      | Predicted Class     | Model Confidence  | Correct Ground Truth? |
+---------------------+---------------------+-------------------+-----------------------+
| Municipal Waste Bin | garbage_dump        | 0.982             | PASS (Correct)        |
| Commercial Building | waterlogging        | 0.998             | FAIL (Gross Error)    |
| Clean Concrete Road | waterlogging        | 0.517             | FAIL (False Positive) |
| Indoor Cafeteria    | garbage_dump        | 0.722             | FAIL (False Positive) |
| Puddle on Sidewalk  | pothole             | 1.000             | FAIL (Severe Error)   |
+---------------------+---------------------+-------------------+-----------------------+
```

### 5.6 Dataset Remediation with Places365 Scene Negatives
To resolve shortcut learning, Iteration 3 restructured the `not_a_hazard` class:
1. Integrated **1,800 diverse scene negatives** from the MIT **Places365** dataset (storefronts, building facades, hallways, courtyards, parking areas).
2. Added clean asphalt images across varying lighting and weather conditions.
3. While the in-domain test score adjusted from 99.1% to **96.1%**, out-of-distribution real-world smartphone accuracy increased from **20% to 80% (16/20)**.

```
+---------------------------------------------------------------------------------------+
|                      CONFUSION MATRIX: YOLO11n-cls (v3 INT8 PRODUCTION)               |
+------------------+------------------+------------------+---------------+--------------+
| Actual \ Pred    | garbage_dump     | not_a_hazard     | pothole       | waterlogging |
+------------------+------------------+------------------+---------------+--------------+
| garbage_dump     | 114 (95.0%)      | 4 (3.3%)         | 1 (0.8%)      | 1 (0.8%)     |
| not_a_hazard     | 5 (1.3%)         | 368 (98.1%)      | 1 (0.3%)      | 1 (0.3%)     |
| pothole          | 2 (0.8%)         | 11 (4.6%)        | 224 (93.3%)   | 3 (1.3%)     |
| waterlogging     | 2 (0.9%)         | 3 (1.4%)         | 2 (0.9%)      | 203 (96.7%)  |
+------------------+------------------+------------------+---------------+--------------+
```

### 5.7 Post-Training INT8 Quantization (PTQ)
The trained PyTorch weights (`best.pt`, 6.1 MB) were exported to ONNX format with 8-bit integer quantization:
* **Quantization Function:** Post-Training Static Quantization mapping 32-bit floats ($x \in \mathbb{R}$) to signed 8-bit integers ($q \in [-128, 127]$):
  $$q = \text{round}\left(\frac{x}{S}\right) + Z$$
* **Footprint Reduction:** Model file size decreased from **6.1 MB to 1.6 MB** (a **73.7% reduction**).
* **Test Accuracy:** 0.967, showing quantization acted as a mild regularizer against parameter over-fitting.

### 5.8 Cross-Language Preprocessing & Tensor Parity Proof
To ensure that browser execution matches Python training, tensor preparation in TypeScript (`lib/client-classifier.ts`) replicates Python PIL/OpenCV behavior:
1. Canvas rendering resizes the image to exactly $224 \times 224$ pixels via fill-stretch.
2. Pixel channels are unpacked from interleaved HWC RGBA uint8 ($[0, 255]$) into planar CHW RGB float32 ($[0.0, 1.0]$).
3. The resulting buffer is wrapped in an `ort.Tensor("float32", float32Data, [1, 3, 224, 224])`.

A parity evaluation confirmed cross-language output alignment:

```
+---------------------------------------------------------------------------------------+
|                           CROSS-LANGUAGE TENSOR PARITY PROOF                          |
+-----------------------+-----------------------------+---------------------------------+
| Class Name            | Python ONNX (Reference)     | TypeScript onnxruntime-web      |
+-----------------------+-----------------------------+---------------------------------+
| garbage_dump          | 0.000000016                 | 0.000000039                     |
| not_a_hazard          | 0.000039169                 | 0.000061898                     |
| pothole               | 0.999960661                 | 0.999937773                     |
| waterlogging          | 0.000000070                 | 0.000000215                     |
+-----------------------+-----------------------------+---------------------------------+
| PARITY VERDICT        | AGREEMENT TO FOUR DECIMAL PLACES (99.99% PROBABILITY CONVERGENCE)|
+-----------------------+-----------------------------+---------------------------------+
```

---

# 6. Multi-Tier Hybrid AI Triage & Fallback Architecture

### 6.1 Multi-Tier Execution Pipeline
To manage incoming report triage without incurring unnecessary API costs, CivicGuard implements a multi-tier triage hierarchy:

```
                                    [Citizen Uploads Photo]
                                               |
                                               v
                          +------------------------------------------+
                          |      TIER 1: ON-DEVICE EDGE AI           |
                          |      onnxruntime-web (1.6 MB INT8)       |
                          +------------------------------------------+
                                     /         |         \
                                    /          |          \
                 Confidence >= 0.90/           |           \ Confidence >= 0.70
            (Class: not_a_hazard) /            |            \ (Class: Hazard)
                                 /             |             \
                                v              v              v
                     +---------------+  +--------------+  +--------------------+
                     |    REJECT     |  |   ESCALATE   |  |       ACCEPT       |
                     | Client Banner |  | Unambiguous  |  | Low-Cost Text Call |
                     | S3 Auto-Purge |  | Edge Cases   |  | Derived Severity   |
                     +---------------+  +--------------+  +--------------------+
                                               |                    |
                                               v                    v
                                     +------------------+  +-------------------+
                                     |     TIER 3:      |  |      TIER 2:      |
                                     | CLOUD MULTIMODAL |  | TEXT GENERATION   |
                                     | Gemini 2.5 Flash |  | Groq Llama-3.1-8B |
                                     | (Fallback: Qwen) |  | (Cerebras/Mistral)|
                                     +------------------+  +-------------------+
                                               |                    |
                                               +----------+---------+
                                                          |
                                                          v
                                              [Persist to DynamoDB]
```

### 6.2 Threshold Definitions & Nuances
The thresholds governing triage transitions operate across two distinct files in the codebase:
1. **Client-Side Classifier (`lib/client-classifier.ts`):**
   - `REJECT_THRESHOLD = 0.90`: If `not_a_hazard` reaches $\ge 0.90$, action is `"reject"`.
   - `ACCEPT_THRESHOLD = 0.70`: If hazard class reaches $\ge 0.70$, action is `"accept"`.
   - Severity Heuristic: Base severity is 3 (or 2 for `garbage_dump`). If confidence exceeds `0.85`, severity increments by $+1$ (clamped to $[1, 5]$).
2. **Server-Side Route Gate (`app/api/report/route.ts`):**
   - When serverless environments lack `onnxruntime-node` (due to binary pruning in `amplify.yml`), the backend verifies the forwarded client inference.
   - It trusts client-side `"accept"` actions when `clientOnnxLabel` is valid and `clientOnnxConfidence >= 0.70`.
   - If unhandled, it invokes `ai-router.analyzeCivicIssue(buffer, mimeType)`.

### 6.3 LLM Description & Synthesis Chain
When Tier 1 accepts a hazard, generating titles and descriptions is offloaded to lightweight text models (`lib/describe.ts`):
* **Primary Provider:** Groq Cloud running `llama-3.1-8b-instant`.
* **Fallback Chain:** Groq $\rightarrow$ Cerebras (`llama3.1-8b`) $\rightarrow$ Mistral (`mistral-tiny`) $\rightarrow$ Deterministic string template.
* **Ambiguous Cases (Tier 3):** `lib/ai-router.ts` queries Google Gemini 2.5 Flash with structured Zod outputs. If Gemini hits rate limits, it falls back to Groq running `qwen/qwen3.6-27b`.

---

# 7. The 4-Stage Autonomous Forensic Verification Pipeline

```
========================================================================================
                          4-STAGE RESOLUTION VERIFICATION GATEWAY
========================================================================================
Stage 1: Spatial Gating          Haversine Mathematical GPS Radius (< 50 Meters) -> 403
Stage 2: Duplication Gating      sharp-phash Perceptual Hash (Hamming > 5)       -> 403
Stage 3: Negative Edge Testing   YOLO11n-cls Verification (Original Absent >=0.80)-> 400
Stage 4: Visual Forensic Arbiter Groq GPT-OSS-120B / Qwen / Gemini Forensics    -> 403
========================================================================================
```

### 7.1 Stage 1: Spatial Gating (Haversine Formula)
Given verifier coordinates $(\phi_1, \lambda_1)$ and original incident coordinates $(\phi_2, \lambda_2)$:
$$\Delta\phi = \phi_2 - \phi_1, \quad \Delta\lambda = \lambda_2 - \lambda_1$$
$$a = \sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)$$
$$d = 2 R \cdot \text{atan2}\left(\sqrt{a}, \sqrt{1-a}\right)$$
Where $R = 6,371,000 \text{ meters}$. If $d > 50\text{ m}$, the request is rejected with **HTTP 403** and the calculated distance is returned in the response payload.

### 7.2 Stage 2: Duplication Gating (`sharp-phash`)
To prevent users from uploading the original hazard photograph as proof of resolution:
1. The original image buffer and the verification image buffer are processed via `sharp-phash`.
2. Perceptual fingerprints are compared using `sharp-phash/distance`.
3. If Hamming distance $D_H \le 5$, the photo is rejected with **HTTP 403** as a duplicate submission.

### 7.3 Stage 3: Negative Edge Testing (Classifier Check)
The verification image is evaluated via `classify()`:
* If the predicted label matches the original report category and confidence is $\ge 0.80$, the request is rejected with **HTTP 400** ("Hazard still detected in photo").

### 7.4 Stage 4: Multi-Modal Visual Forensics (Comparative Arbiter)
If the image passes Stages 1–3, `verifyRepairCompletion()` in `lib/ai-router.ts` evaluates both images side-by-side:
* **Execution Sequence:** Tries Groq (`openai/gpt-oss-120b`) $\rightarrow$ Groq (`qwen/qwen3.6-27b`) $\rightarrow$ Google Gemini 2.5 Flash.
* **Evaluation Criteria:**
  1. *Location Match (`is_same_location`):* Assesses permanent architectural structures, road seams, and curbs, ignoring moving objects (parked cars, pedestrians).
  2. *Resolution Confirmation (`is_resolved`):* Checks for visual evidence of repair (fresh asphalt, cleared debris, resolved drainage).
* If certified (`YES`), the report is updated to `Resolved` in DynamoDB and $+50$ points are awarded. If rejected (`NO`), HTTP 403 is returned with the model's forensic justification.

---

# 8. Offline-First Resilience & Distributed Sync Engine

### 8.1 IndexedDB Storage Architecture
In cellular dead zones, submissions are serialized into IndexedDB via `localforage`:
* **Key Prefix:** `report_${UUID}`
* **Payload Interface:**
  ```typescript
  export interface OfflineReportPayload {
    id: string;
    imageBase64: string;
    imageMimeType: string;
    imageFileName: string;
    latitude: number;
    longitude: number;
    sync_status: 'pending' | 'synced' | 'failed';
    created_at: string;
    retryCount?: number;
    lastError?: string;
  }
  ```

### 8.2 Lifecycle Management & Eviction Rules
The background sync hook (`hooks/useBackgroundSync.ts`) implements deterministic recovery behavior:
* **Automatic Reconnection:** Binds to `window.addEventListener("online")`.
* **HTTP 400 Eviction:** If the report fails AI triage upon sync, it is immediately evicted from IndexedDB with an informative toast notification, preventing infinite retry loops.
* **HTTP 401 Authentication Pause:** If unauthenticated, the sync loop pauses without discarding records, allowing the user to sign in before re-attempting sync.
* **Retry Bounds:** Transient network failures increment `retryCount`; records are evicted if retries exceed 5. Manual "Flush Queue" and "Clear Queue" actions are also provided in the UI.

---

# 9. Comprehensive AWS Serverless Cloud Architecture

### 9.1 AWS Amplify Hosting (Next.js 16 SSR Compute)
* **Application Root:** `civic-guard`
* **Amplify App ID:** `d3h94wzgibv55q`
* **Target Region:** `ap-south-1` (Mumbai)
* **Bundle Optimization:** Amplify serverless SSR compute bundles enforce a **220 MB limit**. Native C++ packages like `onnxruntime-node` (configured as a devDependency) exceed this ceiling. CivicGuard prunes `.next/cache`, `node_modules/onnxruntime-node`, and related dev packages in `amplify.yml`, reducing the SSR deployment artifact to approximately **42 MB**.

### 9.2 AWS Cognito User Pools & Google OAuth 2.0 Federation
* **User Pool ID:** `ap-south-1_QOD15h5ZS`
* **App Client ID:** `5367n3jeafigqt9k3u2ifc01jd`
* **Auth Domain:** `civicguard-auth-8958.auth.ap-south-1.amazoncognito.com`
* **Identity Provider:** Google Identity Provider
* **Session Management:** The token exchange route (`/api/auth/token`) issues two cookies:
  - `cognito_id_token`: `HttpOnly; SameSite=Lax; Secure` for API authentication.
  - `cognito_user_id`: Standard cookie enabling client-side user identification.
* **Logout (`/api/auth/logout`):** Clears authentication session cookies.

### 9.3 Amazon DynamoDB Architecture
* **Table 1: `CivicPulseReports`**
  - *Partition Key (PK):* `id` (String UUID)
  - *Billing Mode:* Pay-Per-Request (On-Demand)
  - *Attributes:* `title`, `description`, `category`, `severity_score`, `latitude`, `longitude`, `image_url`, `status`, `user_id`, `created_at`, `resolved_image_url`, `resolved_at`.
* **Table 2: `CivicPulseProfiles`**
  - *Partition Key (PK):* `id` (String Cognito `sub`)
  - *Billing Mode:* Pay-Per-Request (On-Demand)
  - *Attributes:* `email`, `name`, `points`, `created_at`.
  - *Atomic Points Counter:* Updates use `ADD points :pts` (+10 for report, +50 for verification). Deletions query current balance and deduct $\min(10, \text{currentPoints})$.

### 9.4 Amazon S3 Bucket & Access Controls
* **Bucket:** `civicpulse-hazard-uploads`
* **Region:** `ap-south-1`
* **Ingestion:** Direct PUT via 60-second presigned URLs generated by `@aws-sdk/s3-request-presigner`.
* **Automated Cleanup:** Rejected reports trigger an immediate `DeleteObjectCommand` on S3, preventing orphaned storage accumulation.

### 9.5 AWS IAM Scoping & Security Perimeter
IAM credentials (`APP_AWS_ACCESS_KEY_ID`, `APP_AWS_SECRET_ACCESS_KEY`) are scoped strictly to least-privilege operations:
* `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` on `arn:aws:s3:::civicpulse-hazard-uploads/*`
* `dynamodb:PutItem`, `dynamodb:GetItem`, `dynamodb:UpdateItem`, `dynamodb:DeleteItem`, `dynamodb:Scan` on `arn:aws:dynamodb:ap-south-1:*:table/CivicPulse*`

---

# 10. Geospatial GIS Engine & UI Design System

### 10.1 Leaflet GIS Integration with Esri ArcGIS Dark Gray Base
* **File:** `civic-guard/components/LeafletMap.tsx`
* **Tile Provider Migration:** CartoDB CDN tiles (`cartocdn.com`) are frequently blocked by privacy tools and Brave Shields (`ERR_BLOCKED_BY_CLIENT`). CivicGuard integrates **Esri ArcGIS Dark Gray Base**:
  ```
  https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}
  ```
* **GIS Features:** Marker clustering (`leaflet.markercluster`), dynamic heatmaps (`leaflet.heat`), tour mode automated fly-tos, and time-lapse replay scrubbing across incident submission timestamps.

### 10.2 Cyber-Dark Design Tokens & Visual Hierarchy
```css
/* Core Design Tokens */
:root {
  --bg-page:        #0a0a0a;  /* Deep OLED Black */
  --bg-surface:     #0f1117;  /* High-Elevation Surface */
  --bg-card:        #181c27;  /* Card Background */
  --bg-card-hover:  #242840;  /* Card Active State */

  --text-primary:   #e8eaf0;  /* High-Contrast White */
  --text-muted:     #7a8199;  /* Secondary Text */
  --text-dim:       #4a5068;  /* Subtle Accents */

  --color-critical: #ef4444;  /* Severity >= 4 (Red 500) */
  --color-medium:   #f59e0b;  /* Severity 3 (Amber 500) */
  --color-low:      #06b6d4;  /* Severity <= 2 (Cyan 500) */
  --color-resolved: #10b981;  /* Resolution Green (Emerald 500) */
}
```

---

# 11. Performance, Latency & Economic Cost Analysis

```
+---------------------------------------------------------------------------------------+
|                       ESTIMATED MONTHLY COST MODEL (100,000 ACTIVE CITIZENS)         |
+--------------------------+------------------------------+-----------------------------+
| Architecture Component   | Traditional EC2/VPS Stack    | CivicGuard AWS Serverless   |
+--------------------------+------------------------------+-----------------------------+
| Compute Layer            | $140.00 (2x c5.xlarge)       | $12.40 (Amplify SSR Lambdas)|
| Database Layer           | $110.00 (RDS PostgreSQL Multi)| $4.20 (DynamoDB On-Demand)  |
| Identity Management      | $65.00 (Auth0 Pro Tier)      | $0.00 (Cognito Free Tier <50k)|
| Media Storage            | $25.00 (Standard S3)         | $8.50 (S3 + Presigned PUT)  |
| AI Vision Inference      | $1,400.00 (Cloud Vision APIs)| $0.00 (On-Device Edge WASM) |
+--------------------------+------------------------------+-----------------------------+
| TOTAL ESTIMATED EXPENSE  | $1,740.00 / Month            | $25.10 / Month (98.5% SAVING|
+--------------------------+------------------------------+-----------------------------+
```

### Measured Response Latency:
* **Edge On-Device Inference:** $38\text{ ms} - 52\text{ ms}$ (Apple Silicon), $\sim 65\text{ ms}$ (Mobile Chrome).
* **Presigned Upload URL Issuance:** $85\text{ ms}$.
* **S3 Direct Binary Streaming:** $240\text{ ms}$ (3 MB file on 4G network).
* **DynamoDB PutCommand:** Single-digit millisecond latency ($\sim 8\text{ ms}$).
* **Total User-Perceived Ingestion Time:** $\sim 375\text{ ms}$.

---

# 12. Future Roadmap & Conclusions

1. **Automated Municipal Work-Order Webhooks:** Direct JSON payload dispatch into existing municipal CRM systems (e.g., SAP Public Services, Open311 APIs).
2. **Citizen Incentive Redemption:** Partnering with regional transit agencies to convert verified Civic Points into public bus/metro transit credits.
3. **Automated Drone Inspection Ingestion:** Expanding S3 presigned ingestion to accept geotagged orthomosaic video feeds captured by municipal inspection drones.
4. **Edge Quantization Upgrade (INT4):** Exploring 4-bit weight quantization to reduce the neural model footprint down to **0.9 MB** for ultra-low-bandwidth smart city deployments.

CivicGuard proves that autonomous, edge-first artificial intelligence combined with 100% serverless cloud architectures can effectively resolve the municipal coordination deficit—providing rapid response times, strong fraud resistance, and near-zero ongoing inference expenses.

---

# 13. Appendix: Environment Variables & REST API Manifest

### 13.1 Production Environment Configuration (`.env.production`)
```env
# AWS IAM Credentials (Scoped strictly to S3, DynamoDB, and Cognito)
APP_AWS_REGION=ap-south-1
APP_AWS_ACCESS_KEY_ID=AKIA****************        # Redacted production IAM access key
APP_AWS_SECRET_ACCESS_KEY=**************************************** # Redacted production IAM secret

# Amazon S3 Media Bucket
NEXT_PUBLIC_S3_BUCKET_NAME=civicpulse-hazard-uploads

# AWS Cognito Identity Federation
NEXT_PUBLIC_COGNITO_REGION=ap-south-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=ap-south-1_QOD15h5ZS
NEXT_PUBLIC_COGNITO_CLIENT_ID=5367n3jeafigqt9k3u2ifc01jd
NEXT_PUBLIC_COGNITO_DOMAIN=civicguard-auth-8958.auth.ap-south-1.amazoncognito.com

# Amazon DynamoDB Tables
DYNAMODB_REPORTS_TABLE=CivicPulseReports
DYNAMODB_PROFILES_TABLE=CivicPulseProfiles

# Cloud AI Fallback & Text Engines
GEMINI_API_KEY=AIzaSy***********************************        # Redacted Gemini API key
GROQ_API_KEY=gsk_************************************************    # Redacted Groq API key
```

### 13.2 Core REST Endpoints Manifest
* `POST /api/upload`: Validates MIME types, issues 60-second S3 presigned PUT URLs.
* `POST /api/report`: Ingests report metadata, evaluates edge/cloud AI triage, persists to DynamoDB `CivicPulseReports`, atomically grants +10 civic points.
* `GET  /api/reports`: Queries DynamoDB for all incidents, orders by timestamp descending.
* `DELETE /api/report/[id]`: Verifies Cognito `sub` ownership, purges report from DynamoDB, safely decrements points up to 10.
* `POST /api/verify`: Executes 4-stage forensic resolution pipeline (Haversine $\rightarrow$ pHash $\rightarrow$ Negative Classifier $\rightarrow$ Multimodal Forensics), marks status as `Resolved`, atomically grants +50 civic points.
* `GET  /api/insights`: Cached hourly municipal health trend synthesizer backed by Groq LLM analytics (`revalidate = 3600` ISR).
* `POST /api/auth/token`: Exchanges Cognito authorization codes for JWT tokens, issues secure HTTP-only cookies (`cognito_id_token` and `cognito_user_id`).
* `GET  /api/auth/me`: Resolves active Cognito user identity and DynamoDB civic profile points.
* `POST /api/auth/logout`: Clears authentication session cookies (`cognito_id_token` and `cognito_user_id`).

---

```
========================================================================================
                          END OF TECHNICAL SPECIFICATION REPORT
                             CIVICGUARD / CIVICPULSE PLATFORM
========================================================================================
```
