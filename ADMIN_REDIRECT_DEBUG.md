# Admin Redirect Issue - Debug Guide

## Problem
When an admin hits `/business/products/new`, they're being redirected to `/merchant/apply`.

## What I've Fixed

### 1. **Middleware Improvements** (`middleware.ts`)
- ✅ Added extensive console logging to track role detection
- ✅ Checks `sessionClaims` first (faster, no API call)
- ✅ Allows through when role is undefined (prevents premature redirects)
- ✅ Better error handling with fallback to sessionClaims

### 2. **Product Form Protection** (`productForm.tsx`)
- ✅ Added role verification on component mount
- ✅ Prevents redirecting admins
- ✅ Only redirects users who are neither admin nor merchant
- ✅ Added detailed logging

## How to Debug

### Step 1: Check Browser Console
When you hit `/business/products/new` as an admin, check the browser console. You should see:
```
[Middleware] Admin route check: { pathname: '/business/products/new', userId: '...', roleFromSession: 'admin', ... }
[Middleware] Admin access granted: { userId: '...', pathname: '/business/products/new' }
[ProductForm] User role check: { userRole: 'admin', userId: '...', ... }
[ProductForm] Admin access confirmed - allowing access
```

### Step 2: Check Network Tab
- Look for any redirect responses (302, 307)
- Check the response headers for `x-redirect-reason`
- Verify the final URL you end up on

### Step 3: Verify Admin Role in Clerk
1. Go to Clerk Dashboard → Users → [Your Admin User]
2. Check `publicMetadata.role` - should be `"admin"` (lowercase string)
3. If not set, update it:
   ```json
   {
     "role": "admin"
   }
   ```

### Step 4: Check Backend Logs
Look for:
- `Admin access granted` in middleware logs
- Any 403 responses from `/api/products`
- Error messages about merchant status

## Common Issues

### Issue 1: Role Not Set in Clerk
**Symptom**: Console shows `roleFromSession: undefined`

**Solution**: 
- Set `publicMetadata.role = "admin"` in Clerk Dashboard
- Wait a few seconds for session to refresh
- Try again

### Issue 2: Session Not Updated
**Symptom**: Role is set in Clerk but middleware shows `undefined`

**Solution**:
- Sign out and sign in again
- Clear browser cookies
- Wait for session to refresh (may take a few seconds)

### Issue 3: Backend Returning Merchant Error
**Symptom**: Product creation fails with merchant-related error

**Solution**:
- Backend middleware `isAdminOrApprovedMerchant` should allow admins
- Check backend logs for any 403 responses
- Verify backend is checking admin role correctly

## Expected Behavior

### For Admins:
1. ✅ Middleware detects `role === 'admin'` from sessionClaims or API
2. ✅ Middleware allows through to `/business/products/new`
3. ✅ Product form verifies admin role client-side
4. ✅ Product form allows admin to create products
5. ✅ No redirects happen

### If Role is Undefined:
1. ✅ Middleware allows through (doesn't redirect)
2. ✅ Product form checks role client-side
3. ✅ If admin role detected, allows access
4. ✅ If not admin/merchant, redirects to dashboard

## Debugging Checklist

- [ ] Check browser console for middleware logs
- [ ] Check browser console for product form logs
- [ ] Verify admin role is set in Clerk Dashboard
- [ ] Check Network tab for redirects
- [ ] Check backend logs for any errors
- [ ] Try signing out and signing in again
- [ ] Clear browser cache and cookies
- [ ] Check if redirect happens immediately or after form submission

## Next Steps

If redirect still happens after these fixes:

1. **Share the console logs** - The new logging will show exactly where the redirect is coming from
2. **Check Network tab** - See what API calls are being made
3. **Check response headers** - Look for `x-redirect-reason` header
4. **Verify Clerk role** - Make sure `publicMetadata.role === "admin"`

The extensive logging added will help identify exactly where the redirect is happening.
