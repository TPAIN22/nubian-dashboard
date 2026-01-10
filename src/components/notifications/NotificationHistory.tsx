'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { axiosInstance } from '@/lib/axiosInstance'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Notification {
  _id: string
  type: string
  recipientType: string
  title: string
  body: string
  channel: string
  status: string
  category: string
  isRead: boolean
  sentAt: string
  createdAt: string
  metadata?: any
}

export function NotificationHistory() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<{
    category?: string
    status?: string
    type?: string
    limit: number
    offset: number
  }>({
    limit: 50,
    offset: 0,
  })

  const { getToken } = useAuth()

  const fetchNotifications = useCallback(
    async () => {
      try {
        setLoading(true)
        const token = await getToken()
        if (!token) {
          toast.error('Authentication required')
          return
        }

        const params = new URLSearchParams({
          limit: filter.limit.toString(),
          offset: filter.offset.toString(),
        })

        if (filter.category) params.append('category', filter.category)
        if (filter.status) params.append('status', filter.status)
        if (filter.type) params.append('type', filter.type)

        const response = await axiosInstance.get(`/notifications?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

      // Handle both success wrapper and direct data response
      if (response.data?.success || response.data?.data) {
        const data = response.data.data || response.data
        setNotifications(Array.isArray(data?.notifications) ? data.notifications : Array.isArray(data) ? data : [])
      } else {
        // If response has data but no success flag, treat as array
        setNotifications(Array.isArray(response.data) ? response.data : [])
      }
    } catch (error: any) {
      // Handle 404 or empty responses gracefully
      if (error.response?.status === 404) {
        setNotifications([])
        return
      }
      
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error?.message ||
        error.message ||
        'Failed to fetch notifications'
      toast.error('Error', {
        description: errorMessage,
      })
    } finally {
      setLoading(false)
    }
    },
    [filter.limit, filter.offset, filter.category, filter.status, filter.type, getToken]
  )

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return 'default'
      case 'pending':
        return 'secondary'
      case 'failed':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getCategoryBadgeVariant = (category: string) => {
    switch (category) {
      case 'transactional':
        return 'default'
      case 'merchant_alerts':
        return 'secondary'
      case 'behavioral':
        return 'outline'
      case 'marketing':
        return 'default'
      default:
        return 'outline'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return <div className="text-center py-8">Loading notifications...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        <div className="space-y-2 flex-1">
          <Label htmlFor="category">Category</Label>
          <Select
            value={filter.category || 'all'}
            onValueChange={(value) =>
              setFilter({ ...filter, category: value === 'all' ? undefined : value, offset: 0 })
            }
          >
            <SelectTrigger id="category" className="w-full sm:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="transactional">Transactional</SelectItem>
              <SelectItem value="merchant_alerts">Merchant Alerts</SelectItem>
              <SelectItem value="behavioral">Behavioral</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 flex-1">
          <Label htmlFor="status">Status</Label>
          <Select
            value={filter.status || 'all'}
            onValueChange={(value) =>
              setFilter({ ...filter, status: value === 'all' ? undefined : value, offset: 0 })
            }
          >
            <SelectTrigger id="status" className="w-full sm:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={fetchNotifications} variant="outline">
          Refresh
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Sent At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notifications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No notifications found
                </TableCell>
              </TableRow>
            ) : (
              notifications.map((notification) => (
                <TableRow key={notification._id}>
                  <TableCell className="font-medium">{notification.type}</TableCell>
                  <TableCell className="max-w-[300px] truncate">{notification.title}</TableCell>
                  <TableCell>
                    <Badge variant={getCategoryBadgeVariant(notification.category)}>
                      {notification.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(notification.status)}>
                      {notification.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">{notification.channel}</TableCell>
                  <TableCell className="capitalize">{notification.recipientType}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(notification.sentAt || notification.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {notifications.length > 0 && (
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            disabled={filter.offset === 0}
            onClick={() => setFilter({ ...filter, offset: Math.max(0, filter.offset - filter.limit) })}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Showing {filter.offset + 1} - {filter.offset + notifications.length}
          </span>
          <Button
            variant="outline"
            disabled={notifications.length < filter.limit}
            onClick={() => setFilter({ ...filter, offset: filter.offset + filter.limit })}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
