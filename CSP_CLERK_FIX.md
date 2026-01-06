# CSP Fix for Clerk Blocking

## Issue
Content Security Policy (CSP) was blocking Clerk resources from loading.

## Solution Applied
Updated `next.config.ts` to ensure all Clerk domains (including custom domain `clerk.nubian-sd.store`) are properly included in all CSP directives:

### Key Changes:
1. **Added Clerk domains to `default-src`** - Provides fallback for any resources not explicitly covered
2. **Centralized Clerk domain definitions** - Ensures consistency across all directives
3. **Comprehensive domain coverage** - All Clerk domains included in:
   - `script-src` and `script-src-elem` (for scripts)
   - `connect-src` (for API calls)
   - `frame-src` (for iframes)
   - `worker-src` (for web workers)
   - `style-src` (for styles)
   - `font-src` (for fonts)
   - `form-action` (for form submissions)

### Clerk Domains Included:
- `https://*.clerk.accounts.dev`
- `https://*.clerk.com`
- `https://*.clerk.dev`
- `https://clerk.com`
- `https://*.clerkstage.dev`
- `https://clerk.nubian-sd.store` (your custom domain)
- `https://*.nubian-sd.store` (wildcard for subdomains)

## ⚠️ CRITICAL: Rebuild Required

**CSP headers are set at BUILD TIME in Next.js.** Simply updating the code is NOT enough:

1. **Rebuild the application**:
   ```bash
   npm run build
   ```

2. **Redeploy** - Deploy the new build to your hosting platform

3. **Clear browser cache** - Old CSP headers might be cached

## Verification Steps

After rebuilding and redeploying:

1. **Check browser console** - Should see no CSP violation errors
2. **Check Network tab** - Clerk requests should succeed (status 200)
3. **Test authentication** - Sign in/up should work
4. **Check CSP header** - In browser DevTools → Network → Response Headers → `Content-Security-Policy`

### How to Check CSP Header:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Reload the page
4. Click on any request (e.g., the main document)
5. Look at "Response Headers"
6. Find `Content-Security-Policy` header
7. Verify it includes `clerk.nubian-sd.store` and other Clerk domains

## Expected Results

After rebuild, you should see:
- ✅ No CSP violation errors in console
- ✅ All Clerk requests succeed (no FAILED status)
- ✅ Clerk authentication working properly
- ✅ `ClerkDiagnostics` component shows "Clerk Loaded: ✅ Yes"

## If Issues Persist

If you still see CSP violations after rebuilding:

1. **Check for multiple CSP headers**:
   - Some hosting platforms (Vercel, Render, etc.) add their own CSP
   - Check if your platform has CSP settings that override Next.js config
   - You may need to configure CSP in platform settings instead

2. **Check browser cache**:
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Or clear browser cache completely

3. **Check actual CSP header**:
   - Use browser DevTools to see the actual CSP header being sent
   - Compare it with what's in `next.config.ts`

4. **Check for typos**:
   - Verify domain names are correct
   - Ensure no extra spaces or characters

## Related Files
- `next.config.ts` - CSP configuration (updated)
- `src/app/layout.tsx` - ClerkProvider setup
- `src/components/ClerkDiagnostics.tsx` - Diagnostic component

