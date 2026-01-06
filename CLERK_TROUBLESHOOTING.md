# Clerk SDK Not Loading - Troubleshooting Guide

Based on [Clerk Documentation](https://clerk.com/docs), here's a comprehensive guide to fix the "Clerk JavaScript SDK is not loaded" error.

## Common Causes

### 1. Environment Variable Not Set at Build Time ⚠️ (Most Common)

**Problem**: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` must be available during the build process, not just at runtime.

**Solution**:
- ✅ Set the variable in your deployment platform **before** building
- ✅ For Vercel: Project Settings → Environment Variables → Add for Production
- ✅ For Render/Other platforms: Set in build environment, not just runtime
- ✅ **Rebuild** your application after setting the variable

**How to Verify**:
1. Open browser console in production
2. Look for `🔑 Clerk Key Check` message
3. Check `isBuildTimeEmbedded` - should be `true`
4. If `false`, the variable wasn't available during build

### 2. Content Security Policy (CSP) Blocking Clerk Scripts

**Problem**: Your CSP headers might be blocking Clerk's CDN scripts.

**Solution**: The `next.config.ts` has been updated to include all Clerk domains:
- `https://*.clerk.accounts.dev`
- `https://*.clerk.com`
- `https://*.clerk.dev`
- `https://clerk.com`

**How to Verify**:
1. Open browser console
2. Look for CSP violation errors
3. Check Network tab for blocked requests (status: blocked)

### 3. Network Issues or CDN Problems

**Problem**: Clerk's CDN might be unreachable or blocked.

**Solution**:
1. Check [Clerk Status Page](https://status.clerk.com) for outages
2. Verify your network/firewall isn't blocking Clerk domains
3. Check if ad blockers are interfering (try disabling them)

**How to Verify**:
1. Open Network tab in browser DevTools
2. Filter by "clerk"
3. Look for failed requests (red status)
4. Check request URLs - they should be to `*.clerk.accounts.dev` or `*.clerk.com`

### 4. Invalid Publishable Key Format

**Problem**: The key might be malformed or incorrect.

**Solution**:
- ✅ Key should start with `pk_live_` (production) or `pk_test_` (development)
- ✅ No leading/trailing whitespace
- ✅ Full key copied correctly from Clerk Dashboard

**How to Verify**:
1. Check browser console for `🔑 Clerk Key Check`
2. Verify `startsWithPk: true`
3. Check key length (should be ~50+ characters)

### 5. Script Loading Conflicts

**Problem**: Other scripts might be interfering with Clerk's initialization.

**Solution**:
- Delay loading of conflicting scripts
- Check for JavaScript errors before Clerk loads
- Ensure no other auth libraries are conflicting

## Diagnostic Steps

### Step 1: Check Browser Console

Look for these messages:
- `🔑 Clerk Key Check` - Shows if key is embedded
- `🔍 Clerk Diagnostics` - Detailed diagnostic info
- Any red error messages about Clerk

### Step 2: Check Network Tab

1. Open DevTools → Network tab
2. Filter by "clerk"
3. Look for:
   - ✅ Successful requests (200 status) = Good
   - ❌ Failed requests (4xx/5xx) = Problem
   - ⚠️ Blocked requests = CSP issue

### Step 3: Check Environment Variable

In browser console, run:
```javascript
console.log('Clerk Key:', process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)
```

- If `undefined`: Variable wasn't set at build time
- If shows value: Variable is embedded correctly

### Step 4: Verify ClerkProvider Configuration

Check `src/app/layout.tsx`:
```tsx
<ClerkProvider
  publishableKey={clerkPublishableKey}
  // ... other props
>
```

Ensure `publishableKey` is not `undefined` or empty.

## Quick Fixes

### Fix 1: Rebuild with Environment Variable

```bash
# Set the variable
export NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_key_here

# Build
npm run build

# Test locally
npm start
```

### Fix 2: Clear Build Cache

If using Vercel:
1. Go to Deployments
2. Click "..." on latest deployment
3. Select "Redeploy"
4. **Uncheck** "Use existing Build Cache"
5. Deploy

### Fix 3: Verify CSP Headers

Check that `next.config.ts` includes all Clerk domains in CSP. The updated config should have:
- `script-src` with Clerk domains
- `connect-src` with Clerk API domains
- `frame-src` with Clerk domains

## Still Not Working?

1. **Check Clerk Dashboard**:
   - Verify your publishable key is correct
   - Check if your application is active
   - Verify domain settings if using custom domain

2. **Test with Minimal Setup**:
   ```tsx
   // Minimal test
   <ClerkProvider publishableKey="pk_test_...">
     <div>Test</div>
   </ClerkProvider>
   ```

3. **Contact Clerk Support**:
   - [Clerk Discord](https://clerk.com/discord)
   - [Clerk Support](https://clerk.com/support)
   - Include diagnostic information from browser console

## References

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk Environment Variables Guide](https://clerk.com/docs/guides/development/clerk-environment-variables)
- [Clerk Script Loading Troubleshooting](https://clerk.com/docs/guides/development/troubleshooting/script-loading)
- [Clerk Production Deployment](https://clerk.com/docs/guides/development/deployment/production)

