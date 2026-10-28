"use client";

export const CLASSES = [
  "garbage_dump",
  "not_a_hazard",
  "pothole",
  "waterlogging",
] as const;

export type ClassName = (typeof CLASSES)[number];

export interface ClientClassificationResult {
  label: ClassName;
  humanLabel: string;
  confidence: number;
  probs: Record<ClassName, number>;
  action: "accept" | "reject" | "escalate";
  severity: number;
}

const REJECT_THRESHOLD = 0.90;
const ACCEPT_THRESHOLD = 0.70;

let sessionPromise: Promise<any> | null = null;

async function getInferenceSession() {
  if (typeof window === "undefined") return null;

  if (!sessionPromise) {
    sessionPromise = (async () => {
      const ort = await import("onnxruntime-web");
      
      // Configure CDN WASM paths so large binaries aren't bundled into Next.js SSR
      ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.31.1/dist/";
      ort.env.wasm.numThreads = 1;

      // Model is statically served from /models/civic_int8.onnx
      const session = await ort.InferenceSession.create("/models/civic_int8.onnx", {
        executionProviders: ["wasm"],
        graphOptimizationLevel: "all",
      });

      return { ort, session };
    })();
  }

  return sessionPromise;
}

/**
 * Preprocesses an image from URL or File into CHW Float32Array [1, 3, 224, 224] normalized to [0, 1]
 */
async function preprocessImage(imageSrc: string): Promise<Float32Array> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 224;
        canvas.height = 224;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) throw new Error("Could not create 2D canvas context");

        // Stretch / fit fill to 224x224 (matches training preprocessing)
        ctx.drawImage(img, 0, 0, 224, 224);

        const imgData = ctx.getImageData(0, 0, 224, 224);
        const { data } = imgData; // RGBA uint8

        // Convert HWC RGBA -> CHW RGB Float32 normalized [0, 1]
        const float32Data = new Float32Array(3 * 224 * 224);
        const planeSize = 224 * 224;

        for (let h = 0; h < 224; h++) {
          for (let w = 0; w < 224; w++) {
            const pixelIndex = (h * 224 + w) * 4;
            const r = data[pixelIndex] / 255.0;
            const g = data[pixelIndex + 1] / 255.0;
            const b = data[pixelIndex + 2] / 255.0;

            const offset = h * 224 + w;
            float32Data[0 * planeSize + offset] = r;
            float32Data[1 * planeSize + offset] = g;
            float32Data[2 * planeSize + offset] = b;
          }
        }

        resolve(float32Data);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error("Failed to load image for ONNX preprocessing"));
    img.src = imageSrc;
  });
}

/**
 * Runs browser-side inference on civic_int8.onnx using onnxruntime-web
 */
export async function classifyImageInBrowser(
  imageSrc: string
): Promise<ClientClassificationResult | null> {
  try {
    const initialized = await getInferenceSession();
    if (!initialized) return null;
    const { ort, session } = initialized;

    const float32Data = await preprocessImage(imageSrc);
    const inputTensor = new ort.Tensor("float32", float32Data, [1, 3, 224, 224]);

    const feeds: Record<string, any> = {};
    feeds[session.inputNames[0]] = inputTensor;

    const results = await session.run(feeds);
    const outputTensor = results[session.outputNames[0]];
    const outputData = outputTensor.data as Float32Array;

    const probs = {} as Record<ClassName, number>;
    let maxConfidence = -1;
    let bestLabel: ClassName = CLASSES[0];

    for (let i = 0; i < CLASSES.length; i++) {
      const prob = outputData[i];
      probs[CLASSES[i]] = prob;
      if (prob > maxConfidence) {
        maxConfidence = prob;
        bestLabel = CLASSES[i];
      }
    }

    let action: "accept" | "reject" | "escalate" = "escalate";
    let severity = 3;

    if (bestLabel === "not_a_hazard" && maxConfidence >= REJECT_THRESHOLD) {
      action = "reject";
    } else if (bestLabel !== "not_a_hazard" && maxConfidence >= ACCEPT_THRESHOLD) {
      action = "accept";
      if (bestLabel === "garbage_dump") severity = 2;
      if (maxConfidence > 0.85) severity += 1;
      severity = Math.max(1, Math.min(5, severity));
    }

    const humanLabel = bestLabel.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    return {
      label: bestLabel,
      humanLabel,
      confidence: maxConfidence,
      probs,
      action,
      severity,
    };
  } catch (err) {
    console.warn("[ONNX Web Classifier] Browser inference failed (will use cloud fallback):", err);
    return null;
  }
}

