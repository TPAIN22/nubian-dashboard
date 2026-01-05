'use client'

import { useEffect, useState } from 'react'
import { axiosInstance } from '@/lib/axiosInstance'
import { OrdersTable } from './ordersTable'
import { toast } from 'sonner'

interface Order {
  _id: string
  orderNumber: string
  status: string
  paymentStatus: string
  totalAmount: number
  merchantRevenue: number
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
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axiosInstance.get('/orders/merchant/my-orders')
        setOrders(response.data || [])
      } catch (error: any) {
        console.error('Error fetching orders:', error)
        toast.error('Failed to load orders')
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 h-full sm:mx-12 mx-2">
      <h1 className="text-2xl font-bold">My Orders</h1>
      <OrdersTable orders={orders} />
    </div>
  )
}

