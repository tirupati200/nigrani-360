'use client';

import React, { useState } from 'react';
import { UserSession } from '@/lib/demo-data';
import { LoginView } from '@/components/login-view';
import { CommandCenter } from '@/components/command-center';
import { NGOHeadPortal } from '@/components/ngo-portal';
import { FieldOfficerPortal } from '@/components/field-officer-portal';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export default function Home() {
  const [session, setSession] = useState<UserSession | null>(null);

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setSession(null);
  };

  if (!session) {
    return <LoginView onLogin={(user) => setSession(user)} />;
  }

  if (session.role === 'GOVERNMENT_AUTHORITY') {
    return <CommandCenter session={session} onSignOut={handleSignOut} />;
  }

  if (session.role === 'FIELD_OFFICER') {
    return <FieldOfficerPortal session={session} onSignOut={handleSignOut} />;
  }

  // NGO Head Persona
  return <NGOHeadPortal session={session} onSignOut={handleSignOut} />;
}

