# How to Access the Admin Dashboard

## Quick Access

**Admin Dashboard URL:** `http://localhost:3000/business/dashboard`

## Step-by-Step Guide

### 1. Prerequisites
- You must have a Clerk account with the **admin** role assigned
- The role is stored in Clerk's `publicMetadata.role` field

### 2. Setting Up Admin Role in Clerk

#### Option A: Via Clerk Dashboard (Recommended)
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **Users** → Select your user
3. Go to **Metadata** tab
4. Under **Public Metadata**, add:
   ```json
   {
     "role": "admin"
   }
   ```
5. Save the changes

#### Option B: Via Clerk API
```javascript
// Using Clerk API
await clerkClient.users.updateUser(userId, {
  publicMetadata: {
    role: 'admin'
  }
})
```

### 3. Access Methods

#### Method 1: Direct URL
1. Make sure you're signed in to Clerk
2. Navigate directly to: `http://localhost:3000/business/dashboard`
3. If you're not an admin, you'll be redirected to the homepage

#### Method 2: Via Sign-In Page
1. Go to: `http://localhost:3000/sign-in`
2. Sign in with your Clerk account
3. If your role is `admin`, you'll be automatically redirected to `/business/dashboard`

### 4. Admin Dashboard Routes

Once you have admin access, you can navigate to:

- **Dashboard**: `/business/dashboard`
- **Products**: `/business/products`
- **Categories**: `/business/categories`
- **Orders**: `/business/orders`
- **Merchants**: `/business/merchants` (to approve/reject merchant applications)
- **Brands**: `/business/brands`
- **Banners**: `/business/banners`
- **Coupons**: `/business/coupons`
- **Notifications**: `/business/notifications`

## Security

- All admin routes (`/business/*`) are protected by middleware
- Only users with `publicMetadata.role === 'admin'` can access
- Non-admin users are automatically redirected to the homepage
- Authentication is required for all admin routes

## Troubleshooting

### Issue: Redirected to Homepage
**Solution**: Check that your Clerk user has `publicMetadata.role` set to `"admin"`

### Issue: Redirected to Sign-In
**Solution**: Make sure you're authenticated with Clerk

### Issue: 404 Error
**Solution**: 
- Make sure the dev server is running: `npm run dev`
- Check that you're using the correct URL: `/business/dashboard` (not `/admin/dashboard`)

### Issue: Can't Set Role in Clerk
**Solution**: 
- Make sure you have admin access to the Clerk dashboard
- Or use the Clerk API to update the user metadata programmatically

## Quick Test

1. Sign in at: `http://localhost:3000/sign-in`
2. Check your browser console for any errors
3. Navigate to: `http://localhost:3000/business/dashboard`
4. If you see the admin dashboard, you're all set!

## Notes

- The admin dashboard route is `/business` (not `/admin`)
- The role check happens server-side in the middleware
- Changes to Clerk metadata may take a few seconds to propagate

