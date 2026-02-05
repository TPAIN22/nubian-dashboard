/**
 * Server-side Session Cache for Import Operations
 * Short-lived in-memory cache for parsed import data
 */

import { ImportSession, ParseResult, SESSION_EXPIRY_MS } from './types';
import { v4 as uuidv4 } from 'uuid';
import logger from '../logger';

// In-memory session store
const sessionStore = new Map<string, ImportSession>();

// Cleanup interval (run every 5 minutes)
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let cleanupInterval: NodeJS.Timeout | null = null;

/**
 * Initialize cleanup interval
 */
function ensureCleanupRunning(): void {
  if (cleanupInterval) return;
  
  cleanupInterval = setInterval(() => {
    cleanupExpiredSessions();
  }, CLEANUP_INTERVAL_MS);
  
  // Don't prevent process from exiting
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }
}

/**
 * Create a new import session
 */
export function createSession(
  merchantId: string,
  userId: string,
  parseResult: ParseResult,
  zipBuffer?: Buffer
): ImportSession {
  ensureCleanupRunning();
  
  const now = new Date();
  const session: ImportSession = {
    id: uuidv4(),
    merchantId,
    userId,
    createdAt: now,
    expiresAt: new Date(now.getTime() + SESSION_EXPIRY_MS),
    parseResult,
    zipBuffer,
    status: 'pending'
  };
  
  sessionStore.set(session.id, session);
  
  logger.info('Created import session', {
    sessionId: session.id,
    merchantId,
    userId,
    totalRows: parseResult.totalRows,
    validRows: parseResult.validRows,
    mode: parseResult.mode,
    hasZip: !!zipBuffer
  });
  
  return session;
}

/**
 * Get a session by ID
 */
export function getSession(sessionId: string): ImportSession | null {
  const session = sessionStore.get(sessionId);
  
  if (!session) {
    return null;
  }
  
  // Check if expired
  if (new Date() > session.expiresAt) {
    sessionStore.delete(sessionId);
    logger.debug('Session expired', { sessionId });
    return null;
  }
  
  return session;
}

/**
 * Update session status
 */
export function updateSessionStatus(
  sessionId: string,
  status: ImportSession['status']
): boolean {
  const session = sessionStore.get(sessionId);
  
  if (!session) {
    return false;
  }
  
  session.status = status;
  return true;
}

/**
 * Delete a session
 */
export function deleteSession(sessionId: string): boolean {
  const existed = sessionStore.has(sessionId);
  sessionStore.delete(sessionId);
  
  if (existed) {
    logger.debug('Deleted import session', { sessionId });
  }
  
  return existed;
}

/**
 * Clean up expired sessions
 */
export function cleanupExpiredSessions(): number {
  const now = new Date();
  let cleaned = 0;
  
  for (const [id, session] of sessionStore.entries()) {
    if (now > session.expiresAt) {
      sessionStore.delete(id);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    logger.info('Cleaned up expired import sessions', { count: cleaned });
  }
  
  return cleaned;
}

/**
 * Get session count (for monitoring)
 */
export function getSessionCount(): number {
  return sessionStore.size;
}

/**
 * Clear all sessions (for testing)
 */
export function clearAllSessions(): void {
  sessionStore.clear();
  logger.debug('Cleared all import sessions');
}

/**
 * Validate session access
 */
export function validateSessionAccess(
  session: ImportSession,
  userId: string,
  userRole: string | undefined
): { allowed: boolean; error?: string } {
  // Admin can access any session
  if (userRole === 'admin') {
    return { allowed: true };
  }
  
  // Owner can access their own session
  if (session.userId === userId) {
    return { allowed: true };
  }
  
  return { allowed: false, error: 'Cannot access another user\'s import session' };
}
