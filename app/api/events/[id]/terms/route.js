// app/api/events/[id]/terms/route.js
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function PATCH(request, { params }) {
  try {
    const eventId = params.id;
    const supabase = createRouteHandlerClient({ cookies });
    
    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }
    
    // 2. Get request body
    const { terms_of_use } = await request.json();
    if (terms_of_use === undefined) {
      return NextResponse.json(
        { error: 'Missing terms_of_use field' },
        { status: 400 }
      );
    }
    
    // 3. Verify event exists and user is owner
    const { data: event, error: fetchError } = await supabase
      .from('events')
      .select('user_id')
      .eq('id', eventId)
      .single();
    
    if (fetchError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }
    
    // CRITICAL: Check if current user is the event owner
    if (event.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You are not the owner of this event' },
        { status: 403 }
      );
    }
    
    // 4. Update the terms in database as JSONB
    const { error: updateError } = await supabase
      .from('events')
      .update({ 
        terms_of_use: terms_of_use,
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId);
    
    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update database' },
        { status: 500 }
      );
    }
    
    // 5. Return success
    return NextResponse.json({ 
      success: true, 
      message: 'Terms updated successfully' 
    });
    
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}