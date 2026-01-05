import { auth } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import logger from '@/lib/logger'

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ 
        authenticated: false,
        error: 'Not authenticated' 
      })
    }
    
    try {
      const client = await clerkClient()
      const user = await client.users.getUser(userId)
      
      logger.debug('Clerk API call successful', {
        userId,
        hasPublicMetadata: !!user.publicMetadata,
        role: user.publicMetadata?.role,
      })
      
      return NextResponse.json({
        authenticated: true,
        userId,
        email: user.emailAddresses[0]?.emailAddress,
        role: user.publicMetadata?.role,
        publicMetadata: user.publicMetadata,
        isAdmin: user.publicMetadata?.role === 'admin',
        isMerchant: user.publicMetadata?.role === 'merchant',
      })
    } catch (clerkError: any) {
      logger.error('Clerk API error', {
        userId,
        error: clerkError.message,
        errorType: clerkError.constructor?.name,
        hasSecretKey: !!process.env.CLERK_SECRET_KEY,
      })
      
      return NextResponse.json({ 
        authenticated: true,
        userId,
        error: 'Failed to fetch user from Clerk',
        clerkError: clerkError.message,
        hasSecretKey: !!process.env.CLERK_SECRET_KEY,
      }, { status: 500 })
    }
  } catch (error: any) {
    logger.error('Auth error', { 
      error: error instanceof Error ? error.message : String(error),
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}

