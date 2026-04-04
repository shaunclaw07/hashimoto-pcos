// src/infrastructure/storage/local-storage-favorites.ts
import type {
  IFavoritesRepository,
  SavedProduct,
} from "../../core/ports/favorites-repository";

const STORAGE_KEY = "hashimoto-pcos-saved-products";

export class LocalStorageFavoritesRepository implements IFavoritesRepository {
  private read(): Record<string, SavedProduct> {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch (error) {
      console.error("Failed to parse favorites from localStorage:", error);
      return {};
    }
  }

  private write(data: Record<string, SavedProduct>): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  getAll(): SavedProduct[] {
    return Object.values(this.read());
  }

  save(barcode: string, entry: SavedProduct): void {
    const data = this.read();
    data[barcode] = entry;
    this.write(data);
  }

  remove(barcode: string): void {
    const data = this.read();
    delete data[barcode];
    this.write(data);
  }

  isSaved(barcode: string): boolean {
    return barcode in this.read();
  }
}
