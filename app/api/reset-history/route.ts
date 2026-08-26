import { NextResponse } from 'next/server';
import { ref, remove } from 'firebase/database';
import { database } from '@/lib/firebase/client';

export async function POST() {
  try {
    if (!database) {
      return NextResponse.json(
        { error: 'Firebase database not initialized' },
        { status: 500 }
      );
    }

    const historyRef = ref(database, 'History');
    await remove(historyRef);

    return NextResponse.json({ 
      success: true, 
      message: 'History cleared successfully' 
    });
  } catch (error) {
    console.error('Reset history error:', error);
    return NextResponse.json(
      { error: 'Failed to reset history' },
      { status: 500 }
    );
  }
}