/**
 * Environment variable validation for Next.js frontend
 * Validates required environment variables at build time and runtime
 */

const requiredEnvVars = {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
};

// Optional environment variables (used only in specific routes)
const optionalEnvVars = {
  NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
  IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY,
};

/**
 * Validate that all required environment variables are present
 * @throws {Error} If any required environment variable is missing
 */
export const validateEnv = () => {
  // Only validate server-side environment variables in Node.js environment
  if (typeof window !== 'undefined') {
    return; // Skip validation on client side
  }

  const missing: string[] = [];
  const serverOnlyVars = ['CLERK_SECRET_KEY', 'RESEND_API_KEY'];

  for (const [key, value] of Object.entries(requiredEnvVars)) {
    // Only check server-side vars in server environment
    if (serverOnlyVars.includes(key) && !value) {
      missing.push(key);
    }
    
    // Check public vars everywhere
    if (!serverOnlyVars.includes(key) && (!value || value.trim() === '')) {
      missing.push(key);
    }
  }

  // Fail-fast validation: If ImageKit public key is set, private key is REQUIRED
  // This ensures that if ImageKit is configured, both keys must be present
  // The /api/upload-auth endpoint requires both keys to function
  if (optionalEnvVars.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY && !optionalEnvVars.IMAGEKIT_PRIVATE_KEY) {
    missing.push('IMAGEKIT_PRIVATE_KEY');
    console.error('IMAGEKIT_PRIVATE_KEY is required when NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY is set. The /api/upload-auth endpoint requires both keys.');
  }

  // Also validate that if private key is set, public key should be set (for consistency)
  if (optionalEnvVars.IMAGEKIT_PRIVATE_KEY && !optionalEnvVars.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY) {
    missing.push('NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY');
    console.error('NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY is required when IMAGEKIT_PRIVATE_KEY is set. Both keys must be configured together.');
  }

  if (missing.length > 0) {
    const errorMessage = `Missing required environment variables: ${missing.join(', ')}\nPlease check your .env.local file and ensure all required variables are set.`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
};

// Validate on module load (server-side only)
if (typeof window === 'undefined') {
  try {
    validateEnv();
  } catch (error) {
    // Log error but don't crash in development
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    console.warn('Environment validation warning:', error);
  }
}

