'use client'

import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BroadcastNotificationForm } from '@/components/notifications/BroadcastNotificationForm'
import { MarketingNotificationForm } from '@/components/notifications/MarketingNotificationForm'
import { NotificationHistory } from '@/components/notifications/NotificationHistory'
import { NotificationPreferences } from '@/components/notifications/NotificationPreferences'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const runtime = 'edge';


function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('broadcast')

  return (
    <div className="flex flex-col gap-6 h-full p-4 sm:p-6 md:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Notification Center</h1>
        <p className="text-muted-foreground">
          Manage notifications, send broadcasts, and configure marketing campaigns
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="broadcast">Broadcast</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="broadcast" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Broadcast Notification</CardTitle>
              <CardDescription>
                Send notifications to all users or merchants at once
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BroadcastNotificationForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketing" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Marketing Campaign</CardTitle>
              <CardDescription>
                Create targeted marketing notifications for specific user segments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MarketingNotificationForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification History</CardTitle>
              <CardDescription>
                View all sent notifications and their delivery status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationHistory />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure default notification settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationPreferences />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default NotificationsPage
