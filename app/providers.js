// app/providers.js - OPTIMIZED VERSION
"use client";

import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { supabase } from "../lib/supabaseClient";
import { useState, useEffect } from 'react';

export default function Providers({ children, session }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Prevent hydration mismatch by not rendering until client-side
  if (!isClient) {
    return <>{children}</>;
  }

  return (
    <SessionContextProvider 
      supabaseClient={supabase}
      initialSession={session}
      // Optional: Add these for better performance
      initialSessionTimeout={30} // 30 seconds timeout for initial session
    >
      {children}
    </SessionContextProvider>
  );
}