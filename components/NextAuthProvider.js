// components/NextAuthProvider.js
"use client"; // This must be a client component

import { SessionProvider } from "next-auth/react";

export default function NextAuthProvider({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}