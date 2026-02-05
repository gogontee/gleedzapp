// lib/supabaseServer.js - UPDATED WITH PERFORMANCE OPTIMIZATIONS
import { cookies } from "next/headers";
import { createServerComponentClient, createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

// For Server Components (App Router)
export async function createSupabaseServerClient() {
  try {
    const cookieStore = cookies();
    
    return createServerComponentClient({
      cookies: () => cookieStore
    }, {
      options: {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
        global: {
          headers: {
            'x-application-name': 'gleedz-server',
            'x-client-info': 'nextjs-server-component',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          },
          fetch: async (url, options = {}) => {
            // Add timeout to prevent hanging requests
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
            
            try {
              const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                cache: 'no-store',
                next: { revalidate: 0 }
              });
              
              // Log slow requests
              if (process.env.NODE_ENV === 'development') {
                const startTime = Date.now();
                response.clone().text().then(() => {
                  const duration = Date.now() - startTime;
                  if (duration > 1000) {
                    console.warn(`Slow Supabase request: ${url} took ${duration}ms`);
                  }
                });
              }
              
              return response;
            } finally {
              clearTimeout(timeoutId);
            }
          }
        }
      }
    });
  } catch (error) {
    console.error('Failed to create Supabase server client:', error);
    throw new Error('Supabase server client initialization failed');
  }
}

// For Route Handlers (API Routes)
export function createSupabaseRouteHandler() {
  try {
    const cookieStore = cookies();
    
    return createRouteHandlerClient({
      cookies: () => cookieStore
    }, {
      options: {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
        global: {
          headers: {
            'x-application-name': 'gleedz-api',
            'x-client-info': 'nextjs-route-handler',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          },
          fetch: async (url, options = {}) => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for API routes
            
            try {
              return await fetch(url, {
                ...options,
                signal: controller.signal,
                cache: 'no-store',
                next: { revalidate: 0 }
              });
            } finally {
              clearTimeout(timeoutId);
            }
          }
        }
      }
    });
  } catch (error) {
    console.error('Failed to create Supabase route handler client:', error);
    throw new Error('Supabase route handler client initialization failed');
  }
}

// For Server Actions
export async function createSupabaseServerActionClient() {
  try {
    // 'use server' directive should be in the calling component
    const cookieStore = cookies();
    
    return createServerComponentClient({
      cookies: () => cookieStore
    }, {
      options: {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
        global: {
          headers: {
            'x-application-name': 'gleedz-server-action',
            'x-client-info': 'nextjs-server-action',
            'Cache-Control': 'no-cache'
          },
          fetch: async (url, options = {}) => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for server actions
            
            try {
              return await fetch(url, {
                ...options,
                signal: controller.signal,
                cache: 'no-store'
              });
            } finally {
              clearTimeout(timeoutId);
            }
          }
        }
      }
    });
  } catch (error) {
    console.error('Failed to create Supabase server action client:', error);
    throw new Error('Supabase server action client initialization failed');
  }
}

// Helper function for safe server-side queries
export async function safeServerQuery(queryFn, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const startTime = Date.now();
    const result = await queryFn();
    const duration = Date.now() - startTime;
    
    if (duration > 2000 && process.env.NODE_ENV === 'development') {
      console.warn(`Slow server query: ${duration}ms`);
    }
    
    return result;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`Server query timeout after ${timeoutMs}ms`);
      throw new Error('Database request timeout. Please try again.');
    }
    
    console.error('Server query error:', error);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Helper for batch operations in server components
export async function batchServerQueries(queries, maxConcurrent = 2) {
  const results = [];
  for (let i = 0; i < queries.length; i += maxConcurrent) {
    const batch = queries.slice(i, i + maxConcurrent);
    const batchResults = await Promise.allSettled(
      batch.map(q => safeServerQuery(q, 5000))
    );
    results.push(...batchResults);
  }
  return results;
}

// Legacy export for backward compatibility
export const supabaseApi = createSupabaseRouteHandler;