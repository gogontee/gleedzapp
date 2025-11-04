// app/api/admin/verify-access/route.js
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const session = await getServerSession();
  
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { accessCode, userId } = await request.json();

  try {
    // Verify access code matches gleedz_hero.id
    const { data: hero, error } = await supabase
      .from('gleedz_hero')
      .select('id')
      .eq('id', parseInt(accessCode))
      .single();

    if (error || !hero) {
      // Increment user attempts
      const { data: user } = await supabase
        .from('users')
        .select('attempts')
        .eq('id', userId)
        .single();

      const newAttempts = (user?.attempts || 0) + 1;
      
      await supabase
        .from('users')
        .update({ attempts: newAttempts })
        .eq('id', userId);

      return NextResponse.json({ success: false });
    }

    // Reset attempts on successful access
    await supabase
      .from('users')
      .update({ attempts: 0 })
      .eq('id', userId);

    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}