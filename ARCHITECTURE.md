## Nubian Dashboard (Next.js) — Product-Driven Architecture

### Source of truth
- **Backend schema is law**: `nubian-auth/src/models/product.model.js`
- Dashboard types are now backend-aligned and centralized under `src/domain/product`.

### Canonical layers
- `src/domain/product/product.types.ts`: authoritative DTOs (`ProductDTO`, `ProductVariantDTO`, `ProductAttributeDefDTO`)
- `src/domain/product/product.normalize.ts`: `normalizeProduct(raw) -> NormalizedProduct`
- `src/domain/product/product.selectors.ts`: derived read-only helpers (e.g. options from backend variants)
- `src/domain/product/product.guards.ts`: runtime guards (active, selectable)

### Compatibility note
- `src/types/product.types.ts` is now a **thin re-export** (deprecated). New code should import from `@/domain/product/*`.

