# Important: CSP Changes Require Rebuild

## Current Status

CSP configuration has been updated to include:
- ✅ `script-src-elem` directive (more specific for `<script>` elements)
- ✅ `clerk.nubian-sd.store` and `*.nubian-sd.store` in all relevant directives

## ⚠️ CRITICAL: You Must Rebuild

**CSP headers are set at build time in Next.js.** Simply updating the code is not enough:

1. ✅ Code updated in `next.config.ts`
2. ❌ **You must rebuild the application**
3. ❌ **You must redeploy**

## Why Some Requests Still Fail

If you're still seeing CSP violations after updating the code:

1. **Old build is still deployed** - The CSP headers are embedded in the build
2. **Browser cache** - Your browser might be caching the old CSP headers
3. **CDN cache** - If using a CDN, it might be serving cached responses

## Steps to Fix

### Step 1: Rebuild
```bash
npm run build
```

### Step 2: Clear Caches
- Clear browser cache
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Or use incognito/private window

### Step 3: Redeploy
- Deploy the new build to your hosting platform
- Wait for deployment to complete

### Step 4: Verify
1. Open browser DevTools → Network tab
2. Filter by "clerk"
3. Check all requests should succeed (green status)
4. Check console for CSP violations (should be none)

## Current CSP Configuration

The updated CSP includes:

```typescript
"script-src-elem 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://*.clerk.com https://*.clerk.dev https://clerk.com https://*.clerkstage.dev https://clerk.nubian-sd.store https://*.nubian-sd.store blob:"
"connect-src 'self' ... https://clerk.nubian-sd.store https://*.nubian-sd.store ..."
```

This should allow:
- ✅ Script loading from `clerk.nubian-sd.store`
- ✅ API calls to `/v1/environment`
- ✅ API calls to `/v1/client`
- ✅ All other Clerk resources

## If Still Blocked After Rebuild

1. **Check actual CSP header**:
   - Open DevTools → Network tab
   - Click on any request
   - Check "Response Headers" → `Content-Security-Policy`
   - Verify it includes `clerk.nubian-sd.store`

2. **Check for multiple CSP headers**:
   - Some platforms add their own CSP
   - Check if your hosting platform (Render/Vercel) adds additional CSP
   - You might need to configure CSP in platform settings

3. **Test in incognito mode**:
   - Rules out browser cache issues

4. **Check browser console**:
   - Look for exact CSP violation messages
   - They will tell you which directive is blocking

## Quick Test

After redeploying, open browser console and run:
```javascript
// Check if Clerk is loaded
console.log('Clerk loaded:', typeof window.Clerk !== 'undefined')

// Check CSP header
const metaCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]')
console.log('Meta CSP:', metaCSP?.content)

// Check response headers (in Network tab)
// Look for Content-Security-Policy header
```

## Expected Result

After rebuild and redeploy:
- ✅ All Clerk requests succeed
- ✅ No CSP violations in console
- ✅ Clerk SDK loads successfully
- ✅ `🔍 Clerk Diagnostics` shows "Clerk Loaded: ✅ Yes"

