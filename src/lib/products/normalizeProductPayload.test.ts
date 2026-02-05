/**
 * Tests for normalizeProductPayload utility
 * 
 * Run with: npx vitest run src/lib/products/normalizeProductPayload.test.ts
 * Or for watch mode: npx vitest src/lib/products/normalizeProductPayload.test.ts
 */

import { describe, it, expect } from 'vitest';
import {
  normalizeProductPayload,
  validateVariantPricing,
  getResolvedVariantPrice,
  getMinVariantPrice,
  FormVariant,
  ProductFormPayload,
} from './normalizeProductPayload';

describe('normalizeProductPayload', () => {
  describe('Simple Products', () => {
    it('should normalize simple product with merchantPrice', () => {
      const payload: ProductFormPayload = {
        name: 'Test Product',
        description: 'Test description',
        category: 'cat123',
        images: ['http://example.com/img.jpg'],
        merchantPrice: 100,
        nubianMarkup: 15,
        stock: 50,
      };

      const result = normalizeProductPayload(payload, 'simple');

      expect(result.name).toBe('Test Product');
      expect(result.merchantPrice).toBe(100);
      expect(result.price).toBe(100); // Legacy mirror
      expect(result.nubianMarkup).toBe(15);
      expect(result.stock).toBe(50);
      expect(result.variants).toBeUndefined();
    });

    it('should default nubianMarkup to 10 if not provided', () => {
      const payload: ProductFormPayload = {
        name: 'Test',
        description: 'Desc',
        category: 'cat',
        images: ['http://example.com/img.jpg'],
        merchantPrice: 50,
        stock: 10,
      };

      const result = normalizeProductPayload(payload, 'simple');

      expect(result.nubianMarkup).toBe(10);
    });
  });

  describe('Variant Products', () => {
    it('should use variant merchantPrice when provided', () => {
      const payload: ProductFormPayload = {
        name: 'Variant Product',
        description: 'Description',
        category: 'cat123',
        images: ['http://example.com/img.jpg'],
        attributes: [{ name: 'size', displayName: 'Size', type: 'select', options: ['S', 'M'] }],
        variants: [
          { sku: 'SKU-S', attributes: { size: 'S' }, merchantPrice: 100, stock: 10, isActive: true },
          { sku: 'SKU-M', attributes: { size: 'M' }, merchantPrice: 120, stock: 5, isActive: true },
        ],
      };

      const result = normalizeProductPayload(payload, 'with_variants');

      expect(result.variants).toHaveLength(2);
      expect(result.variants![0].merchantPrice).toBe(100);
      expect(result.variants![0].price).toBe(100); // Legacy mirror
      expect(result.variants![1].merchantPrice).toBe(120);
      expect(result.variants![1].price).toBe(120);
      // Product-level should be undefined
      expect(result.merchantPrice).toBeUndefined();
      expect(result.price).toBeUndefined();
    });

    it('should use defaultVariantMerchantPrice when variant price is empty', () => {
      const payload: ProductFormPayload = {
        name: 'Variant Product',
        description: 'Description',
        category: 'cat123',
        images: ['http://example.com/img.jpg'],
        defaultVariantMerchantPrice: 80,
        attributes: [{ name: 'size', displayName: 'Size', type: 'select', options: ['S', 'M'] }],
        variants: [
          { sku: 'SKU-S', attributes: { size: 'S' }, merchantPrice: undefined, stock: 10, isActive: true },
          { sku: 'SKU-M', attributes: { size: 'M' }, merchantPrice: "", stock: 5, isActive: true },
        ],
      };

      const result = normalizeProductPayload(payload, 'with_variants');

      expect(result.variants![0].merchantPrice).toBe(80);
      expect(result.variants![0].price).toBe(80);
      expect(result.variants![1].merchantPrice).toBe(80);
      expect(result.variants![1].price).toBe(80);
    });

    it('should use custom price over default when both exist', () => {
      const payload: ProductFormPayload = {
        name: 'Variant Product',
        description: 'Description',
        category: 'cat123',
        images: ['http://example.com/img.jpg'],
        defaultVariantMerchantPrice: 80,
        attributes: [{ name: 'size', displayName: 'Size' }],
        variants: [
          { sku: 'SKU-S', attributes: { size: 'S' }, merchantPrice: 100, stock: 10, isActive: true },
          { sku: 'SKU-M', attributes: { size: 'M' }, merchantPrice: undefined, stock: 5, isActive: true },
        ],
      };

      const result = normalizeProductPayload(payload, 'with_variants');

      expect(result.variants![0].merchantPrice).toBe(100); // Custom
      expect(result.variants![1].merchantPrice).toBe(80);  // Default
    });

    it('should default to 0 when no price and no default', () => {
      const payload: ProductFormPayload = {
        name: 'Variant Product',
        description: 'Description',
        category: 'cat123',
        images: ['http://example.com/img.jpg'],
        attributes: [{ name: 'size', displayName: 'Size' }],
        variants: [
          { sku: 'SKU-S', attributes: { size: 'S' }, merchantPrice: undefined, stock: 10, isActive: true },
        ],
      };

      const result = normalizeProductPayload(payload, 'with_variants');

      // Should default to 0 (validation should catch this before save)
      expect(result.variants![0].merchantPrice).toBe(0);
      expect(result.variants![0].price).toBe(0);
    });
  });
});

describe('validateVariantPricing', () => {
  it('should pass when all variants have prices', () => {
    const variants: FormVariant[] = [
      { sku: 'S1', attributes: { size: 'S' }, merchantPrice: 100, stock: 10, isActive: true },
      { sku: 'S2', attributes: { size: 'M' }, merchantPrice: 120, stock: 5, isActive: true },
    ];

    const result = validateVariantPricing(variants, undefined);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should pass when variants without price have default', () => {
    const variants: FormVariant[] = [
      { sku: 'S1', attributes: { size: 'S' }, merchantPrice: undefined, stock: 10, isActive: true },
      { sku: 'S2', attributes: { size: 'M' }, merchantPrice: undefined, stock: 5, isActive: true },
    ];

    const result = validateVariantPricing(variants, 80);

    expect(result.valid).toBe(true);
  });

  it('should fail when variants have no price and no default', () => {
    const variants: FormVariant[] = [
      { sku: 'S1', attributes: { size: 'S' }, merchantPrice: undefined, stock: 10, isActive: true },
      { sku: 'S2', attributes: { size: 'M' }, merchantPrice: undefined, stock: 5, isActive: true },
    ];

    const result = validateVariantPricing(variants, undefined);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should fail when some variants have no price and no default', () => {
    const variants: FormVariant[] = [
      { sku: 'S1', attributes: { size: 'S' }, merchantPrice: 100, stock: 10, isActive: true },
      { sku: 'S2', attributes: { size: 'M' }, merchantPrice: undefined, stock: 5, isActive: true },
    ];

    const result = validateVariantPricing(variants, "");

    expect(result.valid).toBe(false);
  });

  it('should fail on negative stock', () => {
    const variants: FormVariant[] = [
      { sku: 'S1', attributes: { size: 'S' }, merchantPrice: 100, stock: -5, isActive: true },
    ];

    const result = validateVariantPricing(variants, undefined);

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('المخزون'))).toBe(true);
  });
});

describe('getResolvedVariantPrice', () => {
  it('should return custom source when variant has price', () => {
    const variant: FormVariant = {
      sku: 'S1',
      attributes: {},
      merchantPrice: 100,
      stock: 10,
      isActive: true,
    };

    const result = getResolvedVariantPrice(variant, 80);

    expect(result.source).toBe('custom');
    expect(result.price).toBe(100);
  });

  it('should return default source when variant has no price but default exists', () => {
    const variant: FormVariant = {
      sku: 'S1',
      attributes: {},
      merchantPrice: undefined,
      stock: 10,
      isActive: true,
    };

    const result = getResolvedVariantPrice(variant, 80);

    expect(result.source).toBe('default');
    expect(result.price).toBe(80);
  });

  it('should return missing source when no price and no default', () => {
    const variant: FormVariant = {
      sku: 'S1',
      attributes: {},
      merchantPrice: undefined,
      stock: 10,
      isActive: true,
    };

    const result = getResolvedVariantPrice(variant, "");

    expect(result.source).toBe('missing');
    expect(result.price).toBeUndefined();
  });
});

describe('getMinVariantPrice', () => {
  it('should return minimum final price across variants', () => {
    const variants: FormVariant[] = [
      { sku: 'S1', attributes: {}, merchantPrice: 100, nubianMarkup: 10, stock: 10, isActive: true },
      { sku: 'S2', attributes: {}, merchantPrice: 80, nubianMarkup: 10, stock: 5, isActive: true },
    ];

    const result = getMinVariantPrice(variants, undefined, 10);

    // Min should be 80 * 1.10 = 88
    expect(result).toBe(88);
  });

  it('should use default price for variants without explicit price', () => {
    const variants: FormVariant[] = [
      { sku: 'S1', attributes: {}, merchantPrice: 100, nubianMarkup: 10, stock: 10, isActive: true },
      { sku: 'S2', attributes: {}, merchantPrice: undefined, nubianMarkup: 10, stock: 5, isActive: true },
    ];

    const result = getMinVariantPrice(variants, 60, 10);

    // Min should be 60 * 1.10 = 66 (from default price)
    expect(result).toBe(66);
  });

  it('should return 0 when no valid prices', () => {
    const variants: FormVariant[] = [
      { sku: 'S1', attributes: {}, merchantPrice: undefined, stock: 10, isActive: true },
    ];

    const result = getMinVariantPrice(variants, "", 10);

    expect(result).toBe(0);
  });
});
