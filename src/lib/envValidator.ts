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
 * @param options - Validation options
 * @param options.throwOnError - Whether to throw an error if validation fails (default: true)
 * @param options.skipBuildTime - Whether to skip validation during build (default: true)
 * @throws {Error} If any required environment variable is missing and throwOnError is true
 */
export const validateEnv = (options: { throwOnError?: boolean; skipBuildTime?: boolean } = {}) => {
  const { throwOnError = true, skipBuildTime = true } = options;
  
  // Only validate server-side environment variables in Node.js environment
  if (typeof window !== 'undefined') {
    return; // Skip validation on client side
  }

  // Skip validation during build time if requested
  // This allows builds to succeed even if env vars are set later by deployment platform
  if (skipBuildTime) {
    const isBuildTime = 
      process.env.NEXT_PHASE?.includes('build') ||
      (process.env.NODE_ENV === 'production' && !process.env.VERCEL && !process.env.RENDER && !process.env.NEXT_RUNTIME);
    
    if (isBuildTime) {
      console.warn('⚠️  Environment validation skipped during build. Variables will be validated at runtime.');
      return;
    }
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

  // ImageKit validation: Warn if keys are partially configured (but don't fail build)
  // ImageKit is optional - if not fully configured, image upload will fail at runtime
  // This allows the build to succeed even if ImageKit is not configured
  if (optionalEnvVars.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY && !optionalEnvVars.IMAGEKIT_PRIVATE_KEY) {
    console.warn('⚠️  Warning: NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY is set but IMAGEKIT_PRIVATE_KEY is missing. Image upload functionality will not work. Set both keys or remove NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY.');
  }

  // Also warn if private key is set but public key is not
  if (optionalEnvVars.IMAGEKIT_PRIVATE_KEY && !optionalEnvVars.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY) {
    console.warn('⚠️  Warning: IMAGEKIT_PRIVATE_KEY is set but NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY is missing. Image upload functionality will not work. Set both keys or remove IMAGEKIT_PRIVATE_KEY.');
  }

  if (missing.length > 0) {
    const errorMessage = `Missing required environment variables: ${missing.join(', ')}\nPlease check your .env.local file and ensure all required variables are set.`;
    console.error(errorMessage);
    
    if (throwOnError) {
      throw new Error(errorMessage);
    }
  }
};

// Don't validate at module load time - this runs during build
// Validation should happen at runtime only (in layout.tsx or API routes)
// This allows the build to succeed even if env vars aren't set during build
// (they'll be set at runtime by the deployment platform)

