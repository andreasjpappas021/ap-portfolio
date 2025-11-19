import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Log an audit event to the database
 * This creates a record in the audit_events table for tracking
 */
export async function logAuditEvent(
  userId: string,
  eventName: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = createAdminClient()
    await supabase.from('audit_events').insert({
      user_id: userId,
      event_name: eventName,
      metadata: metadata || {},
    })
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[Audit] Error logging event:', error)
    }
    // Don't throw - audit logging shouldn't break the app
  }
}


