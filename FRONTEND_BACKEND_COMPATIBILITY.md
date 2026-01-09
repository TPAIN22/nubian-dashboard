# Frontend Backend Compatibility Updates

## Summary
Updated the Nubian Dashboard frontend to be compatible with the new backend API endpoints and features implemented in the backend audit.

---

## ✅ Changes Implemented

### 1. **Admin Products Page** (`src/app/business/products/page.tsx`)

#### API Endpoint Update:
- **Old**: `GET /api/products`
- **New**: `GET /api/products/admin/all`
- Now uses admin endpoint with query parameter support

#### New Features Added:
- ✅ **Filtering UI**: Added search, isActive, and includeDeleted filters
- ✅ **Query Parameter Support**: Supports all admin endpoint parameters
  - `category` - Filter by category
  - `merchant` - Filter by merchant
  - `isActive` - Filter by active status (true/false)
  - `includeDeleted` - Include soft-deleted products
  - `search` - Text search on name and description
  - `sortBy` - Sort field (createdAt, name, price, averageRating, isActive)
  - `sortOrder` - Sort direction (asc/desc)
  - `page` - Page number
  - `limit` - Items per page

#### Updated Product Interface:
- Added `deletedAt` field support
- Added `merchant` object field
- Added `category` object field

---

### 2. **Products Table Component** (`src/app/business/products/productsTable.tsx`)

#### API Endpoint Updates:

**Toggle Active:**
- **Old**: `PATCH /api/products/:id` with `isActive` in body
- **New**: `PATCH /api/products/admin/:id/toggle-active` with `isActive` in body

**Delete:**
- **Old**: `DELETE /api/products/:id` (hard delete)
- **New**: `DELETE /api/products/:id` (soft delete - sets deletedAt)

**New Endpoints Added:**
- ✅ **Restore**: `PATCH /api/products/admin/:id/restore`
- ✅ **Hard Delete**: `DELETE /api/products/admin/:id/hard-delete`

#### New Features:

1. **Soft Delete Support:**
   - Products show "محذوف" badge when deletedAt is set
   - Deleted products show different actions menu

2. **Restore Functionality:**
   - Restore button for soft-deleted products
   - Uses admin restore endpoint

3. **Hard Delete Functionality:**
   - Permanent deletion option for deleted products
   - Warning dialog with confirmation
   - Uses admin hard-delete endpoint

4. **Merchant Column:**
   - Added merchant column to display product owner
   - Shows merchant business name
   - Shows merchant status badge (APPROVED, etc.)

5. **Deleted Product Display:**
   - Products with `deletedAt` show "محذوف" badge
   - Toggle active switch disabled for deleted products
   - Different action menu for deleted products (restore/hard delete)

6. **Bulk Operations Update:**
   - Bulk toggle active now uses admin endpoint
   - Filters out deleted products from bulk toggle

#### Updated Product Type:
```typescript
export type Product = {
  _id: string;
  name: string;
  price: number;
  discountPrice: number;
  stock: number;
  isActive: boolean;
  description: string;
  images: string[];
  sizes: string[];
  category?: {
    _id: string;
    name: string;
  } | string;
  merchant?: {
    _id: string;
    businessName: string;
    businessEmail: string;
    status?: string;
  };
  deletedAt?: string | null;  // NEW
  createdAt: string;
  updatedAt: string;
};
```

---

## 📋 API Endpoints Used

### Admin Product Management:
```
GET    /api/products/admin/all
PATCH  /api/products/admin/:id/toggle-active
PATCH  /api/products/admin/:id/restore
DELETE /api/products/admin/:id/hard-delete
DELETE /api/products/:id  (soft delete)
```

### Query Parameters (GET /api/products/admin/all):
- `category` - Filter by category ID
- `merchant` - Filter by merchant ID
- `isActive` - Filter by active status (true/false string)
- `includeDeleted` - Include soft-deleted products (true string)
- `search` - Text search term
- `sortBy` - Sort field (default: createdAt)
- `sortOrder` - Sort direction (asc/desc, default: desc)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)

---

## 🎨 UI Changes

### Filter Panel:
- **Search Input**: Text search by name/description
- **Status Dropdown**: Filter by active status (All/Active/Inactive)
- **Include Deleted Toggle**: Show/hide soft-deleted products

### Product Table:
- **Merchant Column**: Shows merchant business name and status
- **Status Column**: Shows "محذوف" badge for deleted products
- **Action Menu**: 
  - For active products: Edit, Soft Delete
  - For deleted products: Restore, Hard Delete

### Dialogs:
- **Soft Delete Confirmation**: "سيتم حذف المنتج مؤقتاً (حذف ناعم)"
- **Hard Delete Confirmation**: "سيتم حذف المنتج نهائياً" with warning

---

## 🔄 Data Flow

### Fetching Products:
1. User applies filters
2. `fetchProducts()` builds query parameters
3. Calls `GET /api/products/admin/all` with params
4. Backend returns paginated results
5. Products displayed in table

### Toggle Active:
1. User toggles switch or clicks bulk action
2. Frontend calls `PATCH /api/products/admin/:id/toggle-active`
3. Backend updates `isActive` field
4. Frontend refreshes product list

### Soft Delete:
1. User clicks delete button
2. Confirmation dialog shown
3. Frontend calls `DELETE /api/products/:id`
4. Backend sets `deletedAt` timestamp
5. Product disappears from default view (unless includeDeleted=true)

### Restore:
1. User clicks restore on deleted product
2. Frontend calls `PATCH /api/products/admin/:id/restore`
3. Backend clears `deletedAt` field
4. Product becomes active again

### Hard Delete:
1. User clicks hard delete on deleted product
2. Warning dialog shown (permanent deletion)
3. Frontend calls `DELETE /api/products/admin/:id/hard-delete`
4. Backend permanently removes product
5. Product removed from database

---

## ✅ Testing Checklist

- [x] Admin can view all products from all merchants
- [x] Filter by search term works
- [x] Filter by isActive works
- [x] Include deleted toggle works
- [x] Toggle active status works (single and bulk)
- [x] Soft delete works (sets deletedAt)
- [x] Restore deleted product works
- [x] Hard delete works (permanent deletion)
- [x] Merchant column displays correctly
- [x] Deleted products show correct status badge
- [x] Action menu changes for deleted products

---

## 🚀 Deployment Notes

1. **Environment Variables**: Ensure `NEXT_PUBLIC_API_URL` is set correctly
2. **API Endpoints**: Backend must have the new admin endpoints deployed
3. **Authentication**: Admin role required for all admin endpoints
4. **Backward Compatibility**: Old merchant endpoints still work for merchant users

---

## 📝 Notes

- All admin endpoints require `Authorization: Bearer <token>` header
- Admin role checked on backend via Clerk `publicMetadata.role === 'admin'`
- Soft delete is default - preserves data for existing orders
- Hard delete should be used with caution (permanent)
- Filter state persists during session
- Products refresh after any modification

---

**Status**: ✅ Complete - Frontend fully compatible with new backend endpoints
