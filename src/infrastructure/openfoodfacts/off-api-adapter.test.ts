// src/infrastructure/openfoodfacts/off-api-adapter.test.ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { OffApiAdapter } from "./off-api-adapter";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("OffApiAdapter.findByBarcode", () => {
  it("gibt Product zurück bei erfolgreichem API-Call", async () => {
    const mockResponse = {
      status: 1,
      product: {
        product_name: "Testprodukt",
        brands: "Testmarke",
        nutriments: { sugars_100g: 5.0, fiber_100g: 3.0, proteins_100g: 8.0 },
      },
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const adapter = new OffApiAdapter();
    const product = await adapter.findByBarcode("5000159484695");

    expect(product).not.toBeNull();
    expect(product?.name).toBe("Testprodukt");
    expect(product?.brand).toBe("Testmarke");
    expect(product?.nutriments.sugars).toBe(5.0);
    expect(product?.nutriments.fiber).toBe(3.0);
  });

  it("gibt null zurück wenn status 0 (nicht gefunden)", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 0, status_verbose: "product not found" }),
    } as Response);

    const adapter = new OffApiAdapter();
    const product = await adapter.findByBarcode("0000000000001");

    expect(product).toBeNull();
  });

  it("gibt null zurück bei Netzwerkfehler", async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error("Network error"));

    const adapter = new OffApiAdapter();
    const product = await adapter.findByBarcode("5000159484695");

    expect(product).toBeNull();
  });

  it("gibt null zurück bei HTTP-Fehler (non-ok response)", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    const adapter = new OffApiAdapter();
    const product = await adapter.findByBarcode("5000159484695");

    expect(product).toBeNull();
  });
});

describe("OffApiAdapter: mappers", () => {
  it("mappt image_front_url vor image_url", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 1,
        product: {
          product_name: "Test",
          image_url: "http://old.jpg",
          image_front_url: "http://new.jpg",
        },
      }),
    } as Response);

    const adapter = new OffApiAdapter();
    const product = await adapter.findByBarcode("5000159484695");
    expect(product?.imageUrl).toBe("http://new.jpg");
  });

  it("mappt labels string zu Array", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 1,
        product: { product_name: "Test", labels: "organic, gluten-free" },
      }),
    } as Response);

    const adapter = new OffApiAdapter();
    const product = await adapter.findByBarcode("5000159484695");
    expect(product?.labels).toEqual(["organic", "gluten-free"]);
  });
});
