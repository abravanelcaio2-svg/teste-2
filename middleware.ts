import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const role = req.nextauth.token?.role

    const isAdminRoute =
      pathname.startsWith('/admin') ||
      pathname.startsWith('/api/admin')

    // Bloqueia acesso admin para quem não tem role ADMIN
    if (isAdminRoute && role !== 'ADMIN') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { erro: 'Acesso restrito a administradores.' },
          { status: 403 }
        )
      }
      return NextResponse.redirect(new URL('/login', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      // Define quais rotas exigem autenticação antes de entrar no middleware
      authorized({ token, req }) {
        const { pathname } = req.nextUrl

        // Rotas públicas — qualquer um pode acessar
        const publicPaths = [
          '/api/produtos',
          '/api/categorias',
          '/api/frete',
          '/api/cep',
          '/api/config',
          '/api/webhook',
          '/api/auth',
          '/login',
        ]
        if (publicPaths.some((p) => pathname.startsWith(p))) return true

        // Demais rotas protegidas exigem token válido
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/admin/:path*',
    '/minha-conta/:path*',
    '/checkout/:path*',
    '/api/admin/:path*',
    '/api/pedidos/:path*',
    '/api/pagamento/:path*',
    '/api/usuario/:path*',
  ],
}
