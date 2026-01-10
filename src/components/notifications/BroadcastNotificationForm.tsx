'use client'

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { axiosInstance } from '@/lib/axiosInstance'
import { useAuth } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function BroadcastNotificationForm() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [target, setTarget] = useState<'users' | 'merchants' | 'all'>('all')
  const [type, setType] = useState('MERCHANT_PROMOTION')
  const [deepLink, setDeepLink] = useState('')
  const [isSending, setIsSending] = useState(false)
  const { getToken } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !body.trim()) {
      toast.error('Title and body are required')
      return
    }

    setIsSending(true)

    try {
      const token = await getToken()
      if (!token) {
        toast.error('Authentication required')
        return
      }

      const response = await axiosInstance.post(
        '/notifications/broadcast',
        {
          type,
          title: title.trim(),
          body: body.trim(),
          deepLink: deepLink.trim() || undefined,
          target,
          metadata: {
            sentBy: 'admin',
            timestamp: new Date().toISOString(),
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (response.data.success) {
        toast.success('Broadcast notification sent successfully!', {
          description: `Sent to ${response.data.data?.sent || 0} recipients`,
        })
        setTitle('')
        setBody('')
        setDeepLink('')
      } else {
        toast.error('Failed to send notification', {
          description: response.data.message || 'Unknown error occurred',
        })
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error?.message ||
        'Failed to send broadcast notification. Please try again.'
      toast.error('Error', {
        description: errorMessage,
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="target">Target Audience</Label>
        <Select value={target} onValueChange={(value) => setTarget(value as typeof target)}>
          <SelectTrigger id="target" className="w-full">
            <SelectValue placeholder="Select target audience" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All (Users + Merchants)</SelectItem>
            <SelectItem value="users">Users Only</SelectItem>
            <SelectItem value="merchants">Merchants Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Notification Type</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger id="type">
            <SelectValue placeholder="Select notification type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NEW_ARRIVALS">New Arrivals</SelectItem>
            <SelectItem value="FLASH_SALE">Flash Sale</SelectItem>
            <SelectItem value="MERCHANT_PROMOTION">Merchant Promotion</SelectItem>
            <SelectItem value="PERSONALIZED_OFFER">Personalized Offer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          placeholder="e.g., Flash Sale - 50% Off!"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="body">Message *</Label>
        <Textarea
          id="body"
          placeholder="Write your notification message here..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          className="min-h-[120px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="deepLink">Deep Link (Optional)</Label>
        <Input
          id="deepLink"
          placeholder="e.g., /products/sale or /offers/special"
          value={deepLink}
          onChange={(e) => setDeepLink(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          URL path to navigate when user taps the notification
        </p>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => {
          setTitle('')
          setBody('')
          setDeepLink('')
        }}>
          Clear
        </Button>
        <Button type="submit" disabled={isSending}>
          {isSending ? 'Sending...' : 'Send Broadcast'}
        </Button>
      </div>
    </form>
  )
}
