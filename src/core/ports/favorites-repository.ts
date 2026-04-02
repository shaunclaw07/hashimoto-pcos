import type { Product } from "../domain/product";
import type { ScoreResult } from "../domain/score";

export interface SavedProduct {
  product: Product;
  score: ScoreResult;
  savedAt: number;
}

export interface IFavoritesRepository {
  getAll(): SavedProduct[];
  save(barcode: string, entry: SavedProduct): void;
  remove(barcode: string): void;
  isSaved(barcode: string): boolean;
}
