# ImageKit Configuration Guide

## Problem: "ImageKit configuration missing" Error

If you're seeing the error "Upload failed: Server error: ImageKit configuration missing. Please check ImageKit configuration in prod", it means the required ImageKit environment variables are not set in your production environment.

## Required Environment Variables

### For Production (Required)

1. **`IMAGEKIT_PRIVATE_KEY`** (Server-side only)
   - ⚠️ **IMPORTANT**: Do NOT use `NEXT_PUBLIC_IMAGEKIT_PRIVATE_KEY` in production
   - This is a security-sensitive key that should only be accessible server-side
   - Get this from your ImageKit dashboard: Settings → API Keys → Private Key

2. **`NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY`** (Client-side accessible)
   - This is safe to expose to the client
   - Get this from your ImageKit dashboard: Settings → API Keys → Public Key

3. **`NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT`** (Recommended)
   - Format: `https://ik.imagekit.io/your_imagekit_id`
   - Get this from your ImageKit dashboard: Settings → URL Endpoint
   - This is optional but recommended for proper URL construction

### For Development (Optional)

- You can use `NEXT_PUBLIC_IMAGEKIT_PRIVATE_KEY` in development for convenience, but it's not recommended for production.

## How to Fix

### Step 1: Get Your ImageKit Credentials

1. Log in to your [ImageKit Dashboard](https://imagekit.io/dashboard)
2. Go to **Settings** → **API Keys**
3. Copy the following:
   - **Public Key** → Use for `NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY`
   - **Private Key** → Use for `IMAGEKIT_PRIVATE_KEY`
4. Go to **Settings** → **URL Endpoint**
5. Copy your URL Endpoint → Use for `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT`

### Step 2: Set Environment Variables in Production

The method depends on your hosting platform:

#### Vercel
1. Go to your project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - `IMAGEKIT_PRIVATE_KEY` = `your_private_key`
   - `NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY` = `your_public_key`
   - `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT` = `https://ik.imagekit.io/your_id`
4. Select **Production** environment (and optionally Preview/Development)
5. Click **Save**
6. **Redeploy** your application for changes to take effect

#### Render
1. Go to your service dashboard
2. Navigate to **Environment** tab
3. Click **Add Environment Variable**
4. Add each variable (same as above)
5. **Redeploy** your service

#### Netlify
1. Go to your site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Add each variable
4. **Redeploy** your site

#### Other Platforms
- Look for "Environment Variables", "Config Vars", or "Secrets" in your hosting platform settings
- Add the three variables listed above
- Restart/redeploy your application

### Step 3: Verify Configuration

After setting the environment variables and redeploying:

1. Try uploading an image again
2. If you still see errors, check:
   - Are the variable names exactly correct? (case-sensitive)
   - Did you redeploy after adding the variables?
   - Are you using `IMAGEKIT_PRIVATE_KEY` (not `NEXT_PUBLIC_IMAGEKIT_PRIVATE_KEY`) in production?

## Local Development Setup

Create a `.env.local` file in the root of your project:

```env
# ImageKit Configuration
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=your_public_key_here
IMAGEKIT_PRIVATE_KEY=your_private_key_here
# OR for dev convenience (not recommended for production):
# NEXT_PUBLIC_IMAGEKIT_PRIVATE_KEY=your_private_key_here
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
```

## Security Notes

- ⚠️ **Never** commit `.env.local` or environment variables to git
- ⚠️ **Never** use `NEXT_PUBLIC_IMAGEKIT_PRIVATE_KEY` in production
- ✅ Always use `IMAGEKIT_PRIVATE_KEY` (without `NEXT_PUBLIC_` prefix) in production
- ✅ The private key should only be accessible server-side

## Troubleshooting

### Error: "ImageKit configuration missing"
- Check that all required environment variables are set
- Verify variable names are correct (case-sensitive)
- Ensure you've redeployed after adding variables

### Error: "Unauthorized"
- Check that you're signed in
- Verify Clerk authentication is working

### Uploads work but URLs are incorrect
- Make sure `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT` is set correctly
- Format should be: `https://ik.imagekit.io/your_imagekit_id`

## Need Help?

If you continue to experience issues:
1. Check the server logs for detailed error messages
2. Verify your ImageKit account is active
3. Ensure your ImageKit API keys have upload permissions
4. Contact your development team with the specific error message

