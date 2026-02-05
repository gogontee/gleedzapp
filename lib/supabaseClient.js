// lib/supabaseClient.js - FIXED VERSION
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!');
  throw new Error('Missing Supabase configuration');
}

// Create singleton instance
let supabaseClient = null;

function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  try {
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
          'x-client-info': 'nextjs'
        }
      },
      db: {
        schema: 'public'
      },
      realtime: {
        params: {
          eventsPerSecond: 5
        }
      }
    });

    if (process.env.NODE_ENV === 'development') {
      supabaseClient.auth.onAuthStateChange((event, session) => {
        console.log('Auth event:', event, session?.user?.id);
      });
    }

    return supabaseClient;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    throw error;
  }
}

// For client-side usage
export const supabase = getSupabaseClient();

// FIXED: safeQuery function without .timeout() method
export const safeQuery = async (queryFn, timeoutMs = 8000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const result = await queryFn();
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      console.error(`Query timeout after ${timeoutMs}ms`);
      throw new Error('Request timeout. Please try again.');
    }
    
    // Handle Supabase-specific errors
    if (error.code === 'PGRST116') {
      console.error('Resource not found:', error.message);
      throw new Error('Resource not found');
    }
    
    throw error;
  }
};

// Helper for batch operations with timeout
export const batchQuery = async (queries, maxConcurrent = 2, timeoutMs = 5000) => {
  const results = [];
  
  for (let i = 0; i < queries.length; i += maxConcurrent) {
    const batch = queries.slice(i, i + maxConcurrent);
    
    // Create timeout promises for each query
    const batchWithTimeouts = batch.map(queryFn => async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      try {
        const result = await queryFn();
        clearTimeout(timeoutId);
        return { status: 'fulfilled', value: result };
      } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
          return { status: 'rejected', reason: new Error(`Query timeout after ${timeoutMs}ms`) };
        }
        
        return { status: 'rejected', reason: error };
      }
    });
    
    const batchResults = await Promise.all(batchWithTimeouts.map(fn => fn()));
    results.push(...batchResults);
  }
  
  return results;
};

// Simple query helper without complex timeout logic
export const simpleQuery = async (queryPromise) => {
  try {
    return await queryPromise;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
};

// Health check function
export const checkSupabaseHealth = async () => {
  try {
    const { data, error } = await supabase.from('events').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('Supabase health check failed:', error);
      return { healthy: false, error: error.message };
    }
    
    return { healthy: true, message: 'Supabase connection is healthy' };
  } catch (error) {
    console.error('Supabase health check failed:', error);
    return { healthy: false, error: error.message };
  }
};