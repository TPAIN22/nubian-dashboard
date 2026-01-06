# Clerk CSP Fix - Custom Domain Issue

## Problem Identified

The error message shows:
```
Loading the script 'https://clerk.nubian-sd.store/npm/@clerk/clerk-js@5/dist/clerk.browser.js' 
violates the following Content Security Policy directive: "script-src ..."
```

## Root Cause

You have a **custom Clerk domain** configured (`clerk.nubian-sd.store`), but the Content Security Policy (CSP) headers in `next.config.ts` only allowed Clerk's default domains:
- `*.clerk.accounts.dev`
- `*.clerk.com`
- `*.clerk.dev`

Your custom domain `clerk.nubian-sd.store` was **not included**, so the browser blocked the script.

## Solution Applied

Updated `next.config.ts` to include your custom Clerk domain in all relevant CSP directives:

### Added to CSP:
- `https://clerk.nubian-sd.store` - Your custom Clerk domain
- `https://*.nubian-sd.store` - Wildcard for any subdomain

### Updated Directives:
1. **script-src** - Allows scripts from your custom domain
2. **worker-src** - Allows web workers from your custom domain
3. **style-src** - Allows styles from your custom domain
4. **font-src** - Allows fonts from your custom domain
5. **connect-src** - Allows API connections to your custom domain
6. **frame-src** - Allows iframes from your custom domain
7. **form-action** - Allows form submissions to your custom domain

## Next Steps

1. **Rebuild your application** - The CSP changes require a rebuild
2. **Redeploy** - Deploy the new build
3. **Test** - Clerk should now load successfully

## Verification

After redeploying, check:
- ✅ No CSP violation errors in console
- ✅ Clerk SDK loads successfully
- ✅ `🔍 Clerk Diagnostics` shows "Clerk Loaded: ✅ Yes"
- ✅ No "Failed to load Clerk" errors

## If You Have Other Custom Domains

If you have additional custom Clerk domains, add them to the CSP directives in `next.config.ts`:

```typescript
"script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.clerk.accounts.dev https://*.clerk.com https://clerk.nubian-sd.store https://your-other-domain.com blob:",
```

## Custom Clerk Domain Setup

If you're using a custom Clerk domain, ensure:
1. ✅ Domain is configured in Clerk Dashboard
2. ✅ DNS records are set up correctly
3. ✅ SSL certificate is valid
4. ✅ CSP headers allow the domain (now fixed)

## Related Files

- `next.config.ts` - CSP configuration (updated)
- `src/app/layout.tsx` - ClerkProvider setup
- `src/components/ClerkDiagnostics.tsx` - Diagnostic component

