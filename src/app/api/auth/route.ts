import { NextResponse } from 'next/server';

// Mot de passe - En production, utiliser process.env.DASHBOARD_PASSWORD
const DASHBOARD_PASSWORD = 'kpi2026';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (password === DASHBOARD_PASSWORD) {
      const response = NextResponse.json({ success: true });

      // Définir un cookie d'authentification (expire dans 7 jours)
      response.cookies.set('dashboard_auth', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 jours
      });

      return response;
    }

    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('dashboard_auth');
  return response;
}
