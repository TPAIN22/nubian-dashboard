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

export function MarketingNotificationForm() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [type, setType] = useState('NEW_ARRIVALS')
  const [deepLink, setDeepLink] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [targetMode, setTargetMode] = useState<'all' | 'specific' | 'segment'>('all')
  const [specificUsers, setSpecificUsers] = useState('')
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

      let targetRecipients: null | string[] | { segment: any } = null

      if (targetMode === 'specific') {
        const userIds = specificUsers
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean)
        if (userIds.length === 0) {
          toast.error('Please enter at least one user ID')
          setIsSending(false)
          return
        }
        targetRecipients = userIds
      } else if (targetMode === 'segment') {
        // For now, segment targeting requires backend implementation
        // This is a placeholder for future segmentation
        targetRecipients = {
          segment: {
            location: '',
            interests: [],
            purchase_history: {},
            cart_status: '',
            merchant_following: '',
          },
        }
        toast.info('Segment targeting will be implemented soon')
        setIsSending(false)
        return
      }

      const response = await axiosInstance.post(
        '/notifications/marketing',
        {
          type,
          title: title.trim(),
          body: body.trim(),
          deepLink: deepLink.trim() || undefined,
          metadata: {
            sentBy: 'admin',
            timestamp: new Date().toISOString(),
            campaignType: type,
          },
          targetRecipients,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (response.data.success) {
        toast.success('Marketing notification sent successfully!', {
          description: `Sent to ${response.data.data?.sent || 0} recipients`,
        })
        setTitle('')
        setBody('')
        setDeepLink('')
        setSpecificUsers('')
      } else {
        toast.error('Failed to send notification', {
          description: response.data.message || 'Unknown error occurred',
        })
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error?.message ||
        'Failed to send marketing notification. Please try again.'
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
        <Label htmlFor="type">Campaign Type</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger id="type" className="w-full">
            <SelectValue placeholder="Select campaign type" />
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
        <Label htmlFor="targetMode">Targeting</Label>
        <Select value={targetMode} onValueChange={(value) => setTargetMode(value as typeof targetMode)}>
          <SelectTrigger id="targetMode" className="w-full">
            <SelectValue placeholder="Select targeting mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users (Broadcast)</SelectItem>
            <SelectItem value="specific">Specific Users (by ID)</SelectItem>
            <SelectItem value="segment" disabled>Segmented (Coming Soon)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {targetMode === 'specific' && (
        <div className="space-y-2">
          <Label htmlFor="specificUsers">User IDs (comma-separated)</Label>
          <Textarea
            id="specificUsers"
            placeholder="user_123, user_456, user_789"
            value={specificUsers}
            onChange={(e) => setSpecificUsers(e.target.value)}
            className="min-h-[80px] font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Enter Clerk user IDs separated by commas
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          placeholder="e.g., New Arrivals This Week!"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="body">Message *</Label>
        <Textarea
          id="body"
          placeholder="Write your marketing message here..."
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
          placeholder="e.g., /products/new or /offers/flash-sale"
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
          setSpecificUsers('')
        }}>
          Clear
        </Button>
        <Button type="submit" disabled={isSending}>
          {isSending ? 'Sending...' : 'Send Marketing Campaign'}
        </Button>
      </div>
    </form>
  )
}
