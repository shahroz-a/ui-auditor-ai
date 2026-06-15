import type { VisualMetrics } from "@/types/audit";

const SAMPLE_LIMIT = 180;
const EDGE_THRESHOLD = 28;
const GRID_SIZE = 8;

function loadBrowserImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image could not be decoded for local analysis."));
    image.src = src;
  });
}

function normalizedActivity(edgeCount: number, area: number): number {
  if (area <= 0) {
    return 0;
  }

  return Math.min(1, (edgeCount / area) * 8);
}

export async function analyzeScreenshotPixels(src: string): Promise<VisualMetrics> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("Pixel analysis is only available in the browser.");
  }

  const image = await loadBrowserImage(src);
  const scale = Math.min(1, SAMPLE_LIMIT / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    throw new Error("Canvas is unavailable in this browser.");
  }

  context.drawImage(image, 0, 0, width, height);
  const { data } = context.getImageData(0, 0, width, height);
  const luminance = new Float32Array(width * height);
  const colorBuckets = new Set<string>();

  let sum = 0;
  let sumSquares = 0;

  for (let index = 0; index < data.length; index += 4) {
    const alpha = (data[index + 3] ?? 255) / 255;
    const red = (data[index] ?? 255) * alpha + 255 * (1 - alpha);
    const green = (data[index + 1] ?? 255) * alpha + 255 * (1 - alpha);
    const blue = (data[index + 2] ?? 255) * alpha + 255 * (1 - alpha);
    const value = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    const pixelIndex = index / 4;

    luminance[pixelIndex] = value;
    sum += value;
    sumSquares += value * value;
    colorBuckets.add(`${Math.round(red / 32)}:${Math.round(green / 32)}:${Math.round(blue / 32)}`);
  }

  const pixelCount = width * height;
  const average = sum / pixelCount;
  const variance = Math.max(0, sumSquares / pixelCount - average * average);
  const contrastSpread = Math.min(1, Math.sqrt(variance) / 128);
  const cellEdges = Array.from({ length: GRID_SIZE * GRID_SIZE }, () => 0);
  const cellPixels = Array.from({ length: GRID_SIZE * GRID_SIZE }, () => 0);

  let totalEdges = 0;
  let borderEdges = 0;
  let borderPixels = 0;
  let leftEdges = 0;
  let rightEdges = 0;
  let topEdges = 0;
  let bottomEdges = 0;

  const borderX = Math.max(2, Math.round(width * 0.08));
  const borderY = Math.max(2, Math.round(height * 0.08));

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      const currentLuminance = luminance[index] ?? 0;
      const leftDiff = x > 0 ? Math.abs(currentLuminance - (luminance[index - 1] ?? currentLuminance)) : 0;
      const topDiff = y > 0 ? Math.abs(currentLuminance - (luminance[index - width] ?? currentLuminance)) : 0;
      const isEdge = leftDiff + topDiff > EDGE_THRESHOLD;
      const cellX = Math.min(GRID_SIZE - 1, Math.floor((x / width) * GRID_SIZE));
      const cellY = Math.min(GRID_SIZE - 1, Math.floor((y / height) * GRID_SIZE));
      const cellIndex = cellY * GRID_SIZE + cellX;

      cellPixels[cellIndex] = (cellPixels[cellIndex] ?? 0) + 1;

      if (isEdge) {
        totalEdges += 1;
        cellEdges[cellIndex] = (cellEdges[cellIndex] ?? 0) + 1;

        if (x < width / 2) {
          leftEdges += 1;
        } else {
          rightEdges += 1;
        }

        if (y < height / 2) {
          topEdges += 1;
        } else {
          bottomEdges += 1;
        }
      }

      if (x < borderX || x >= width - borderX || y < borderY || y >= height - borderY) {
        borderPixels += 1;
        if (isEdge) {
          borderEdges += 1;
        }
      }
    }
  }

  const busyCells = cellEdges.filter((edges, index) => normalizedActivity(edges, cellPixels[index] ?? 0) > 0.42).length;
  const cellActivity = cellEdges.map((edges, index) => Number(normalizedActivity(edges, cellPixels[index] ?? 0).toFixed(3)));
  const hotspots = cellActivity
    .map((activity, index) => {
      const cellX = index % GRID_SIZE;
      const cellY = Math.floor(index / GRID_SIZE);

      return {
        x: Number((cellX / GRID_SIZE).toFixed(3)),
        y: Number((cellY / GRID_SIZE).toFixed(3)),
        width: Number((1 / GRID_SIZE).toFixed(3)),
        height: Number((1 / GRID_SIZE).toFixed(3)),
        activity,
        label: `Attention cell ${cellX + 1},${cellY + 1}`
      };
    })
    .filter((cell) => cell.activity > 0.16)
    .sort((first, second) => second.activity - first.activity)
    .slice(0, 5);
  const edgeDensity = Math.min(1, totalEdges / pixelCount);
  const edgeCrowding = normalizedActivity(borderEdges, borderPixels);
  const leftActivity = normalizedActivity(leftEdges, Math.ceil(pixelCount / 2));
  const rightActivity = normalizedActivity(rightEdges, Math.floor(pixelCount / 2));
  const topActivity = normalizedActivity(topEdges, Math.ceil(pixelCount / 2));
  const bottomActivity = normalizedActivity(bottomEdges, Math.floor(pixelCount / 2));

  return {
    sampleWidth: width,
    sampleHeight: height,
    averageLuminance: Number((average / 255).toFixed(3)),
    contrastSpread: Number(contrastSpread.toFixed(3)),
    edgeDensity: Number(edgeDensity.toFixed(3)),
    busyRegionRatio: Number((busyCells / cellEdges.length).toFixed(3)),
    blankEdgeRatio: Number((1 - edgeCrowding).toFixed(3)),
    edgeCrowding: Number(edgeCrowding.toFixed(3)),
    horizontalBalance: Number((Math.abs(leftActivity - rightActivity) / Math.max(leftActivity, rightActivity, 0.01)).toFixed(3)),
    verticalBalance: Number((Math.abs(topActivity - bottomActivity) / Math.max(topActivity, bottomActivity, 0.01)).toFixed(3)),
    colorComplexity: Number((Math.min(colorBuckets.size, 96) / 96).toFixed(3)),
    leftActivity: Number(leftActivity.toFixed(3)),
    rightActivity: Number(rightActivity.toFixed(3)),
    topActivity: Number(topActivity.toFixed(3)),
    bottomActivity: Number(bottomActivity.toFixed(3)),
    hotspots
  };
}
