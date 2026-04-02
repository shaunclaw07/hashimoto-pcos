// Phase 2 — noch nicht implementiert.
export interface ImageAnalysisResult {
  detectedIngredients: string[];
  estimatedAdditives: string[];
  summary: string;
}

export interface IAIAnalysisService {
  analyzeImage(imageBase64: string): Promise<ImageAnalysisResult>;
}
