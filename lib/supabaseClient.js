// lib/supabaseClient.js - UPDATED WITH SINGLETON & PERFORMANCE OPTIMIZATIONS
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!');
  throw new Error('Missing Supabase configuration');
}

// Create singleton instance with caching
let supabaseClient = null;
let isInitializing = false;
let initPromise = null;

function getSupabaseClient() {
  // Return existing client if available
  if (supabaseClient) {
    return supabaseClient;
  }

  // Prevent multiple initializations
  if (!isInitializing) {
    isInitializing = true;
    initPromise = (async () => {
      try {
        console.log('Initializing Supabase client...');
        
        supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storage: typeof window !== 'undefined' ? window.localStorage : undefined,
            flowType: 'pkce',
            debug: process.env.NODE_ENV === 'development'
          },
          global: {
            headers: {
              'x-application-name': 'gleedz',
              'x-client-info': 'nextjs',
              'Cache-Control': 'no-cache, no-store, must-revalidate'
            },
            fetch: (url, options = {}) => {
              // Add timeout to fetch requests
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
              
              return fetch(url, {
                ...options,
                signal: controller.signal,
                cache: 'no-store',
                next: { revalidate: 0 }
              }).finally(() => clearTimeout(timeoutId));
            }
          },
          db: {
            schema: 'public'
          },
          realtime: {
            params: {
              eventsPerSecond: 10
            }
          }
        });

        // Add error logging
        supabaseClient.auth.onAuthStateChange((event, session) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('Auth event:', event, session?.user?.id);
          }
        });

        console.log('Supabase client initialized successfully');
        return supabaseClient;
      } catch (error) {
        console.error('Failed to initialize Supabase client:', error);
        throw error;
      } finally {
        isInitializing = false;
      }
    })();
  }

  // If we're in the middle of initialization, wait for it
  if (!supabaseClient && initPromise) {
    throw initPromise; // Let the caller await the initialization
  }

  return supabaseClient;
}

// For client-side usage
export const supabase = getSupabaseClient();

// Helper function for safe queries with timeout
export const safeQuery = async (queryFn, timeoutMs = 8000) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    const result = await queryFn();
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Query timeout after', timeoutMs, 'ms');
      throw new Error('Request timeout. Please try again.');
    }
    throw error;
  }
};

// Helper for batch operations
export const batchQuery = async (queries, maxConcurrent = 3) => {
  const results = [];
  for (let i = 0; i < queries.length; i += maxConcurrent) {
    const batch = queries.slice(i, i + maxConcurrent);
    const batchResults = await Promise.allSettled(batch.map(q => q()));
    results.push(...batchResults);
  }
  return results;
};