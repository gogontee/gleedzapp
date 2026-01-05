// app/sitemap.js - WITH DYNAMIC EVENTS (if you fix the path)
export default async function sitemap() {
  const baseUrl = 'https://gleedz.com';
  
  // Static pages
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
  ];

  // Try to fetch events - COMMENT OUT if import fails
  let eventUrls = [];
  try {
    // UPDATE THIS PATH to match your actual file location
    const { supabase } = await import('../lib/supabaseClient'); // ← CHANGE THIS
    
    const { data: events, error } = await supabase
      .from('events')
      .select('id, updated_at, name')
      .eq('is_public', true)
      .limit(50);
      
    if (!error && events) {
      eventUrls = events.map(event => ({
        url: `${baseUrl}/myevent/${event.id}`,
        lastModified: new Date(event.updated_at),
        changeFrequency: 'daily',
        priority: 0.8,
      }));
    }
  } catch (error) {
    console.log('Sitemap: Using static pages only');
    // Return static pages without events
  }

  return [...staticPages, ...eventUrls];
}