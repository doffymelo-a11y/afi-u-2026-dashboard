import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Mot de passe simple pour la protection
// En production, utiliser une variable d'environnement : process.env.DASHBOARD_PASSWORD
const DASHBOARD_PASSWORD = 'kpi2026';

export function middleware(request: NextRequest) {
  // Vérifier si l'utilisateur est déjà authentifié via un cookie
  const authCookie = request.cookies.get('dashboard_auth');

  // Si c'est une requête vers la page de login, laisser passer
  if (request.nextUrl.pathname === '/login') {
    // Si déjà authentifié, rediriger vers le dashboard
    if (authCookie?.value === 'authenticated') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Si c'est une requête API de login, laisser passer
  if (request.nextUrl.pathname === '/api/auth') {
    return NextResponse.next();
  }

  // Vérifier l'authentification pour toutes les autres routes
  if (authCookie?.value !== 'authenticated') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
