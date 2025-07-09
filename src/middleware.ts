import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { UserJwtPayload } from './lib/auth-utils';


const JWT_SECRET = process.env.JWT_SECRET;
const LOGIN_PATH = '/'; // La página de login es la raíz
const DEFAULT_DASHBOARD_PATH = '/dashboard'; // Ruta por defecto del dashboard

async function verifyToken(token: string): Promise<UserJwtPayload | null> {
  if (!JWT_SECRET) {
    console.error('JWT_SECRET no está configurado en el middleware.');
    return null;
  }
  try {
    const secretKey = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secretKey, {});
    return payload as UserJwtPayload;
  } catch (error) {
    console.log("Error de verificación de token en middleware (puede ser expirado o inválido):", (error as Error).name);
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionTokenCookie = request.cookies.get('session_token');
  const sessionToken = sessionTokenCookie?.value;

  const userPayload = sessionToken ? await verifyToken(sessionToken) : null;
  const isAuthenticated = !!userPayload;

  // Rutas públicas que no requieren autenticación (además del login)
  const publicPaths = [LOGIN_PATH, '/api/auth/logout'];

  // Permitir acceso a rutas de API y assets de Next.js
  if (
    pathname.startsWith('/_next/') || // Esto incluye archivos estáticos de Next.js
    pathname.startsWith('/api/') || // Esto incluye rutas de API
    pathname.startsWith('/static/') || // Esto incluye archivos estáticos
    pathname.includes('.') // Esto incluye archivos estáticos como imágenes, CSS, etc.
  ) {
    return NextResponse.next();
  }

  if (isAuthenticated) {
    if (pathname === LOGIN_PATH) {
      // Podrías querer redirigir basado en el rol aquí si tienes dashboards diferentes;
      return NextResponse.redirect(new URL(DEFAULT_DASHBOARD_PATH, request.url));
    }
    // Permitir acceso a otras rutas si está autenticado
    return NextResponse.next();
  }

  // Si el usuario NO está autenticado Y la ruta NO es pública
  if (!publicPaths.includes(pathname)) {
    // Redirigir a la página de login (raíz)
    // Guardar la URL original para redirigir después del login si se desea
    const redirectUrl = new URL(LOGIN_PATH, request.url);
    if (pathname !== LOGIN_PATH) { 
      redirectUrl.searchParams.set('from', pathname); // Opcional: para redirigir de vuelta
    }
    return NextResponse.redirect(redirectUrl);
  }

  // Si es una ruta pública y no está autenticado, permitir
  return NextResponse.next();
}

export const config = {
  // Ejecutar el middleware en todas las rutas excepto las de API y assets de Next.js
  // Esta es una forma más general, el filtrado más fino se hace dentro del middleware.
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - cualquier cosa en la carpeta public (ej. /images/logo.png)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images).*)',
  ],
};