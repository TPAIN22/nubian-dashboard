# Clerk Custom Domain Request Failures

## Issue Description

You're seeing some failed requests to your custom Clerk domain (`clerk.nubian-sd.store`):

```
FAILED: https://clerk.nubian-sd.store/npm/@clerk/clerk-js@5/dist/cle...
FAILED: https://clerk.nubian-sd.store/v1/environment?__clerk_api_ver...
FAILED: https://clerk.nubian-sd.store/v1/client?__clerk_api_version=...
```

However, versioned paths are working successfully:

```
SUCCESS: https://clerk.nubian-sd.store/npm/@clerk/clerk-js@5.117.0/di...
```

## Root Cause

This behavior occurs because:

1. **Clerk tries multiple paths**: Clerk SDK attempts to load resources from non-versioned paths first (e.g., `@clerk/clerk-js@5/dist/...`), then falls back to versioned paths (e.g., `@clerk/clerk-js@5.117.0/...`).

2. **Custom domain proxy limitations**: Your custom domain proxy (`clerk.nubian-sd.store`) may not be configured to handle all Clerk paths, particularly:
   - Non-versioned npm package paths
   - API endpoints like `/v1/environment` and `/v1/client`

3. **Fallback mechanism**: When non-versioned paths fail, Clerk automatically falls back to versioned paths, which are working correctly.

## Impact

**This is typically not a critical issue** if:
- ✅ Versioned paths are loading successfully
- ✅ Clerk authentication is working
- ✅ No user-facing errors are occurring

The failures are expected behavior when the custom domain proxy doesn't support all Clerk paths, and Clerk's fallback mechanism handles it gracefully.

## Solutions

### Option 1: Verify Custom Domain Configuration (Recommended)

1. **Check Clerk Dashboard**:
   - Go to your Clerk Dashboard → **Domains** section
   - Verify `clerk.nubian-sd.store` is properly configured
   - Ensure DNS records are correctly set up
   - Check that SSL certificate is valid

2. **Verify Proxy Configuration**:
   - The custom domain should proxy all Clerk paths
   - Contact Clerk support if the proxy isn't handling all necessary paths

### Option 2: Use Environment Variable (If Supported)

If Clerk supports it for your setup, you can try setting the frontend API URL explicitly:

```env
NEXT_PUBLIC_CLERK_FRONTEND_API=clerk.nubian-sd.store
```

However, this is typically not needed if the custom domain is properly configured in the Clerk dashboard.

### Option 3: Accept the Fallback Behavior

If Clerk is working correctly despite the initial failures, you can:
- Monitor that versioned paths continue to work
- Ignore the non-critical failures (they're handled by Clerk's fallback)
- Focus on ensuring the custom domain proxy handles the versioned paths correctly

## Verification

To verify everything is working:

1. **Check Browser Console**: Look for successful Clerk initialization
2. **Test Authentication**: Try signing in/up to ensure Clerk works
3. **Check Network Tab**: Verify versioned paths are loading successfully
4. **Review Clerk Diagnostics**: Use the `ClerkDiagnostics` component to check Clerk status

## Current Configuration

Your application is already configured with:
- ✅ CSP headers allowing `clerk.nubian-sd.store` in `next.config.ts`
- ✅ ClerkProvider properly initialized in `src/app/layout.tsx`
- ✅ Environment variables set up correctly

## Next Steps

1. **If Clerk is working**: The failures are non-critical and can be ignored
2. **If you want to eliminate failures**: Contact Clerk support to ensure your custom domain proxy handles all necessary paths
3. **Monitor**: Keep an eye on whether versioned paths continue to work

## Related Files

- `src/app/layout.tsx` - ClerkProvider configuration
- `next.config.ts` - CSP headers (already includes custom domain)
- `src/components/ClerkDiagnostics.tsx` - Diagnostic component

