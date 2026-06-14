'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useCarrinho } from '@/contexts/CarrinhoContext'
import Image from 'next/image'
import ModalCadastroLogin from '@/components/loja/ModalCadastroLogin'

const ALL_CATEGORIES = [
  { name: 'Ar e Ventilação',         slug: 'ar-e-ventilacao' },
  { name: 'Beleza e Saúde',          slug: 'beleza-e-saude' },
  { name: 'Celulares e Smartphones', slug: 'celulares-e-smartphones' },
  { name: 'Colchões e Acessórios',   slug: 'colchoes-e-acessorios' },
  { name: 'Eletrônicos',             slug: 'eletronicos' },
  { name: 'Eletrodomésticos',        slug: 'eletrodomesticos' },
  { name: 'Eletroportáteis',         slug: 'eletroportateis' },
  { name: 'Esporte e Lazer',         slug: 'esporte-e-lazer' },
  { name: 'Ferramentas',             slug: 'ferramentas' },
  { name: 'Fogões',                  slug: 'fogoes' },
  { name: 'Informática',             slug: 'informatica' },
  { name: 'Infantil',                slug: 'infantil' },
  { name: 'Máquinas de Lavar',       slug: 'maquinas-de-lavar' },
  { name: 'Móveis',                  slug: 'moveis' },
  { name: 'Notebooks',               slug: 'notebooks' },
  { name: 'Smartphones',             slug: 'smartphones' },
  { name: 'Televisores',             slug: 'tvs-e-video' },
  { name: 'Utilidade Doméstica',     slug: 'utilidade-domestica' },
]

const NAV_ITEMS = [
  { label: 'Celulares',        slug: 'celulares-e-smartphones' },
  { label: 'Eletrodomésticos', slug: 'eletrodomesticos' },
  { label: "TV's",             slug: 'tvs-e-video' },
  { label: 'Ar e Ventilação',  slug: 'ar-e-ventilacao' },
  { label: 'Eletroportáteis',  slug: 'eletroportateis' },
  { label: 'Móveis',           slug: 'moveis' },
  { label: 'Informática',      slug: 'informatica' },
  { label: 'Colchões',         slug: 'colchoes-e-acessorios' },
  { label: 'Esporte e Lazer',  slug: 'esporte-e-lazer' },
]

function GazinLogo({ logoUrl }: { logoUrl?: string }) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} alt="Logo" style={{ height: '40px', width: 'auto', objectFit: 'contain', background: 'transparent', display: 'block' }} />
  }
  return (
    <svg viewBox="0 0 973 327" width="120" height="40" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad1" gradientUnits="userSpaceOnUse" x1="164" x2="804" y1="-49" y2="320">
          <stop offset="0" stopColor="#00983a"/>
          <stop offset=".05" stopColor="#1c9e35"/>
          <stop offset=".25" stopColor="#79b224"/>
          <stop offset=".57" stopColor="#d4c515"/>
          <stop offset="1" stopColor="#f2cc10"/>
        </linearGradient>
      </defs>
      {/* shadow path removido - causava fundo atrás do logo */}
      <path d="M4.8,227.4L122.3,23.9C131.3,8.3,149.9,0,167.4,0h776c24.3,0,31,27,20.3,44.4l-118,203.5c-10.5,15.6-26.3,23.9-45.1,23.9H27.6C3.4,272,-6.8,245.8,4.8,227.4" fill="url(#grad1)" fillRule="evenodd"/>
      <path d="M170.7,169.9c2.1.9,4.4,1.3,6.7,1.3h94.3l53.7-88.3h-72.5l-13.7,22.4,21.9-.2-25.7,41.5s-17.5-.3-18.8-.2c-5-.2-10-.8-14.9-1.6-16.8-4.4-21-12.9-22.3-20-2.4-12.7,5-23.3,5-23.3,10.1-16.2,27.5-26.8,32.2-29.6,17.9-10.6,36.4-12.1,41.9-12.9,5.1-.6,10.3-.9,15.5-.9h374.6l13.6-22.5H489.4c-36.3,2-53.7,4.9-57.2,5.4C398,82,373,94.8,368.7,97.1c-40.5,21.8-40.5,50.1-40.5,54.7-.6,33.2,30.3,48.4,44.4,53.7L370.5,228H64.3l-13.9,23H316.2c-5.9-4-17.5-10.6-23.4-23Z" fill="#fff" fillRule="evenodd"/>
      <polygon fill="#fff" fillRule="evenodd" points="579.8 171.2 595.5 145.3 537.6 145.3 642.7 67.6 510 67.6 495.5 92.5 553.1 92.5 447.1 171.2 579.8 171.2"/>
      <polygon fill="#fff" fillRule="evenodd" points="744.3 35.6 685.6 35.6 671.9 58 730.6 58 744.3 35.6"/>
      <polygon fill="#fff" fillRule="evenodd" points="662.5 171.2 725 67.6 666.1 67.6 603.8 171.2 662.5 171.2"/>
      <polygon fill="#fff" fillRule="evenodd" points="768.7 35.6 755 58.1 899.8 58.1 913.4 35.6 768.7 35.6"/>
      <polygon fill="#fff" fillRule="evenodd" points="818 102.1 807.6 67.5 749.3 67.5 686.4 171.2 737.6 171.2 779.5 102 793.3 142.8 775.9 171.4 831 171.4 894 67.5 839 67.5 818 102.1"/>
    </svg>
  )
}

export default function Header({ logoUrl }: { logoUrl?: string }) {
  const router = useRouter()
  const { data: session } = useSession()
  const [modalAuth, setModalAuth] = useState(false)
  const { totalItens } = useCarrinho()
  const [busca, setBusca] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [cepInput, setCepInput] = useState('')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleBusca(e: React.FormEvent) {
    e.preventDefault()
    if (busca.trim()) router.push(`/busca?q=${encodeURIComponent(busca.trim())}`)
  }

  return (
    <>
      {/* Sidebar overlay */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* Sidebar */}
      <div className={`sidebar-menu ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-menu-header">
          <span>Categorias</span>
          <button onClick={() => setSidebarOpen(false)}>✕</button>
        </div>
        <ul>
          {ALL_CATEGORIES.map((cat) => (
            <li key={cat.slug}>
              <Link href={`/categoria/${cat.slug}`} className="sidebar-cat" onClick={() => setSidebarOpen(false)}>
                {cat.name}
                <svg width="6" height="10" fill="none" viewBox="0 0 6 10">
                  <path d="M1 9L5 5L1 1" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"/>
                </svg>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* ══════════════ HEADER ══════════════ */}
      <header className="gazin-header">
        <div className="header-inner">

          {/* ── MOBILE layout ── */}
          <div className="md:hidden w-full flex flex-col gap-2">
            {/* Linha 1: hamburger | logo (esquerda) | ícones (direita) */}
            <div className="flex items-center w-full gap-3">
              <button aria-label="Menu" onClick={() => setSidebarOpen(true)} className="text-white p-1 flex-shrink-0">
                <svg width="24" height="18" fill="none" viewBox="0 0 25 18">
                  <path d="M1 9H23.2" stroke="currentColor" strokeLinecap="round" strokeWidth="2"/>
                  <path d="M1 1.6H23.2" stroke="currentColor" strokeLinecap="round" strokeWidth="2"/>
                  <path d="M1 16.4H23.2" stroke="currentColor" strokeLinecap="round" strokeWidth="2"/>
                </svg>
              </button>

              <Link href="/" aria-label="Início" className="flex-shrink-0" style={{ background: 'transparent' }}>
                <GazinLogo logoUrl={logoUrl} />
              </Link>

              <div className="flex-1" />

              <div className="flex items-center gap-4">
                {/* Perfil */}
                <Link href={session ? '/minha-conta' : '/login'} className="text-white" aria-label="Perfil">
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="white" strokeLinecap="round" strokeWidth="1.8"/>
                    <circle cx="12" cy="7" r="4" stroke="white" strokeLinecap="round" strokeWidth="1.8"/>
                  </svg>
                </Link>

                {/* Favoritos — coração branco, badge laranja canto inferior direito */}
                <button className="relative" aria-label="Favoritos">
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="white" fill="none" strokeLinecap="round" strokeWidth="2"/>
                  </svg>
                  {/* badge laranja — canto inferior direito */}
                  <span className="absolute -bottom-1 -right-1.5 bg-orange-400 text-white rounded-full w-4 h-4 text-xs font-bold flex items-center justify-center leading-none">
                    0
                  </span>
                </button>

                {/* Carrinho — chip azul escuro com ícone + número dentro */}
                <Link href="/carrinho" aria-label="Carrinho"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md flex-shrink-0"
                  style={{ background: 'rgba(0,0,60,0.35)' }}
                >
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 22">
                    <path d="M1 1h3l1.68 8.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L21 4H6" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"/>
                    <circle cx="9" cy="19" r="1.5" fill="white"/>
                    <circle cx="18" cy="19" r="1.5" fill="white"/>
                  </svg>
                  <span className="text-white text-sm font-bold leading-none">
                    {totalItens}
                  </span>
                </Link>
              </div>
            </div>

            {/* Linha 2: barra de busca */}
            <form onSubmit={handleBusca} className="search-bar">
              <input
                type="text"
                placeholder="O que você procura?"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
              <button type="submit" aria-label="Buscar" className="search-btn-orange">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" stroke="white" strokeWidth="2"/>
                  <path d="M21 21l-4.35-4.35" stroke="white" strokeLinecap="round" strokeWidth="2"/>
                </svg>
              </button>
            </form>

            {/* Linha 3: CEP */}
            <div className="flex items-center gap-1.5">
              <svg width="12" height="15" fill="none" viewBox="0 0 14 18">
                <path d="M7 1C4.2 1 2 3.2 2 6c0 3.9 5 11 5 11s5-7.1 5-11c0-2.8-2.2-5-5-5Z" stroke="white" strokeLinecap="round" strokeWidth="1.5"/>
                <circle cx="7" cy="6" r="2" stroke="white" strokeWidth="1.5"/>
              </svg>
              <input
                type="text"
                placeholder="CEP 00000000"
                value={cepInput}
                onChange={e => setCepInput(e.target.value)}
                className="bg-transparent text-white text-xs outline-none placeholder:text-white/70 w-28"
                maxLength={9}
              />
            </div>
          </div>

          {/* ── DESKTOP layout ── */}
          <div className="hidden md:flex flex-col w-full gap-2">
            {/* Top row */}
            <div className="header-top">
              <p className="welcome">Olá! <strong>Seja bem-vindo!</strong></p>
              <ul>
                <li>
                  <div className="header-user-area">
                    <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
                      <path clipRule="evenodd" d="M10.9 10.8c.4.3.4.9,0,1.2l-1,.8c-.4.3-1.2.5-1.7.3 0,0-2.1-.4-4.6-2.9C1.1,7.8.7,5.8.7,5.8.5,5.3.7,4.6,1,4.1l.8-1c.3-.4.9-.4,1.2,0l1.3,1.5c.2.3.2.7,0,1L3.8,6.5s0,1.4,1.1,2.5c1.1,1.1,2.5,1.1,2.5,1.1l.8-.5c.3-.2.8-.2,1,0L10.9,10.8Z" fillRule="evenodd" stroke="white" strokeLinecap="round" strokeWidth="1"/>
                    </svg>
                    <span>Contatos</span>
                  </div>
                </li>
                <li>
                  <Link href={session ? '/minha-conta/pedidos' : '/login'} className="flex items-center gap-1 text-white text-xs">
                    <svg width="13" height="14" fill="none" viewBox="0 0 13 14">
                      <path d="M11.9 9.5V4.6c0-.2-.1-.4-.2-.6-.1-.2-.3-.3-.5-.4L7.1 1.2C6.9 1.1 6.7 1 6.5 1S6.1 1.1 5.9 1.2L1.6 3.6c-.2.1-.3.3-.4.5-.1.2-.2.4-.2.6v4.9c0 .2.1.4.2.6.1.2.3.3.5.4l4.3 2.4c.2.1.4.1.5.1s.4,0,.5-.1l4.3-2.4c.2-.1.3-.3.5-.4.1-.2.1-.4.1-.6Z" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M1.2 4L6.5 7.1 11.8 4" stroke="white" strokeLinecap="round"/>
                      <path d="M6.5 13.2V7.1" stroke="white" strokeLinecap="round"/>
                    </svg>
                    <span>Meus pedidos</span>
                  </Link>
                </li>
                <li><a href="#" className="text-white text-xs whitespace-nowrap">Pague sua parcela da loja</a></li>
              </ul>
            </div>

            {/* Bottom row */}
            <div className="header-bottom">
              <button aria-label="Menu categorias" onClick={() => setSidebarOpen(true)} className="text-white flex-shrink-0">
                <svg width="25" height="18" fill="none" viewBox="0 0 25 18">
                  <path d="M1 9H23.2" stroke="currentColor" strokeLinecap="round" strokeWidth="2"/>
                  <path d="M1 1.6H23.2" stroke="currentColor" strokeLinecap="round" strokeWidth="2"/>
                  <path d="M1 16.4H23.2" stroke="currentColor" strokeLinecap="round" strokeWidth="2"/>
                </svg>
              </button>
              <Link href="/" aria-label="Logo" className="flex-shrink-0">
                <GazinLogo logoUrl={logoUrl} />
              </Link>
              <form onSubmit={handleBusca} className="search-bar">
                <input type="text" placeholder="Buscar produtos..." value={busca} onChange={(e) => setBusca(e.target.value)}/>
                <button type="submit" aria-label="Buscar" className="search-btn-orange">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" stroke="white" strokeWidth="2"/>
                    <path d="M21 21l-4.35-4.35" stroke="white" strokeLinecap="round" strokeWidth="2"/>
                  </svg>
                </button>
              </form>
              <div className="cep-input-wrapper hidden lg:flex">
                <svg width="14" height="18" fill="none" viewBox="0 0 14 18">
                  <path d="M7 1C4.2 1 2 3.2 2 6c0 3.9 5 11 5 11s5-7.1 5-11c0-2.8-2.2-5-5-5Z" stroke="white" strokeLinecap="round" strokeWidth="1.5"/>
                  <circle cx="7" cy="6" r="2" stroke="white" strokeWidth="1.5"/>
                </svg>
                <div>
                  <p className="text-white text-xs opacity-80">Entregar em</p>
                  <input type="text" placeholder="Informe seu CEP" value={cepInput} onChange={e => setCepInput(e.target.value)} className="bg-transparent text-white text-xs font-medium outline-none w-28 placeholder:text-white/70" maxLength={9}/>
                </div>
              </div>
              {/* Favoritos desktop */}
              <button className="text-white flex-shrink-0" aria-label="Favoritos">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="white" strokeLinecap="round" strokeWidth="1.8"/>
                </svg>
              </button>
              {/* Perfil desktop */}
              <div className="relative" ref={userMenuRef}>
                <button onClick={() => session ? setUserMenuOpen(v => !v) : setModalAuth(true)} className="header-user-area">
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="white" strokeLinecap="round" strokeWidth="1.8"/>
                    <circle cx="12" cy="7" r="4" stroke="white" strokeLinecap="round" strokeWidth="1.8"/>
                  </svg>
                  <div className="hidden xl:block text-left">
                    {session ? (
                      <><p className="text-white text-xs opacity-80">Olá,</p><p className="text-white text-xs font-semibold">{session.user?.name?.split(' ')[0]}</p></>
                    ) : (
                      <><p className="text-white text-xs opacity-80">Faça seu</p><p className="text-white text-xs font-semibold">Login / Cadastro</p></>
                    )}
                  </div>
                </button>
                {userMenuOpen && session && (
                  <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg w-48 z-50 overflow-hidden">
                    <Link href="/minha-conta" className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-b border-gray-100" onClick={() => setUserMenuOpen(false)}>Minha conta</Link>
                    <Link href="/minha-conta/pedidos" className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-b border-gray-100" onClick={() => setUserMenuOpen(false)}>Meus pedidos</Link>
                    <Link href="/minha-conta/enderecos" className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-b border-gray-100" onClick={() => setUserMenuOpen(false)}>Meus endereços</Link>
                    <button onClick={() => { signOut({ callbackUrl: '/' }); setUserMenuOpen(false) }} className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-500 hover:bg-red-50">Sair</button>
                  </div>
                )}
              </div>
              {/* Carrinho desktop */}
              <Link href="/carrinho" className="header-cart relative">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" stroke="white" strokeLinecap="round" strokeWidth="1.8"/>
                  <path d="M3 6h18" stroke="white" strokeLinecap="round" strokeWidth="1.8"/>
                  <path d="M16 10a4 4 0 0 1-8 0" stroke="white" strokeLinecap="round" strokeWidth="1.8"/>
                </svg>
                <div className="hidden xl:block text-left">
                  <p className="text-white text-xs opacity-80">Meu</p>
                  <p className="text-white text-xs font-semibold">Carrinho</p>
                </div>
                {totalItens > 0 && <span className="cart-count">{totalItens}</span>}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Nav bar desktop */}
      <nav className="gazin-nav hidden md:block">
        <div className="gazin-nav-inner">
          <div className="gazin-nav-item categorias-btn relative group">
            <svg width="14" height="14" fill="none" viewBox="0 0 25 18">
              <path d="M1 9H23.2" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5"/>
              <path d="M1 1.6H23.2" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5"/>
              <path d="M1 16.4H23.2" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5"/>
            </svg>
            Todas categorias
            <ul className="mega-menu group-hover:!block">
              {ALL_CATEGORIES.map(cat => (
                <li key={cat.slug}>
                  <Link href={`/categoria/${cat.slug}`}>
                    {cat.name}
                    <svg width="6" height="10" fill="none" viewBox="0 0 6 10">
                      <path d="M1 9L5 5L1 1" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5"/>
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {NAV_ITEMS.map((item) => (
            <Link key={item.slug} href={`/categoria/${item.slug}`} className="gazin-nav-item">
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
      <ModalCadastroLogin
        open={modalAuth}
        onClose={() => setModalAuth(false)}
        abaInicial="cadastro"
      />
    </>
  )
}
