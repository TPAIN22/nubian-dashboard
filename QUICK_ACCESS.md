# Quick Access Guide

## Admin Dashboard

**Direct URL:** `http://localhost:3000/buseniss/dashboard`

### Steps:
1. Make sure your dev server is running: `npm run dev`
2. Open your browser
3. Go to: `http://localhost:3000/buseniss/dashboard`
4. Sign in with your Clerk account (if not already signed in)
5. Make sure your Clerk user has `publicMetadata.role = "admin"`

### Alternative Access:
- Sign in first at: `http://localhost:3000/sign-in`
- If you're an admin, you'll be redirected to `/buseniss/dashboard`

## Merchant Dashboard

**Direct URL:** `http://localhost:3000/merchant/dashboard`

### Steps:
1. Make sure your dev server is running: `npm run dev`
2. Open your browser
3. Go to: `http://localhost:3000/merchant/dashboard`
4. Sign in with your Clerk account
5. Make sure:
   - Your Clerk user has `publicMetadata.role = "merchant"`
   - Your merchant application is approved in the system

## Debug Your Role

**URL:** `http://localhost:3000/debug-role`

This page shows:
- Your current role from Clerk
- Whether you're recognized as admin/merchant
- What's in your publicMetadata

## Setting Admin Role in Clerk

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **Users** → Select your user
3. Go to **Metadata** tab
4. Under **Public Metadata**, add:
   ```json
   {
     "role": "admin"
   }
   ```
5. Save and wait 10-30 seconds
6. Try accessing `/buseniss/dashboard` again

## Troubleshooting

If you're being redirected:
1. Check terminal logs for role information
2. Visit `/debug-role` to see your actual role
3. Verify the role is set correctly in Clerk Dashboard
4. Make sure it's lowercase: `"admin"` not `"Admin"`

