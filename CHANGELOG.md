## Unreleased

### Product schema realignment
- Added canonical product domain contract:
  - `src/domain/product/product.types.ts` (backend-aligned DTOs)
  - `src/domain/product/product.normalize.ts`, `product.selectors.ts`, `product.guards.ts`
- Converted `src/types/product.types.ts` to a **thin re-export** (removed frontend-owned helpers that computed stock/variants locally).

### Forms
- Updated merchant/business product creation forms to:
  - default `attributes[].type`/`required`/`options` to backend defaults when writing to the form
  - keep variant `merchantPrice` and legacy `price` mirror in sync (backend requires both)
- Updated `VariantManager` to always create/edit variants with backend-required fields.

