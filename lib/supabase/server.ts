import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export function isSupabaseAdminConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
    serviceRoleKey &&
    !supabaseUrl.includes('your-project-id') &&
    !serviceRoleKey.includes('your-service-role-secret-key-placeholder') &&
    !serviceRoleKey.includes('your-supabase-service-role-key') &&
    serviceRoleKey.trim().length > 20
  );
}

/**
 * Server-side Admin Client (Uses service_role secret key)
 * WARNING: NEVER call this function from client components or leak to browser.
 * Used exclusively for:
 * 1. Pre-provisioning Government Authority root accounts.
 * 2. Creating & activating authorized NGO Head accounts upon government project sanctioning.
 */
export function getSupabaseAdminClient(): SupabaseClient<Database> | null {
  if (!isSupabaseAdminConfigured()) {
    return null;
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
