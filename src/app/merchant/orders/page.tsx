'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { axiosInstance } from '@/lib/axiosInstance'
import { OrdersTable } from './ordersTable'
import { toast } from 'sonner'
import logger from '@/lib/logger'

interface Order {
  _id: string
  orderNumber: string
  status: string
  paymentStatus: string
  totalAmount: number
  merchantRevenue: number
  transferProof?: string
  products: any[]
  productsCount: number
  customerInfo: {
    name: string
    email: string
    phone: string
  }
  orderDate: string
  createdAt: string
}

export default function MerchantOrdersPage() {
  const { getToken } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = await getToken()
        
        if (!token) {
          logger.error('Authentication token is null', {})
          toast.error('فشل المصادقة. يرجى تسجيل الدخول مرة أخرى.')
          setLoading(false)
          return
        }
        
        const response = await axiosInstance.get('/orders/merchant/my-orders', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        setOrders(response.data || [])
      } catch (error: any) {
        logger.error('Error fetching orders', { error: error instanceof Error ? error.message : String(error) })
        toast.error('فشل تحميل الطلبات')
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [getToken])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">جاري التحميل...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 h-full sm:mx-12 mx-2 py-4">
      <h1 className="text-2xl font-bold">طلباتي</h1>
      <OrdersTable orders={orders} />
    </div>
  )
}

