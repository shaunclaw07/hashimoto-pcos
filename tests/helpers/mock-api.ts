import type { Page } from '@playwright/test';

export async function mockProductApi(
  page: Page,
  barcode: string,
  product: object
): Promise<void> {
  await page.route(`/api/products/${barcode}`, route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, product }),
    })
  );
}

export async function mockProductNotFound(
  page: Page,
  barcode: string
): Promise<void> {
  await page.route(`/api/products/${barcode}`, route =>
    route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({
        success: false,
        error: { type: 'not_found', message: 'Produkt nicht gefunden' },
      }),
    })
  );
}

export async function mockSearchApi(
  page: Page,
  products: object[]
): Promise<void> {
  await page.route('/api/products/search*', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ products, count: products.length, page: 1 }),
    })
  );
}
