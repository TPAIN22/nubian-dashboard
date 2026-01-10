# Admin Dashboard Notification System Integration

## Overview

The admin dashboard has been fully integrated with the new production-grade notification system. The notification center provides comprehensive tools for managing notifications, sending broadcasts, creating marketing campaigns, and viewing notification history.

## New Components Created

### 1. Enhanced Notifications Page (`app/business/notifications/page.tsx`)
- **Location**: `/business/notifications`
- **Features**: Tabbed interface with 4 main sections:
  - Broadcast: Send notifications to all users/merchants
  - Marketing: Create targeted marketing campaigns
  - History: View all sent notifications
  - Preferences: Configure notification settings

### 2. Broadcast Notification Form (`components/notifications/BroadcastNotificationForm.tsx`)
- **Purpose**: Send notifications to all users or merchants
- **Features**:
  - Target selection: All, Users Only, or Merchants Only
  - Notification type selection (NEW_ARRIVALS, FLASH_SALE, MERCHANT_PROMOTION, PERSONALIZED_OFFER)
  - Title and message fields
  - Optional deep link for navigation
  - Success/error handling with toast notifications

### 3. Marketing Notification Form (`components/notifications/MarketingNotificationForm.tsx`)
- **Purpose**: Create targeted marketing campaigns
- **Features**:
  - Campaign type selection
  - Targeting modes:
    - Broadcast to all users
    - Specific users (by Clerk ID)
    - Segmented users (coming soon - placeholder)
  - Title, message, and deep link fields
  - Metadata for campaign tracking

### 4. Notification History (`components/notifications/NotificationHistory.tsx`)
- **Purpose**: View all sent notifications
- **Features**:
  - Filter by category (transactional, merchant_alerts, behavioral, marketing)
  - Filter by status (pending, sent, delivered, failed)
  - Table view with notification details:
    - Type, Title, Category, Status, Channel, Recipient Type, Sent At
  - Pagination support
  - Badge indicators for status and category
  - Refresh functionality

### 5. Notification Preferences (`components/notifications/NotificationPreferences.tsx`)
- **Purpose**: Manage notification preferences
- **Features**:
  - Channel preferences (push, in_app, sms, email)
  - Quiet hours configuration (enable/disable, start/end time)
  - Rate limiting settings (max per hour, max per day)
  - Anti-spam settings (minimum interval between same-type notifications)
  - Save functionality with success/error feedback

### 6. Updated Legacy Form (`components/NotificationForm.jsx`)
- **Purpose**: Maintained for backward compatibility
- **Changes**: Updated to use new `/notifications/broadcast` API endpoint

## API Integration

All components use the axios instance configured in `lib/axiosInstance.ts` with proper authentication via Clerk Bearer tokens.

### Endpoints Used

1. **POST `/api/notifications/broadcast`** (Admin only)
   - Send broadcast notifications to all users/merchants
   - Used by: BroadcastNotificationForm

2. **POST `/api/notifications/marketing`** (Admin/Merchant)
   - Send targeted marketing notifications
   - Used by: MarketingNotificationForm

3. **GET `/api/notifications`** (Authenticated)
   - Get notifications for current user/admin
   - Used by: NotificationHistory
   - Query params: `limit`, `offset`, `category`, `status`, `type`, `isRead`

4. **GET `/api/notifications/preferences`** (Authenticated)
   - Get notification preferences
   - Used by: NotificationPreferences

5. **PUT `/api/notifications/preferences`** (Authenticated)
   - Update notification preferences
   - Used by: NotificationPreferences

## Navigation

The notification center is accessible from the admin sidebar:
- **Route**: `/business/notifications`
- **Sidebar Label**: "مركز الاشعارات" (Notification Center)
- **Icon**: IconInnerShadowTop

## Usage Examples

### Send Broadcast Notification

1. Navigate to `/business/notifications`
2. Click on "Broadcast" tab
3. Select target audience (All, Users Only, or Merchants Only)
4. Select notification type
5. Enter title and message
6. Optionally add deep link
7. Click "Send Broadcast"
8. Success message shows number of recipients

### Create Marketing Campaign

1. Navigate to `/business/notifications`
2. Click on "Marketing" tab
3. Select campaign type
4. Choose targeting mode:
   - All Users (broadcast)
   - Specific Users (enter Clerk IDs)
   - Segmented (coming soon)
5. Enter campaign details
6. Click "Send Marketing Campaign"

### View Notification History

1. Navigate to `/business/notifications`
2. Click on "History" tab
3. Filter by category and/or status
4. View notifications in table format
5. Use pagination to browse through notifications

### Configure Preferences

1. Navigate to `/business/notifications`
2. Click on "Preferences" tab
3. Configure:
   - Channel preferences (push, in_app, sms, email)
   - Quiet hours (time range for no push notifications)
   - Rate limiting (max notifications per hour/day)
   - Anti-spam (minimum interval between duplicates)
4. Click "Save Preferences"

## Features Implemented

✅ **Broadcast Notifications**
- Send to all users
- Send to all merchants
- Send to both (all)

✅ **Marketing Campaigns**
- Campaign type selection
- Broadcast targeting
- Specific user targeting
- Segment targeting (placeholder for future implementation)

✅ **Notification History**
- View all sent notifications
- Filter by category and status
- Pagination support
- Status badges (pending, sent, delivered, failed)
- Category badges (transactional, merchant_alerts, behavioral, marketing)

✅ **Preferences Management**
- Channel preferences (push, in_app, sms, email)
- Quiet hours configuration
- Rate limiting configuration
- Anti-spam configuration

✅ **UI/UX**
- Tabbed interface for easy navigation
- Card-based layout
- Toast notifications for feedback
- Loading states
- Error handling
- Responsive design

## Component Dependencies

All components use existing UI components:
- `@/components/ui/button`
- `@/components/ui/input`
- `@/components/ui/textarea`
- `@/components/ui/label`
- `@/components/ui/select`
- `@/components/ui/switch`
- `@/components/ui/card`
- `@/components/ui/tabs`
- `@/components/ui/table`
- `@/components/ui/badge`
- `sonner` for toast notifications

## Authentication

All API requests require authentication via Clerk Bearer token:
```typescript
const token = await getToken()
headers: {
  Authorization: `Bearer ${token}`
}
```

## Error Handling

All components include comprehensive error handling:
- Network errors
- API errors (400, 401, 403, 500)
- Validation errors
- User-friendly error messages via toast notifications

## Future Enhancements

1. **Admin-Specific Endpoints** (Recommended)
   - `GET /api/admin/notifications/all` - View all notifications (not just admin's own)
   - `GET /api/admin/notifications/analytics` - Notification analytics and statistics
   - `GET /api/admin/notifications/:id/details` - View detailed notification delivery status

2. **Advanced Segmentation UI**
   - Location-based filtering
   - Interest-based filtering
   - Purchase history filtering
   - Cart status filtering
   - Merchant following filtering

3. **Notification Templates**
   - Save and reuse notification templates
   - Template library for common notification types

4. **Scheduled Notifications**
   - Schedule notifications for future delivery
   - Recurring notification campaigns

5. **A/B Testing**
   - Test different notification messages
   - Track open rates and conversions

6. **Analytics Dashboard**
   - Delivery success rates
   - Open rates
   - Click-through rates
   - Conversion tracking
   - User engagement metrics

## Testing

To test the notification system:

1. **Broadcast Notification**:
   - Navigate to `/business/notifications`
   - Fill in the broadcast form
   - Send and verify success message

2. **Marketing Campaign**:
   - Navigate to Marketing tab
   - Create a campaign targeting specific users
   - Verify notification is sent

3. **History**:
   - Send a notification
   - Check History tab
   - Verify notification appears in the list
   - Test filters

4. **Preferences**:
   - Navigate to Preferences tab
   - Update settings
   - Save and verify changes persist

## Notes

- The NotificationHistory component currently shows notifications for the logged-in admin user only
- For viewing all notifications across the platform, an admin-specific endpoint would need to be added to the backend
- Segmentation UI is a placeholder - actual segmentation logic needs backend implementation
- SMS and Email channels are disabled in preferences UI (marked as "Coming Soon")
- The legacy NotificationForm component has been updated to use the new API but is kept for backward compatibility

## Migration from Old System

The old notification system used `/api/notifications/send` endpoint. This has been:
- ✅ Updated to use `/api/notifications/broadcast`
- ✅ Maintained for backward compatibility
- ✅ All new features use the enhanced API endpoints
