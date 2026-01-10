'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { axiosInstance } from '@/lib/axiosInstance'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Preferences {
  channels: {
    push: boolean
    in_app: boolean
    sms: boolean
    email: boolean
  }
  quietHours: {
    enabled: boolean
    start: string
    end: string
    timezone: string
  }
  rateLimiting: {
    enabled: boolean
    maxPerHour: number
    maxPerDay: number
  }
  antiSpam: {
    enabled: boolean
    minIntervalBetweenSameType: number
  }
}

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<Preferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { getToken } = useAuth()

  const fetchPreferences = useCallback(async () => {
    try {
      setLoading(true)
      const token = await getToken()
      if (!token) {
        toast.error('Authentication required')
        setLoading(false)
        return
      }

      const response = await axiosInstance.get('/notifications/preferences', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.data?.success && response.data?.data) {
        setPreferences(response.data.data)
      } else {
        // If API returns data without success wrapper, use it directly
        setPreferences(response.data || null)
      }
    } catch (error: any) {
      // Handle 404 as "no preferences" rather than an error
      if (error.response?.status === 404) {
        // Preferences don't exist yet, use defaults
        setPreferences({
          channels: { push: true, in_app: true, sms: false, email: false },
          quietHours: { enabled: false, start: '22:00', end: '08:00', timezone: 'UTC' },
          rateLimiting: { enabled: true, maxPerHour: 10, maxPerDay: 50 },
          antiSpam: { enabled: true, minIntervalBetweenSameType: 300 },
        })
        return
      }
      
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error?.message ||
        'Failed to fetch preferences'
      toast.error('Error', {
        description: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => {
    fetchPreferences()
  }, [fetchPreferences])

  const handleSave = async () => {
    if (!preferences) return

    try {
      setSaving(true)
      const token = await getToken()
      if (!token) {
        toast.error('Authentication required')
        return
      }

      const response = await axiosInstance.put(
        '/notifications/preferences',
        preferences,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (response.data.success) {
        toast.success('Preferences saved successfully!')
        setPreferences(response.data.data)
      } else {
        toast.error('Failed to save preferences')
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error?.message ||
        'Failed to save preferences'
      toast.error('Error', {
        description: errorMessage,
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading preferences...</div>
  }

  if (!preferences) {
    return <div className="text-center py-8 text-muted-foreground">No preferences found</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Channel Preferences</CardTitle>
          <CardDescription>Choose which channels to receive notifications on</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="push-channel">Push Notifications</Label>
            <Switch
              id="push-channel"
              checked={preferences.channels.push}
              onCheckedChange={(checked) =>
                setPreferences({
                  ...preferences,
                  channels: { ...preferences.channels, push: checked },
                })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="in-app-channel">In-App Notifications</Label>
            <Switch
              id="in-app-channel"
              checked={preferences.channels.in_app}
              onCheckedChange={(checked) =>
                setPreferences({
                  ...preferences,
                  channels: { ...preferences.channels, in_app: checked },
                })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="sms-channel">SMS Notifications (Coming Soon)</Label>
            <Switch
              id="sms-channel"
              checked={preferences.channels.sms}
              onCheckedChange={(checked) =>
                setPreferences({
                  ...preferences,
                  channels: { ...preferences.channels, sms: checked },
                })
              }
              disabled
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="email-channel">Email Notifications (Coming Soon)</Label>
            <Switch
              id="email-channel"
              checked={preferences.channels.email}
              onCheckedChange={(checked) =>
                setPreferences({
                  ...preferences,
                  channels: { ...preferences.channels, email: checked },
                })
              }
              disabled
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quiet Hours</CardTitle>
          <CardDescription>Prevent push notifications during specific hours</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="quiet-hours-enabled">Enable Quiet Hours</Label>
            <Switch
              id="quiet-hours-enabled"
              checked={preferences.quietHours.enabled}
              onCheckedChange={(checked) =>
                setPreferences({
                  ...preferences,
                  quietHours: { ...preferences.quietHours, enabled: checked },
                })
              }
            />
          </div>
          {preferences.quietHours.enabled && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quiet-start">Start Time</Label>
                  <Input
                    id="quiet-start"
                    type="time"
                    value={preferences.quietHours.start}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        quietHours: { ...preferences.quietHours, start: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quiet-end">End Time</Label>
                  <Input
                    id="quiet-end"
                    type="time"
                    value={preferences.quietHours.end}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        quietHours: { ...preferences.quietHours, end: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rate Limiting</CardTitle>
          <CardDescription>Control the maximum number of notifications per time period</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="rate-limiting-enabled">Enable Rate Limiting</Label>
            <Switch
              id="rate-limiting-enabled"
              checked={preferences.rateLimiting.enabled}
              onCheckedChange={(checked) =>
                setPreferences({
                  ...preferences,
                  rateLimiting: { ...preferences.rateLimiting, enabled: checked },
                })
              }
            />
          </div>
          {preferences.rateLimiting.enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max-per-hour">Max per Hour</Label>
                <Input
                  id="max-per-hour"
                  type="number"
                  min="1"
                  value={preferences.rateLimiting.maxPerHour}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      rateLimiting: {
                        ...preferences.rateLimiting,
                        maxPerHour: parseInt(e.target.value) || 10,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-per-day">Max per Day</Label>
                <Input
                  id="max-per-day"
                  type="number"
                  min="1"
                  value={preferences.rateLimiting.maxPerDay}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      rateLimiting: {
                        ...preferences.rateLimiting,
                        maxPerDay: parseInt(e.target.value) || 50,
                      },
                    })
                  }
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Anti-Spam</CardTitle>
          <CardDescription>Prevent duplicate notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="anti-spam-enabled">Enable Anti-Spam</Label>
            <Switch
              id="anti-spam-enabled"
              checked={preferences.antiSpam.enabled}
              onCheckedChange={(checked) =>
                setPreferences({
                  ...preferences,
                  antiSpam: { ...preferences.antiSpam, enabled: checked },
                })
              }
            />
          </div>
          {preferences.antiSpam.enabled && (
            <div className="space-y-2">
              <Label htmlFor="min-interval">Minimum Interval (seconds)</Label>
              <Input
                id="min-interval"
                type="number"
                min="0"
                value={preferences.antiSpam.minIntervalBetweenSameType}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    antiSpam: {
                      ...preferences.antiSpam,
                      minIntervalBetweenSameType: parseInt(e.target.value) || 300,
                    },
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Minimum time interval between same-type notifications (in seconds)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  )
}
