
export type EditMode = 'general' | 'inpainting' | 'pose' | 'upscale';

export interface AppState {
  originalImage: string | null; // Base64 string
  generatedImage: string | null; // Base64 string
  maskImage: string | null; // Base64 string for inpainting
  poseImage: string | null; // Base64 string for pose reference
  mode: EditMode;
  prompt: string;
  isLoading: boolean;
  error: string | null;
}

export interface GenerateImageResponse {
  imageBytes: string;
  mimeType: string;
}
