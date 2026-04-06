// src/infrastructure/container.ts
import { SqliteProductRepository } from "./sqlite/sqlite-product-repository";
import { OffApiAdapter } from "./openfoodfacts/off-api-adapter";
import { LocalStorageFavoritesRepository } from "./storage/local-storage-favorites";
import type { IProductRepository } from "../core/ports/product-repository";
import type { IFavoritesRepository } from "../core/ports/favorites-repository";

export function makePrimaryProductRepository(): IProductRepository {
  return new SqliteProductRepository();
}

export function makeFallbackProductRepository(): IProductRepository {
  return new OffApiAdapter();
}

/** Use on the client side only (requires window/localStorage). */
export function makeFavoritesRepository(): IFavoritesRepository {
  return new LocalStorageFavoritesRepository();
}
