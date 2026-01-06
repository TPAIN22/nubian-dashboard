'use client'

import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DebugRolePage() {
  const { user, isLoaded } = useUser()
  const [apiData, setApiData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isLoaded) {
      fetch('/api/user-check')
        .then(res => res.json())
        .then(data => {
          setApiData(data)
          setLoading(false)
        })
        .catch(err => {
          console.error('Error fetching role:', err)
          setLoading(false)
        })
    }
  }, [isLoaded])

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Role Debug Information</h1>
      
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Client-Side (useUser Hook)</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify({
                userId: user?.id,
                email: user?.emailAddresses?.[0]?.emailAddress,
                role: user?.publicMetadata?.role,
                publicMetadata: user?.publicMetadata,
                isAdmin: user?.publicMetadata?.role === 'admin',
              }, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Server-Side (API Route)</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(apiData, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Diagnosis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className={`p-3 rounded-lg ${user?.publicMetadata?.role === 'admin' ? 'bg-success/10 dark:bg-success/20' : 'bg-destructive/10 dark:bg-destructive/20'}`}>
                <strong>Client Role Check:</strong> {user?.publicMetadata?.role === 'admin' ? '✅ ADMIN' : '❌ NOT ADMIN'}
                <br />
                <span className="text-sm text-muted-foreground">
                  Role value: &quot;{String(user?.publicMetadata?.role ?? 'undefined')}&quot; (type: {String(typeof user?.publicMetadata?.role)})
                </span>
              </div>
              
              <div className={`p-3 rounded-lg ${apiData?.isAdmin ? 'bg-success/10 dark:bg-success/20' : 'bg-destructive/10 dark:bg-destructive/20'}`}>
                <strong>Server Role Check:</strong> {apiData?.isAdmin ? '✅ ADMIN' : '❌ NOT ADMIN'}
                <br />
                <span className="text-sm text-muted-foreground">
                  Role value: &quot;{String(apiData?.role ?? 'undefined')}&quot; (type: {String(typeof apiData?.role)})
                </span>
              </div>

              {user?.publicMetadata?.role !== 'admin' && (
                <div className="p-4 bg-warning/10 dark:bg-warning/20 rounded-lg">
                  <strong>⚠️ Issue Detected:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Your role is not set to &quot;admin&quot; (lowercase)</li>
                    <li>Go to Clerk Dashboard → Users → Your User → Metadata</li>
                    <li>In Public Metadata, set: <code>{'{ "role": "admin" }'}</code></li>
                    <li>Make sure it&apos;s lowercase &quot;admin&quot; with no spaces</li>
                    <li>Wait 10-30 seconds after saving, then refresh this page</li>
                  </ul>
                </div>
              )}

              {user?.publicMetadata?.role === 'admin' && apiData?.isAdmin && (
                <div className="p-4 bg-success/10 dark:bg-success/20 rounded-lg">
                  <strong>✅ Role is correctly set!</strong>
                  <p className="mt-2">If you&apos;re still being redirected, check:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Browser cache - try hard refresh (Ctrl+Shift+R)</li>
                    <li>Next.js cache - delete .next folder and restart</li>
                    <li>Check terminal logs for middleware errors</li>
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <a
                href="/business/dashboard"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                Try Admin Dashboard
              </a>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90"
              >
                Refresh Page
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

