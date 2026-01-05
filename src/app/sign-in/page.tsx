'use client'

import ModernNoubian from '@/components/nubian'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

export default function GoToDashboardButton() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  const handleClick = useCallback(() => {
    if (!isLoaded) return // انتظر تحميل بيانات المستخدم

    const role = user?.publicMetadata?.role

    if (user && role === 'admin') {
      router.push('/buseniss/dashboard') // مسؤول عن التنقل للإدارة
    } else if (user && role === 'merchant') {
      router.push('/merchant/dashboard') // تاجر ينتقل إلى لوحة تحكم التاجر
    } else {
      router.push('/') // يرجع المستخدم العادي أو غير المسجل
    }
  }, [isLoaded, user, router])
  // ModernNoubian ظاهر للجميع
return <ModernNoubian />

}
