'use client'

import { useUser } from '@clerk/nextjs'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { axiosInstance } from '@/lib/axiosInstance'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

export default function MerchantApply() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [formData, setFormData] = useState({
    businessName: '',
    businessDescription: '',
    businessEmail: user?.primaryEmailAddress?.emailAddress || '',
    businessPhone: '',
    businessAddress: '',
  })

  useEffect(() => {
    if (!isLoaded) return

    const checkExistingApplication = async () => {
      try {
        const response = await axiosInstance.get('/merchants/my-status')
        if (response.data.hasApplication) {
          const merchant = response.data.merchant
          if (merchant.status === 'APPROVED') {
            router.push('/merchant/dashboard')
          } else {
            router.push('/merchant/pending')
          }
          return
        }
      } catch (error: any) {
        if (error.response?.status !== 404) {
          console.error('Error checking merchant status:', error)
        }
      } finally {
        setChecking(false)
      }
    }

    checkExistingApplication()
  }, [isLoaded, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await axiosInstance.post('/merchants/apply', formData)
      toast.success('Application submitted successfully!')
      router.push('/merchant/pending')
    } catch (error: any) {
      console.error('Error submitting application:', error)
      toast.error(error.response?.data?.message || 'Failed to submit application')
    } finally {
      setLoading(false)
    }
  }

  if (!isLoaded || checking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-6">
      <div className="max-w-2xl w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Become a Merchant</h1>
          <p className="text-muted-foreground">
            Fill out the form below to apply for a merchant account. Our team will review your application.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border bg-card p-8">
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name *</Label>
            <Input
              id="businessName"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              required
              placeholder="Enter your business name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessEmail">Business Email *</Label>
            <Input
              id="businessEmail"
              type="email"
              value={formData.businessEmail}
              onChange={(e) => setFormData({ ...formData, businessEmail: e.target.value })}
              required
              placeholder="business@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessPhone">Business Phone</Label>
            <Input
              id="businessPhone"
              type="tel"
              value={formData.businessPhone}
              onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })}
              placeholder="+1234567890"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessDescription">Business Description</Label>
            <Textarea
              id="businessDescription"
              value={formData.businessDescription}
              onChange={(e) => setFormData({ ...formData, businessDescription: e.target.value })}
              placeholder="Tell us about your business..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessAddress">Business Address</Label>
            <Textarea
              id="businessAddress"
              value={formData.businessAddress}
              onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
              placeholder="Enter your business address"
              rows={2}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Submitting...' : 'Submit Application'}
          </Button>
        </form>
      </div>
    </div>
  )
}

