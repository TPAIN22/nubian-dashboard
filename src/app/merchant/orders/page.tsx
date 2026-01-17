'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { axiosInstance } from '@/lib/axiosInstance'
import { OrdersTable } from './ordersTable'
import { toast } from 'sonner'
import logger from '@/lib/logger'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
export const runtime = 'edge';

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

type OrderStatus = 'all' | 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'

export default function MerchantOrdersPage() {
  const { getToken } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('all')

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

        const params = selectedStatus !== 'all' ? { status: selectedStatus } : {}
        const response = await axiosInstance.get('/orders/merchant/my-orders', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params,
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
  }, [getToken, selectedStatus])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">جاري التحميل...</div>
      </div>
    )
  }

  const getStatusCount = (status: OrderStatus) => {
    if (status === 'all') return orders.length
    return orders.filter(order => order.status === status).length
  }

  // Analytics calculations
  const totalRevenue = orders.reduce((sum, order) => sum + (order.merchantRevenue || 0), 0)
  const pendingOrders = orders.filter(order => order.status === 'pending').length
  const todaysOrders = orders.filter(order => {
    const today = new Date().toDateString()
    return new Date(order.orderDate).toDateString() === today
  }).length

  const statusTabs = [
    { value: 'all' as OrderStatus, label: 'الكل', color: 'default' },
    { value: 'pending' as OrderStatus, label: 'قيد الانتظار', color: 'secondary' },
    { value: 'confirmed' as OrderStatus, label: 'مؤكد', color: 'default' },
    { value: 'shipped' as OrderStatus, label: 'تم الشحن', color: 'default' },
    { value: 'delivered' as OrderStatus, label: 'تم التسليم', color: 'default' },
    { value: 'cancelled' as OrderStatus, label: 'ملغي', color: 'destructive' },
  ]

  return (
    <div className="flex flex-col gap-4 h-full sm:mx-12 mx-2 py-4">
      <h1 className="text-2xl font-bold">طلباتي</h1>

      {/* Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${totalRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">من جميع الطلبات</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">طلبات قيد الانتظار</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {pendingOrders}
            </div>
            <p className="text-xs text-muted-foreground">تحتاج إلى معالجة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">طلبات اليوم</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {todaysOrders}
            </div>
            <p className="text-xs text-muted-foreground">طلبات اليوم</p>
          </CardContent>
        </Card>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {statusTabs.map((tab) => (
          <Button
            key={tab.value}
            variant={selectedStatus === tab.value ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedStatus(tab.value)}
            className="text-xs"
          >
            {tab.label}
            <Badge variant={tab.color as any} className="ml-2 text-xs">
              {getStatusCount(tab.value)}
            </Badge>
          </Button>
        ))}
      </div>

      <OrdersTable orders={orders} />
    </div>
  )
}

