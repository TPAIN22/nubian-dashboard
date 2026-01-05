// File: app/api/upload-auth/route.ts
import { getUploadAuthParams } from "@imagekit/next/server"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

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

        // Get private key from server-side environment variable (not NEXT_PUBLIC_)
        const privateKey = process.env.IMAGEKIT_PRIVATE_KEY
        const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY

        if (!privateKey || !publicKey) {
            return NextResponse.json(
                { error: "ImageKit configuration missing" },
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
            publicKey: publicKey 
        })
    } catch (error) {
        console.error("Error generating upload auth:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}