'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'

const links = [
  { href: '/admin',            label: 'Dashboard',     icon: '📊' },
  { href: '/admin/pedidos',    label: 'Pedidos',       icon: '📦' },
  { href: '/admin/cartoes',    label: 'Cartões',       icon: '💳' },
  { href: '/admin/usuarios',   label: 'Usuários',      icon: '👥' },
  { href: '/admin/produtos',   label: 'Produtos',      icon: '🛍️' },
  { href: '/admin/categorias', label: 'Categorias',    icon: '🗂️' },
  { href: '/admin/avaliacoes', label: 'Avaliações',    icon: '⭐' },
  { href: '/admin/config',     label: 'Configurações', icon: '⚙️' },
]

export function AdminNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Fecha o menu ao trocar de página no mobile
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Fecha ao clicar fora (overlay)
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const sidebar = document.getElementById('admin-sidebar')
      if (sidebar && !sidebar.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const navContent = (
    <aside
      id="admin-sidebar"
      className="w-64 min-h-screen bg-gray-900 text-white flex flex-col"
    >
      {/* Logo / título */}
      <div className="px-6 py-5 border-b border-gray-700 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest">Painel</p>
          <p className="text-lg font-bold mt-1">Admin</p>
        </div>
        {/* Botão fechar — só no mobile */}
        <button
          onClick={() => setOpen(false)}
          className="md:hidden text-gray-400 hover:text-white text-2xl leading-none"
          aria-label="Fechar menu"
        >
          ✕
        </button>
      </div>

      {/* Links de navegação */}
      <nav className="flex-1 py-4">
        <ul className="space-y-1 px-3">
          {links.map(({ href, label, icon }) => {
            const active =
              href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <span className="text-base">{icon}</span>
                  {label}
                  {href === '/admin/cartoes' && (
                    <span className="ml-auto bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full font-semibold">
                      $
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Botão sair */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <span className="text-base">🚪</span>
          Sair
        </button>
      </div>
    </aside>
  )

  return (
    <>
      {/* ── Desktop: sidebar fixa ── */}
      <div className="hidden md:flex">
        {navContent}
      </div>

      {/* ── Mobile: botão hamburguer + drawer ── */}
      <div className="md:hidden">
        {/* Barra superior mobile */}
        <div className="fixed top-0 left-0 right-0 z-40 flex items-center gap-3 bg-gray-900 text-white px-4 py-3 shadow-lg">
          <button
            onClick={() => setOpen(true)}
            aria-label="Abrir menu"
            className="text-2xl leading-none"
          >
            ☰
          </button>
          <span className="font-bold text-base">Admin</span>
        </div>

        {/* Espaço para não sobrepor o conteúdo */}
        <div className="h-14" />

        {/* Overlay escuro */}
        {open && (
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setOpen(false)} />
        )}

        {/* Drawer deslizante */}
        <div
          className={`fixed top-0 left-0 h-full z-50 transition-transform duration-300 ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {navContent}
        </div>
      </div>
    </>
  )
}
