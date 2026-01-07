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

        // Check for required configuration
        const missingKeys: string[] = []
        const warnings: string[] = []
        
        if (!privateKey) {
            const isProduction = process.env.NODE_ENV === 'production'
            missingKeys.push(
                isProduction 
                    ? "IMAGEKIT_PRIVATE_KEY (required for production - do NOT use NEXT_PUBLIC_ prefix)" 
                    : "IMAGEKIT_PRIVATE_KEY (or NEXT_PUBLIC_IMAGEKIT_PRIVATE_KEY for dev only)"
            )
        }
        if (!publicKey) {
            missingKeys.push("NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY")
        }
        if (!urlEndpoint) {
            warnings.push("NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT (recommended but optional)")
        }
        
        if (missingKeys.length > 0) {
            const isProduction = process.env.NODE_ENV === 'production'
            const errorMessage = isProduction
                ? `ImageKit configuration missing in production. Missing: ${missingKeys.join(", ")}. Please set these environment variables in your production environment (e.g., Vercel, Render, etc.). ⚠️ For production, use IMAGEKIT_PRIVATE_KEY (without NEXT_PUBLIC_ prefix) for security.`
                : `ImageKit configuration missing. Missing: ${missingKeys.join(", ")}. Please check your .env.local file.`
            
            logger.error("ImageKit configuration missing", { 
                hasPrivateKey: !!privateKey, 
                hasPublicKey: !!publicKey,
                hasUrlEndpoint: !!urlEndpoint,
                missingKeys,
                warnings,
                isProduction,
                nodeEnv: process.env.NODE_ENV
            })
            
            return NextResponse.json(
                { 
                    error: "ImageKit configuration missing",
                    message: errorMessage,
                    missingKeys,
                    warnings: warnings.length > 0 ? warnings : undefined,
                    help: isProduction 
                        ? "To fix this, add the following environment variables in your production hosting platform (Vercel, Render, etc.):\n" +
                          "1. IMAGEKIT_PRIVATE_KEY=your_private_key (server-side only, no NEXT_PUBLIC_ prefix)\n" +
                          "2. NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=your_public_key\n" +
                          "3. NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id (recommended)"
                        : "To fix this, add the following to your .env.local file:\n" +
                          "1. IMAGEKIT_PRIVATE_KEY=your_private_key (or NEXT_PUBLIC_IMAGEKIT_PRIVATE_KEY for dev)\n" +
                          "2. NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=your_public_key\n" +
                          "3. NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id"
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