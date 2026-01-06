# Complete Clerk Setup Guide - Frontend & Backend

## Overview

This guide covers Clerk configuration for both:
- **Frontend** (nubian-dashboard) - Next.js application
- **Backend** (nubian-auth) - Express.js API

## Environment Variables Summary

### Frontend (nubian-dashboard)
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_... (or pk_test_...)
CLERK_SECRET_KEY=sk_live_... (server-side only, for API routes)
```

### Backend (nubian-auth)
```env
CLERK_SECRET_KEY=sk_live_... (or sk_test_...)
CLERK_WEBHOOK_SECRET=whsec_...
```

## Critical Requirements

### 1. Keys Must Match
- Frontend `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and Backend `CLERK_SECRET_KEY` must be from the **same Clerk application**
- Both should be either `test` keys (development) or `live` keys (production)

### 2. Frontend Key Must Be Set at Build Time
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is embedded into the client bundle during `next build`
- Setting it only at runtime won't work
- **You MUST rebuild after setting this variable**

### 3. Backend Key Must Be Set at Runtime
- `CLERK_SECRET_KEY` is read at runtime by the Express server
- No rebuild needed, just restart the server

## Current Issue: Frontend SDK Not Loading

Based on the error messages:
- ✅ Script tag is found (1 tag)
- ❌ SDK object is not available
- ❌ 1 Clerk resource failed to load

### Most Likely Causes

1. **Environment Variable Not Set at Build Time** (90% likely)
   - Variable wasn't available during `next build`
   - Solution: Set variable → Rebuild → Redeploy

2. **CSP Blocking Clerk Scripts** (5% likely)
   - Content Security Policy blocking Clerk CDN
   - Solution: Check `next.config.ts` CSP headers (already updated)

3. **Network/Firewall Blocking** (3% likely)
   - Network blocking Clerk CDN
   - Solution: Check firewall, try different network

4. **Invalid Key Format** (2% likely)
   - Key is malformed or incorrect
   - Solution: Verify key in Clerk Dashboard

## Step-by-Step Fix

### Step 1: Verify Keys in Clerk Dashboard

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Go to **API Keys**
4. Copy:
   - **Publishable Key** → Use in frontend
   - **Secret Key** → Use in backend

### Step 2: Set Frontend Environment Variable

**For Vercel:**
1. Project Settings → Environment Variables
2. Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
3. Set value: `pk_live_...` (or `pk_test_...`)
4. Enable for: Production, Preview, Development
5. **Redeploy** (this triggers a new build)

**For Render/Other:**
1. Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in environment variables
2. Ensure it's available during build step
3. Trigger a new build

### Step 3: Set Backend Environment Variable

**For Render/Other:**
1. Set `CLERK_SECRET_KEY` in environment variables
2. Set `CLERK_WEBHOOK_SECRET` if using webhooks
3. Restart the backend service

### Step 4: Verify Configuration

**Frontend:**
1. Open browser console in production
2. Look for `🔑 Clerk Key Check` message
3. Check `isBuildTimeEmbedded: true`
4. Check `🌐 Clerk Network Requests` for successful requests

**Backend:**
1. Check backend logs for:
   - ✅ "Environment variables validated successfully"
   - ✅ "Server started on port..."
2. Test authenticated endpoint:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        https://your-backend-url/api/users/me
   ```

## Troubleshooting

### Frontend Issues

**Issue**: "Clerk JavaScript SDK is not loaded"
- Check browser console for `🔍 Clerk Diagnostics`
- Check Network tab for failed requests
- Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set at build time
- Rebuild after setting the variable

**Issue**: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing"
- Variable not set in deployment platform
- Variable not available during build
- Solution: Set variable → Rebuild → Redeploy

### Backend Issues

**Issue**: "401 Unauthorized" on API requests
- Check `CLERK_SECRET_KEY` is set
- Verify keys match between frontend and backend
- Check backend logs for Clerk errors

**Issue**: Webhooks not working
- Check `CLERK_WEBHOOK_SECRET` is set
- Verify webhook URL in Clerk Dashboard
- Check webhook endpoint is publicly accessible

## Testing Checklist

- [ ] Frontend `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set
- [ ] Frontend variable was set **before** build
- [ ] Frontend was rebuilt after setting variable
- [ ] Backend `CLERK_SECRET_KEY` is set
- [ ] Both keys are from same Clerk application
- [ ] Both keys are same type (test/test or live/live)
- [ ] Frontend shows Clerk SDK loaded in console
- [ ] Backend logs show successful startup
- [ ] API requests authenticate successfully
- [ ] Webhooks work (if configured)

## Quick Reference

### Frontend Files
- `src/app/layout.tsx` - ClerkProvider configuration
- `next.config.ts` - CSP headers for Clerk
- `src/components/ClerkDiagnostics.tsx` - Diagnostic component

### Backend Files
- `src/index.js` - Clerk middleware setup
- `src/middleware/auth.middleware.js` - Authentication middleware
- `src/lib/envValidator.js` - Environment validation

## Need More Help?

1. Check browser console for detailed diagnostics
2. Check backend logs for Clerk errors
3. Verify keys in Clerk Dashboard
4. Test with minimal setup to isolate issues
5. Contact Clerk support with diagnostic information

## Related Documents

- `CLERK_PRODUCTION_FIX.md` - Frontend troubleshooting
- `CLERK_TROUBLESHOOTING.md` - Detailed troubleshooting
- `../nubian-auth/CLERK_BACKEND_CHECK.md` - Backend configuration

