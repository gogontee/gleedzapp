import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

// Use this in server components (no "use client")
export const supabaseServer = () => {
  return createServerComponentClient({ cookies });
};
