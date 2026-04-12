import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import type { SavedProduct } from "@/core/ports/favorites-repository";
import type { Product } from "@/core/domain/product";
import type { ScoreResult } from "@/core/domain/score";

const SAVED_PRODUCTS_KEY = "hashimoto-pcos-saved-products";

const mockProduct: Product = {
  barcode: "1234567890123",
  name: "Test Produkt",
  brand: "Test Marke",
  imageUrl: "https://example.com/image.jpg",
  nutriments: {
    energyKcal: 100,
    fat: 5,
    saturatedFat: 2,
    sugars: 10,
    fiber: 3,
    protein: 8,
    salt: 0.5,
  },
  labels: [],
  ingredients: "Zutatenliste",
  ingredientsList: ["Zutat 1", "Zutat 2"],
  categories: [],
  additives: [],
};

const mockScore: ScoreResult = {
  score: 4.2,
  stars: 5,
  label: "GUT",
  breakdown: [],
  bonuses: 1.2,
  maluses: 0,
};

const mockSavedProduct: SavedProduct = {
  product: mockProduct,
  score: mockScore,
  savedAt: Date.now(),
};

const containers: HTMLDivElement[] = [];

function render(component: React.ReactElement): HTMLElement {
  const container = document.createElement("div");
  document.body.appendChild(container);
  containers.push(container);
  const root = createRoot(container);

  act(() => {
    root.render(component);
  });

  return container;
}

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

// Mock useUserProfile
vi.mock("@/hooks/use-user-profile", () => ({
  useUserProfile: () => ({
    profile: null,
    isLoaded: true,
  }),
}));

// Mock haptic service
vi.mock("@/core/services/haptic-service", () => ({
  triggerHaptic: vi.fn(),
}));

describe("SavedProductsPage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    containers.forEach((container) => {
      if (container.parentNode) {
        document.body.removeChild(container);
      }
    });
    containers.length = 0;
    vi.clearAllMocks();
  });

  it("rendert ohne Fehler (smoke test)", async () => {
    const SavedProductsPage = (await import("./page")).default;
    const container = render(createElement(SavedProductsPage));
    expect(container).toBeTruthy();
  });

  it("zeigt Empty State wenn keine Produkte gespeichert sind", async () => {
    const SavedProductsPage = (await import("./page")).default;
    const container = render(createElement(SavedProductsPage));

    // Wait for client-side hydration
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    expect(container.textContent).toContain("Noch keine Produkte gespeichert");
    expect(container.textContent).toContain("Jetzt scannen");
    expect(container.textContent).toContain("Produkte suchen");
  });

  it("zeigt gespeicherte Produkte an", async () => {
    localStorage.setItem(
      SAVED_PRODUCTS_KEY,
      JSON.stringify({
        "1234567890123": mockSavedProduct,
      })
    );

    const SavedProductsPage = (await import("./page")).default;
    const container = render(createElement(SavedProductsPage));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    expect(container.textContent).toContain("Test Produkt");
    expect(container.textContent).toContain("Test Marke");
    expect(container.textContent).toContain("GUT");
  });

  it("zeigt korrekten Link zur Detailseite", async () => {
    localStorage.setItem(
      SAVED_PRODUCTS_KEY,
      JSON.stringify({
        "1234567890123": mockSavedProduct,
      })
    );

    const SavedProductsPage = (await import("./page")).default;
    const container = render(createElement(SavedProductsPage));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    const link = container.querySelector('a[href="/result/1234567890123"]');
    expect(link).toBeTruthy();
  });

  it("hat funktionierenden Entfernen-Button", async () => {
    localStorage.setItem(
      SAVED_PRODUCTS_KEY,
      JSON.stringify({
        "1234567890123": mockSavedProduct,
      })
    );

    const SavedProductsPage = (await import("./page")).default;
    const container = render(createElement(SavedProductsPage));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    // Check remove button exists
    const removeButton = container.querySelector('button[aria-label*="entfernen" i]');
    expect(removeButton).toBeTruthy();
  });
});

describe("ManageFavoritesUseCase mit LocalStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("speichert und lädt Produkte korrekt", async () => {
    const { LocalStorageFavoritesRepository } = await import(
      "@/infrastructure/storage/local-storage-favorites"
    );
    const { ManageFavoritesUseCase } = await import("@/core/use-cases/manage-favorites");

    const repo = new LocalStorageFavoritesRepository();
    const useCase = new ManageFavoritesUseCase(repo);

    useCase.save("123", mockProduct, mockScore);

    const all = useCase.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].product.name).toBe("Test Produkt");
    expect(all[0].score.label).toBe("GUT");
  });

  it("entfernt gespeicherte Produkte", async () => {
    const { LocalStorageFavoritesRepository } = await import(
      "@/infrastructure/storage/local-storage-favorites"
    );
    const { ManageFavoritesUseCase } = await import("@/core/use-cases/manage-favorites");

    const repo = new LocalStorageFavoritesRepository();
    const useCase = new ManageFavoritesUseCase(repo);

    useCase.save("123", mockProduct, mockScore);
    expect(useCase.getAll()).toHaveLength(1);

    useCase.remove("123");
    expect(useCase.getAll()).toHaveLength(0);
  });

  it("prüft ob Produkt gespeichert ist", async () => {
    const { LocalStorageFavoritesRepository } = await import(
      "@/infrastructure/storage/local-storage-favorites"
    );
    const { ManageFavoritesUseCase } = await import("@/core/use-cases/manage-favorites");

    const repo = new LocalStorageFavoritesRepository();
    const useCase = new ManageFavoritesUseCase(repo);

    expect(useCase.isSaved("123")).toBe(false);
    useCase.save("123", mockProduct, mockScore);
    expect(useCase.isSaved("123")).toBe(true);
  });
});
