import type { IFavoritesRepository, SavedProduct } from "../ports/favorites-repository";
import type { Product } from "../domain/product";
import type { ScoreResult } from "../domain/score";

export class ManageFavoritesUseCase {
  constructor(private readonly repo: IFavoritesRepository) {}

  save(barcode: string, product: Product, score: ScoreResult): void {
    this.repo.save(barcode, { product, score, savedAt: Date.now() });
  }

  remove(barcode: string): void {
    this.repo.remove(barcode);
  }

  getAll(): SavedProduct[] {
    return this.repo.getAll();
  }

  isSaved(barcode: string): boolean {
    return this.repo.isSaved(barcode);
  }
}
