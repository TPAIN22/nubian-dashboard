// File: app/api/upload-auth/route.ts
import { getUploadAuthParams } from "@imagekit/next/server"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import logger from "@/lib/logger"

export async function GET() {
    try {
        // Authenticate the user
        const { userId } = await auth()
        
        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        // Get ImageKit configuration from environment variables
        // SECURITY: Always prefer IMAGEKIT_PRIVATE_KEY (without NEXT_PUBLIC_) for production
        // NEXT_PUBLIC_ prefix exposes the key to client-side, which is a security risk
        // Check secure version first, fallback to NEXT_PUBLIC_ only for development compatibility
        const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || 
            (process.env.NODE_ENV === 'development' ? process.env.NEXT_PUBLIC_IMAGEKIT_PRIVATE_KEY : undefined)
        const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY
        const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT

        if (!privateKey || !publicKey) {
            const missingKeys = []
            if (!privateKey) {
                const isProduction = process.env.NODE_ENV === 'production'
                missingKeys.push(
                    isProduction 
                        ? "IMAGEKIT_PRIVATE_KEY (required for production - do NOT use NEXT_PUBLIC_ prefix)" 
                        : "IMAGEKIT_PRIVATE_KEY (or NEXT_PUBLIC_IMAGEKIT_PRIVATE_KEY for dev only)"
                )
            }
            if (!publicKey) missingKeys.push("NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY")
            
            logger.error("ImageKit configuration missing", { 
                hasPrivateKey: !!privateKey, 
                hasPublicKey: !!publicKey,
                hasUrlEndpoint: !!urlEndpoint,
                missingKeys,
                isProduction: process.env.NODE_ENV === 'production'
            })
            return NextResponse.json(
                { 
                    error: "ImageKit configuration missing",
                    message: `Missing environment variable(s): ${missingKeys.join(", ")}. ${process.env.NODE_ENV === 'production' ? '⚠️ For production, use IMAGEKIT_PRIVATE_KEY (without NEXT_PUBLIC_) for security.' : ''}`,
                    missingKeys
                },
                { status: 500 }
            )
        }

        const { token, expire, signature } = getUploadAuthParams({
            privateKey: privateKey,
            publicKey: publicKey,
            // expire: 30 * 60, // Optional, controls the expiry time of the token in seconds, maximum 1 hour in the future
            // token: "random-token", // Optional, a unique token for request
        })

        return NextResponse.json({ 
            token, 
            expire, 
            signature, 
            publicKey: publicKey,
            urlEndpoint: urlEndpoint || undefined // Include URL endpoint if available
        })
    } catch (error) {
        logger.error("Error generating upload auth", { 
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        })
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}