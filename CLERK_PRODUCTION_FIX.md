# Clerk Not Loading in Production - Fix Guide

## The Problem

Clerk is not loading in production because `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is not available at **build time**.

## Why This Happens

In Next.js, environment variables prefixed with `NEXT_PUBLIC_` are **embedded into the client bundle during the build process**. They are NOT available at runtime. This means:

- ❌ Setting the variable only in your deployment platform's runtime environment won't work
- ✅ The variable MUST be available when you run `next build`

## How to Fix

### For Vercel:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` with your Clerk publishable key
4. **IMPORTANT**: Make sure it's available for **Production**, **Preview**, and **Development** environments
5. **Redeploy** your application (Vercel will rebuild with the new environment variable)

### For Other Platforms (Netlify, Railway, etc.):

1. Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in your platform's environment variables
2. Ensure it's available during the build step (not just runtime)
3. Trigger a new build/deployment

### For Docker/Manual Deployments:

1. Set the environment variable before running `next build`:
   ```bash
   export NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_key_here
   npm run build
   ```

2. Or use a `.env.production` file (make sure it's not in `.gitignore` if needed):
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_key_here
   ```

## Verification

After redeploying, check:

1. **Browser Console**: 
   - Look for "✅ Clerk publishable key is configured" message
   - Look for "🔑 Clerk Key Check" - this shows if the key was embedded during build
   - If you see "isBuildTimeEmbedded: false", the variable wasn't available during build
2. **Network Tab**: Check if requests to `*.clerk.accounts.dev` or `*.clerk.com` are successful
3. **Application**: Try signing in - Clerk should load properly

### Quick Diagnostic Check

Open your browser console in production and look for:
- `🔑 Clerk Key Check` - Shows if the key is present in the client bundle
- `🔍 Clerk Diagnostics` - Shows detailed diagnostic information
- If the key shows as `undefined`, it means it wasn't set during build time

## Common Issues

### Issue: Variable is set but Clerk still doesn't load

**Solution**: 
1. **Verify the variable name is exactly**: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (case-sensitive)
2. **Check the browser console** for "🔑 Clerk Key Check" - if `isBuildTimeEmbedded: false`, the variable wasn't available during build
3. **Clear your build cache and rebuild**:
   - In Vercel: Go to Deployments → Click the three dots → Redeploy (with "Use existing Build Cache" unchecked)
   - For other platforms: Clear build cache and trigger a fresh build
4. **Verify the key format**: Should start with `pk_live_` for production or `pk_test_` for development
5. **Check for whitespace**: Make sure there are no leading/trailing spaces in the environment variable value

### Issue: CSP (Content Security Policy) blocking Clerk

**Solution**: The `next.config.ts` already includes Clerk domains in CSP. If you still see CSP errors:
- Check browser console for CSP violation messages
- Verify `next.config.ts` has the correct Clerk domains in `script-src` and `connect-src`

### Issue: Variable shows in logs but not in client

**Solution**: This confirms the variable wasn't available at build time. Rebuild with the variable set.

## Testing Locally

To test production build locally:

```bash
# Set the variable
export NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here

# Build
npm run build

# Start production server
npm start
```

If Clerk loads in the local production build, the issue is with your deployment platform's build configuration.

## Need Help?

Check the browser console for detailed error messages. The updated code now includes:
- Better error logging
- Client-side diagnostics component
- Clearer error messages

If issues persist, check:
1. Clerk dashboard for any service status issues
2. Network connectivity to Clerk's CDN
3. Browser console for specific error messages

