'use client'

import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { axiosInstance } from '@/lib/axiosInstance'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Merchant {
  _id: string
  businessName: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
}

interface Stats {
  totalOrders: number
  totalRevenue: number
  statusStats: {
    pending: number
    confirmed: number
    shipped: number
    delivered: number
    cancelled: number
  }
  revenueByStatus: {
    pending: number
    confirmed: number
    shipped: number
    delivered: number
    cancelled: number
  }
}

export default function MerchantDashboard() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [merchant, setMerchant] = useState<Merchant | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [productsCount, setProductsCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoaded) return

    const loadDashboardData = async () => {
      try {
        // Check merchant status
        const statusResponse = await axiosInstance.get('/merchants/my-status')
        if (statusResponse.data.hasApplication) {
          const merchantData = statusResponse.data.merchant
          setMerchant(merchantData)
          
          if (merchantData.status !== 'APPROVED') {
            router.push('/merchant/pending')
            return
          }

          // Load stats
          try {
            const statsResponse = await axiosInstance.get('/orders/merchant/stats')
            setStats(statsResponse.data)
          } catch (error) {
            console.error('Error loading stats:', error)
          }

          // Load products count
          try {
            const productsResponse = await axiosInstance.get('/products/merchant/my-products')
            setProductsCount(productsResponse.data.totalProducts || 0)
          } catch (error) {
            console.error('Error loading products:', error)
          }
        } else {
          router.push('/merchant/apply')
          return
        }
      } catch (error: any) {
        console.error('Error loading dashboard:', error)
        if (error.response?.status === 404) {
          router.push('/merchant/apply')
          return
        }
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [isLoaded, router])

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!merchant) {
    return null
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Merchant Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, {merchant.businessName}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground">
              All time orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats ? formatCurrency(stats.totalRevenue) : '$0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              From all orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productsCount}</div>
            <p className="text-xs text-muted-foreground">
              Active products
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Active</div>
            <p className="text-xs text-muted-foreground">
              Merchant approved
            </p>
          </CardContent>
        </Card>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Orders by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Pending:</span>
                  <span className="font-medium">{stats.statusStats.pending}</span>
                </div>
                <div className="flex justify-between">
                  <span>Confirmed:</span>
                  <span className="font-medium">{stats.statusStats.confirmed}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipped:</span>
                  <span className="font-medium">{stats.statusStats.shipped}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivered:</span>
                  <span className="font-medium text-green-600">{stats.statusStats.delivered}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cancelled:</span>
                  <span className="font-medium text-red-600">{stats.statusStats.cancelled}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Delivered:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(stats.revenueByStatus.delivered)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Shipped:</span>
                  <span className="font-medium">
                    {formatCurrency(stats.revenueByStatus.shipped)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Confirmed:</span>
                  <span className="font-medium">
                    {formatCurrency(stats.revenueByStatus.confirmed)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Pending:</span>
                  <span className="font-medium">
                    {formatCurrency(stats.revenueByStatus.pending)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/merchant/products">
              <Button variant="outline" className="w-full">
                Manage Products
              </Button>
            </Link>
            <Link href="/merchant/orders">
              <Button variant="outline" className="w-full">
                View Orders
              </Button>
            </Link>
            <Link href="/merchant/settings">
              <Button variant="outline" className="w-full">
                Store Settings
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

