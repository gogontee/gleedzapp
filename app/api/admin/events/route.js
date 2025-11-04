// app/api/admin/events/route.js
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { data: events, error } = await supabase
      .from('events')
      .select(`
        *,
        publishers!inner (
          name,
          phone
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formattedEvents = events.map(event => ({
      ...event,
      publisher_name: event.publishers.name,
      publisher_phone: event.publishers.phone
    }));

    return NextResponse.json({ events: formattedEvents });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch events' }, 
      { status: 500 }
    );
  }
}