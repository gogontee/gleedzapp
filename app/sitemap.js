// app/sitemap.js
export default async function sitemap() {
  const baseUrl = 'https://gleedz.com';
  
  // Static pages - CORRECTED: Use only pages that exist
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/events`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    // ONLY include pages that actually exist on your site
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // REMOVED: /create-event, /about, /contact, /privacy, /terms
    // (unless these pages actually exist on your site)
  ];

  // Try to fetch events from Supabase
  let eventUrls = [];
  try {
    // IMPORT supabase correctly
    const { supabase } = await import('@/lib/supabaseClient');
    
    const { data: events, error } = await supabase
      .from('events')
      .select('id, updated_at, name')
      .eq('is_public', true)
      .order('updated_at', { ascending: false })
      .limit(100); // Limit for sitemap size
      
    if (!error && events) {
      eventUrls = events.map(event => ({
        // CORRECTED: Your event route is `/myevent/[id]` not `/event/[id]`
        url: `${baseUrl}/myevent/${event.id}`,
        lastModified: new Date(event.updated_at),
        changeFrequency: 'daily',
        priority: 0.8,
      }));
    }
  } catch (error) {
    console.log('Sitemap: Could not fetch events, using static only');
    // Continue without events - don't fail the sitemap
  }

  return [...staticPages, ...eventUrls];
}