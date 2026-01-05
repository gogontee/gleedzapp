export default async function sitemap() {
  const baseUrl = 'https://gleedz.com';
  
  // Fetch all events from your database
  const events = await fetchEvents(); // Implement this function
  
  // Create event URLs
  const eventUrls = events.map(event => ({
    url: `${baseUrl}/event/${event.slug || event.id}`,
    lastModified: new Date(event.updated_at),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

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
      url: `${baseUrl}/create-event`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.4,
    },
  ];

  return [...staticPages, ...eventUrls];
}

// Function to fetch events from your database
async function fetchEvents() {
  // Replace this with your actual database query
  const { data: events, error } = await supabase
    .from('events')
    .select('id, slug, updated_at, name')
    .eq('is_public', true)
    .order('updated_at', { ascending: false });
    
  return events || [];
}