# Debugging Admin Access Issues

## Problem: Being Redirected Even Though You're an Admin in Clerk

### Step 1: Verify Your Clerk Metadata

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **Users** → Find your user
3. Click on your user to open details
4. Go to **Metadata** tab
5. Check **Public Metadata** section

**Expected Format:**
```json
{
  "role": "admin"
}
```

**Common Issues:**
- ❌ `"Role": "admin"` (capital R - wrong)
- ❌ `"role": "Admin"` (capital A - wrong)
- ❌ `"role": "ADMIN"` (all caps - might work but not recommended)
- ❌ `"role": " admin"` (extra space - wrong)
- ✅ `"role": "admin"` (correct - lowercase, no spaces)

### Step 2: Check Browser Console

1. Open your browser's Developer Tools (F12)
2. Go to **Console** tab
3. Try to access `/buseniss/dashboard`
4. Look for log messages that show:
   - Your `userId`
   - Your `role` value
   - Your `publicMetadata` object

You should see logs like:
```
Admin route check: {
  userId: "user_xxx",
  role: "admin",
  publicMetadata: { role: "admin" },
  pathname: "/buseniss/dashboard"
}
```

### Step 3: Clear Cache and Refresh

1. **Hard Refresh**: Press `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
2. **Clear Browser Cache**: 
   - Chrome: Settings → Privacy → Clear browsing data
   - Firefox: Settings → Privacy → Clear Data
3. **Clear Next.js Cache**:
   ```bash
   # Stop the dev server
   # Delete .next folder
   rm -rf .next
   # Or on Windows:
   rmdir /s .next
   # Restart dev server
   npm run dev
   ```

### Step 4: Verify Clerk Session

1. Sign out completely from Clerk
2. Clear browser cookies for localhost
3. Sign in again
4. Try accessing `/buseniss/dashboard`

### Step 5: Check Middleware Logs

The middleware now logs debug information. Check your terminal where `npm run dev` is running. You should see:

**If working:**
```
Admin route check: { userId: '...', role: 'admin', ... }
```

**If not working:**
```
Admin access denied: { userId: '...', role: undefined, ... }
```

### Step 6: Manual Role Check Script

Create a test file to check your role:

```typescript
// test-role.ts (temporary file)
import { clerkClient } from '@clerk/nextjs/server'

async function checkRole(userId: string) {
  try {
    const user = await clerkClient.users.getUser(userId)
    console.log('User:', {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      publicMetadata: user.publicMetadata,
      role: user.publicMetadata?.role
    })
  } catch (error) {
    console.error('Error:', error)
  }
}

// Replace with your actual userId
checkRole('user_xxxxxxxxxxxxx')
```

### Common Solutions

#### Solution 1: Re-save Metadata in Clerk
1. Go to Clerk Dashboard → Users → Your User
2. Go to Metadata tab
3. Delete the existing `role` field
4. Add it again with exact value: `"admin"` (lowercase)
5. Save
6. Wait 10-30 seconds for propagation
7. Try again

#### Solution 2: Use Clerk API to Set Role
```javascript
// In Clerk Dashboard → API Keys → Create a key
// Then use this in a script:

const { clerkClient } = require('@clerk/clerk-sdk-node')

async function setAdminRole(userId) {
  await clerkClient.users.updateUser(userId, {
    publicMetadata: {
      role: 'admin'
    }
  })
  console.log('Role set successfully')
}

setAdminRole('user_xxxxxxxxxxxxx')
```

#### Solution 3: Check for Multiple Users
- Make sure you're signed in with the correct user account
- Check if you have multiple Clerk accounts
- Verify the email matches the user in Clerk Dashboard

### Step 7: Verify Environment Variables

Make sure your `.env.local` has:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### Step 8: Check Network Tab

1. Open Developer Tools → Network tab
2. Try accessing `/buseniss/dashboard`
3. Look for any failed requests
4. Check the response headers

### Still Not Working?

1. **Check the terminal logs** - The middleware now logs detailed information
2. **Verify the exact metadata structure** - Take a screenshot of your Clerk metadata
3. **Try a different browser** - Rule out browser-specific issues
4. **Check if you're using the correct Clerk instance** - Make sure dev/prod keys match

### Quick Test

Run this in your browser console (on any page):
```javascript
// This will show your current Clerk user data
fetch('/api/user-check').then(r => r.json()).then(console.log)
```

You'll need to create this API route to test:
```typescript
// app/api/user-check/route.ts
import { auth } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' })
  }
  
  const user = await clerkClient.users.getUser(userId)
  return NextResponse.json({
    userId,
    role: user.publicMetadata?.role,
    publicMetadata: user.publicMetadata
  })
}
```

