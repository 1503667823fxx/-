
import { GoogleGenAI, Modality } from "@google/genai";
import { EditMode } from "../types";

// Initialize the client securely using the environment variable
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Helper: Loads an image from a URL/Base64 string
 */
const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
        img.src = src;
    });
};

/**
 * Helper: Converts a canvas or part of it to a WebP base64 string.
 */
const canvasToBase64 = (canvas: HTMLCanvasElement, quality = 0.95): string => {
    return canvas.toDataURL('image/webp', quality).split(',')[1];
};

/**
 * Creates an Alpha Mask for blending tile edges.
 * Returns a canvas with a white center and fading black edges.
 */
const createBlendMask = (w: number, h: number, padding: number): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    // Clear
    ctx.clearRect(0,0,w,h);
    
    // Draw full white
    ctx.fillStyle = 'white';
    ctx.fillRect(0,0,w,h);
    
    // Cut out borders with gradient to transparent to create smooth overlap
    // We use destination-in which multiplies alpha.
    ctx.globalCompositeOperation = 'destination-in';
    
    // Create gradients for soft edges
    // Left
    const gLeft = ctx.createLinearGradient(0, 0, padding, 0);
    gLeft.addColorStop(0, 'rgba(0,0,0,0)');
    gLeft.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = gLeft;
    ctx.fillRect(0, 0, padding, h);
    
    // Right
    const gRight = ctx.createLinearGradient(w - padding, 0, w, 0);
    gRight.addColorStop(0, 'rgba(0,0,0,1)');
    gRight.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gRight;
    ctx.fillRect(w - padding, 0, padding, h);
    
    // Top
    const gTop = ctx.createLinearGradient(0, 0, 0, padding);
    gTop.addColorStop(0, 'rgba(0,0,0,0)');
    gTop.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = gTop;
    ctx.fillRect(0, 0, w, padding);
    
    // Bottom
    const gBottom = ctx.createLinearGradient(0, h - padding, 0, h);
    gBottom.addColorStop(0, 'rgba(0,0,0,1)');
    gBottom.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gBottom;
    ctx.fillRect(0, h - padding, w, padding);

    return canvas;
};

/**
 * Resize image to a specific max dimension (for context reference)
 */
const resizeForContext = (img: HTMLImageElement, maxDim: number): string => {
    let w = img.width;
    let h = img.height;
    if (w > maxDim || h > maxDim) {
        const ratio = Math.min(maxDim / w, maxDim / h);
        w = Math.floor(w * ratio);
        h = Math.floor(h * ratio);
    }
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(img, 0, 0, w, h);
    return canvasToBase64(canvas, 0.8);
};

/**
 * ROBUST 3x3 TILED UPSCALING WITH CONTEXT INJECTION
 * Strategy:
 * 1. Pass the FULL low-res image as a reference ("Context").
 * 2. Pass the 3x zoomed crop as the target ("Work").
 * 3. Ask AI to infer texture from Context and apply it to Work.
 */
const upscaleImageTiled = async (sourceImage: string): Promise<string> => {
    const rawImg = await loadImage(sourceImage);
    
    // 1. Prepare Context Image (The "Map")
    // We shrink the original slightly to save tokens but keep enough for structure context.
    const contextBase64 = resizeForContext(rawImg, 1024);

    // 2. Setup Dimensions (Clean 3x Scale)
    let w = rawImg.width;
    let h = rawImg.height;
    
    // Ensure divisible by 3 to avoid subpixel gaps
    const remW = w % 3;
    const remH = h % 3;
    if (remW !== 0) w -= remW;
    if (remH !== 0) h -= remH;

    const scaleFactor = 3;
    const targetW = w * scaleFactor;
    const targetH = h * scaleFactor;
    
    // 3. Create Base Canvas (Upscaled Source)
    const bigCanvas = document.createElement('canvas');
    bigCanvas.width = targetW;
    bigCanvas.height = targetH;
    const bCtx = bigCanvas.getContext('2d', { willReadFrequently: true });
    if (!bCtx) throw new Error("Canvas failed");
    
    // Draw original scaled up (Bilinear interpolation)
    bCtx.drawImage(rawImg, 0, 0, targetW, targetH);

    // 4. Define 3x3 Grid with HEAVY Overlap
    // Heavy overlap allows the mask to blend seamlessly without visible seams
    const cols = 3;
    const rows = 3;
    const tileW = targetW / cols; 
    const tileH = targetH / rows;
    const padding = 160; // Large padding for context overlap at edges

    const tiles = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            // Logical coordinates (where it goes in final image)
            const lx = c * tileW; 
            const ly = r * tileH; 
            
            // Crop coordinates (including padding)
            const cx = lx - padding;
            const cy = ly - padding;
            const cw = tileW + (padding * 2);
            const ch = tileH + (padding * 2);

            // Determine if it's the center tile (prioritize rendering order)
            const isCenter = (r === 1 && c === 1);

            tiles.push({ r, c, lx, ly, cx, cy, cw, ch, isCenter });
        }
    }

    // 5. Process Tiles with CONTEXT INJECTION
    const processedTiles = await Promise.all(tiles.map(async (tile) => {
        const tCanvas = document.createElement('canvas');
        tCanvas.width = tile.cw;
        tCanvas.height = tile.ch;
        const tCtx = tCanvas.getContext('2d', { willReadFrequently: true });
        if (!tCtx) throw new Error("Tile canvas failed");
        
        // Safe cropping calculations
        const sx = Math.max(0, tile.cx);
        const sy = Math.max(0, tile.cy);
        const sw = Math.min(targetW, tile.cx + tile.cw) - sx;
        const sh = Math.min(targetH, tile.cy + tile.ch) - sy;
        const dx = sx - tile.cx; 
        const dy = sy - tile.cy;
        
        // Draw the section from the scaled-up base
        tCtx.drawImage(bigCanvas, sx, sy, sw, sh, dx, dy, sw, sh);
        
        const cropBase64 = canvasToBase64(tCanvas);
        
        // MAGIC PROMPT: Context + Restoration
        const prompt = `Task: Professional Image Restoration & Texture Synthesis.
Role: You are an advanced AI Upscaler.
Input 1 (Context): The full original image (Low Res). Use this to understand the subject (e.g., person, landscape) and lighting.
Input 2 (Target): A 3x zoomed crop of the image.
Instruction:
1. Identify the material in the Target Crop based on the Context (e.g., if Context shows a face, this crop is skin).
2. Hallucinate realistic, high-frequency 4K details (skin pores, fabric weave, hair strands, metal grain) into the Target Crop.
3. Eliminate all compression artifacts and blur.
4. STRICTLY maintain the original geometry, color palette, and lighting.
5. Output ONLY the restored Target Crop.`;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: {
                    parts: [
                        { text: prompt },
                        // VITAL: Send Context First, then Target
                        { inlineData: { mimeType: 'image/webp', data: contextBase64 } },
                        { inlineData: { mimeType: 'image/webp', data: cropBase64 } }
                    ],
                },
                config: { 
                    responseModalities: [Modality.IMAGE], 
                    temperature: 0.3 // Lower temperature for fidelity, let the Context drive the creativity
                },
            });

            const part = response.candidates?.[0]?.content?.parts?.[0];
            if (part?.inlineData?.data) {
                return { ...tile, resultBytes: part.inlineData.data, success: true };
            }
            throw new Error("No data");
        } catch (e) {
            console.error("Tile failed", e);
            return { ...tile, resultBytes: cropBase64, success: false };
        }
    }));

    // 6. Stitching (Compositing)
    const detailCanvas = document.createElement('canvas');
    detailCanvas.width = targetW;
    detailCanvas.height = targetH;
    const dCtx = detailCanvas.getContext('2d');
    if (!dCtx) throw new Error("Detail canvas failed");

    // Fill with base (fallback)
    dCtx.drawImage(bigCanvas, 0, 0);

    // Sort: Render perimeter first, then center (or vice versa depending on mask).
    // Center Last is usually safer for the "hero" element to sit on top.
    processedTiles.sort((a, b) => {
        if (a.isCenter && !b.isCenter) return 1;
        if (!a.isCenter && b.isCenter) return -1;
        return 0;
    });

    for (const tile of processedTiles) {
        if (!tile.success || !tile.resultBytes) continue;
        const img = await loadImage(`data:image/png;base64,${tile.resultBytes}`);
        
        const tileCompCanvas = document.createElement('canvas');
        tileCompCanvas.width = tile.cw;
        tileCompCanvas.height = tile.ch;
        const tcCtx = tileCompCanvas.getContext('2d');
        if (!tcCtx) continue;

        tcCtx.drawImage(img, 0, 0, tile.cw, tile.ch);
        
        // Apply blend mask to edges of the tile
        const mask = createBlendMask(tile.cw, tile.ch, padding);
        tcCtx.globalCompositeOperation = 'destination-in';
        tcCtx.drawImage(mask, 0, 0);

        // Draw onto main canvas
        // We use source-over. Since edges are transparent, they will blend with neighbors.
        dCtx.globalCompositeOperation = 'source-over';
        dCtx.drawImage(tileCompCanvas, tile.cx, tile.cy);
    }

    return detailCanvas.toDataURL('image/png');
};

/**
 * Standard processing (Non-Tiled) for general editing
 */
const processImageStandard = async (imageUrl: string): Promise<string> => {
  const img = await loadImage(imageUrl);
  const canvas = document.createElement('canvas');
  
  const MAX_DIM = 2048;
  let w = img.width;
  let h = img.height;
  
  if (w > MAX_DIM || h > MAX_DIM) {
      const r = Math.min(MAX_DIM / w, MAX_DIM / h);
      w *= r;
      h *= r;
  }
  
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx?.drawImage(img, 0, 0, w, h);
  
  return canvasToBase64(canvas, 0.85);
};

/**
 * Main Entry Point
 */
export const editImage = async (
  base64Image: string,
  prompt: string,
  mode: EditMode = 'general',
  referenceImage?: string | null
): Promise<string> => {
  try {
    
    if (mode === 'upscale') {
        return await upscaleImageTiled(base64Image);
    }

    const cleanSource = await processImageStandard(base64Image);
    
    const parts: any[] = [];
    let finalPrompt = prompt;

    if (mode === 'inpainting' && referenceImage) {
      finalPrompt = `Task: Inpainting.
Input 1: Source.
Input 2: Mask (White=Edit).
Instruction: Modify ONLY the white areas: "${prompt}". Keep black areas pixel-perfect.`;
    } else if (mode === 'pose' && referenceImage) {
       finalPrompt = `Task: Pose Transfer.
Input 1: Character.
Input 2: Pose Skeleton.
Instruction: Render the character from Input 1 in the pose of Input 2. Style: "${prompt}".`;
    } else {
      finalPrompt = `Edit instruction: ${prompt}. Maintain photorealism.`;
    }

    parts.push({ text: finalPrompt });
    parts.push({ inlineData: { mimeType: 'image/webp', data: cleanSource } });

    if (referenceImage) {
      const cleanRef = await processImageStandard(referenceImage);
      parts.push({ inlineData: { mimeType: 'image/webp', data: cleanRef } });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: parts },
      config: { 
        responseModalities: [Modality.IMAGE],
        temperature: 0.3, 
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part?.inlineData?.data) {
      return `data:image/png;base64,${part.inlineData.data}`;
    } else {
      throw new Error("No image data returned.");
    }

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes('500') || error.message?.includes('XHR')) {
        throw new Error("Image too large. Try Upscale mode.");
    }
    throw new Error(error.message || "Failed to generate image");
  }
};
