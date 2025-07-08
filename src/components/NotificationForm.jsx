'use client'

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { axiosInstance } from '@/lib/axiosInstance'
import { useAuth } from '@clerk/nextjs'

export function NotificationForm() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false); // لإدارة حالة الإرسال وتعطيل الزر

  const { getToken } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // التحقق من الحقول الفارغة (تأكد من عدم وجود مسافات فقط)
    if (!title.trim() || !body.trim()) {
      toast.error('Notification title and content cannot be empty.');
      return;
    }

    setIsSending(true); // تفعيل حالة التحميل

    try {
      const token = await getToken();
      const res = await axiosInstance.post('/notifications/send', { title, body }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 200) {
        (res.data);
        toast.success("Notification Sent!", {
          description: "Your notification has been successfully queued.",
        });
        setTitle('');
        setBody('');
      } else {
        // في حالة وجود استجابة بخطأ لكن ليس من Axios Error (أقل شيوعًا)
        toast.error(`Failed to send notification. Status: ${res.status}`);
      }
    } catch (error) {
      console.error('Error sending notification from frontend:', error);
      // التعامل مع الأخطاء من Axios (مثل 400, 500, أو أخطاء الشبكة)
      const errorMessage = error.response?.data?.error || 'Failed to send notification. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSending(false); // تعطيل حالة التحميل سواء نجح الطلب أو فشل
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-xl mx-auto w-full">
    
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center md:text-left">
      
        Send New Notification
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6 bg-background p-6 rounded-lg shadow-md">
       
        <div>
          <Label htmlFor="notificationTitle" className="mb-2 block text-foreground">
            Notification Title
          </Label>
          <Input
            type="text"
            id="notificationTitle"
            placeholder="e.g., Important Update, New Feature!"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full" // تأكد من أن المدخل يأخذ العرض الكامل
          />
        </div>

        <div>
          <Label htmlFor="notificationContent" className="mb-2 block text-foreground">
            Notification Content
          </Label>
          <Textarea
            id="notificationContent"
            placeholder="Write your notification message here..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            className="min-h-[160px] w-full resize-y" // resize-y للسماح بتغيير الحجم عموديًا
          />
        </div>

        <div className="flex justify-end pt-2"> {/* pt-2 لإضافة تباعد علوي قليل */}
          <Button type="submit" disabled={isSending}>
            {isSending ? 'Sending...' : 'Send Notification'}
          </Button>
        </div>
      </form>
    </div>
  )
}