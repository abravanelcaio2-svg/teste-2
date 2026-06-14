import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import BannerCarousel from '@/components/loja/BannerCarousel'
import ProductShelf from '@/components/loja/ProductShelf'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Gazin - Eletrônicos, Celulares, Eletrodomésticos e Muito Mais',
  description: 'Compre online com segurança. Celulares, Eletrodomésticos, TVs, Móveis e muito mais com entrega para todo o Brasil.',
}

export const dynamic = 'force-dynamic'

async function getProdutos(secao: 'promocoes' | 'populares' | 'novidades', limit = 12) {
  const orderBy: any = secao === 'novidades' ? { createdAt: 'desc' } : { totalAvaliacoes: 'desc' }
  const where: any = { ativo: true }
  if (secao === 'promocoes') where.precoOriginal = { not: null }
  const produtos = await prisma.produto.findMany({ where, orderBy, take: limit })
  return produtos.map(p => ({
    id:              p.id,
    slug:            p.slug,
    nome:            p.nome,
    precoOriginal:   p.precoOriginal ? Number(p.precoOriginal) : undefined,
    preco:           Number(p.preco),
    avaliacoes:      p.totalAvaliacoes ?? 0,
    mediaAvaliacoes: Number(p.mediaEstrelas ?? 0),
    imagem:          p.fotos[0] ?? '/images/placeholder.jpg',
    desconto:        p.precoOriginal
      ? Math.round((1 - Number(p.preco) / Number(p.precoOriginal)) * 100)
      : 0,
  }))
}

async function getConfig() {
  try {
    const rows = await prisma.siteConfig.findMany({
      where: { key: { in: ['banner_imagens', 'home_blocos'] } }
    })
    const map: Record<string, string> = {}
    rows.forEach(r => { map[r.key] = r.value })
    let banners: string[] = []
    try { banners = JSON.parse(map['banner_imagens'] || '[]') } catch {}
    let blocos: { imagem: string; link: string }[] = []
    try { blocos = JSON.parse(map['home_blocos'] || '[]') } catch {}
    return { banners, blocos }
  } catch {
    return { banners: [], blocos: [] }
  }
}

export default async function HomePage() {
  const [{ banners, blocos }, promocoes, populares, novidades] = await Promise.all([
    getConfig(),
    getProdutos('promocoes', 12),
    getProdutos('populares', 12),
    getProdutos('novidades', 12),
  ])

  return (
    <div>
      {/* Banner principal */}
      <BannerCarousel banners={banners} />

      {/* ── Mais Populares — scroll horizontal no mobile ── */}
      <ProductShelf
        titulo="Mais Populares"
        subtitulo="Confira o que todo mundo está comprando"
        linkVerMais="/categoria/mais-populares"
        produtos={populares}
        scrollHorizontal
      />

      {/* ── Novidades — scroll horizontal no mobile ── */}
      <ProductShelf
        titulo="Novidades"
        subtitulo="Os lançamentos mais recentes"
        linkVerMais="/categoria/novidades"
        produtos={novidades}
        scrollHorizontal
      />

      {/* 4 blocos de imagem configuráveis */}
      {blocos.length > 0 && (
        <section className="home-blocos-section">
          <div className="home-blocos-grid">
            {blocos.slice(0, 4).map((bloco, i) => (
              <Link key={i} href={bloco.link || '/'} className="home-bloco-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={bloco.imagem} alt={`Destaque ${i + 1}`} className="home-bloco-img" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Prateleiras completas abaixo ── */}
      {promocoes.length > 0 && (
        <ProductShelf titulo="Promoções Imperdíveis" linkVerMais="/categoria/promocoes" produtos={promocoes} />
      )}

      {populares.length > 0 && (
        <ProductShelf titulo="Mais Populares" linkVerMais="/categoria/mais-populares" produtos={populares} />
      )}

      {novidades.length > 0 && (
        <ProductShelf titulo="Novidades" linkVerMais="/categoria/novidades" produtos={novidades} />
      )}

      {/* Barra de benefícios */}
      <section className="trust-bar">
        <div className="trust-bar-inner">
          <div className="trust-item">
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" className="trust-icon">
              <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 0 0 1.946-.806 3.42 3.42 0 0 1 4.438 0 3.42 3.42 0 0 0 1.946.806 3.42 3.42 0 0 1 3.138 3.138 3.42 3.42 0 0 0 .806 1.946 3.42 3.42 0 0 1 0 4.438 3.42 3.42 0 0 0-.806 1.946 3.42 3.42 0 0 1-3.138 3.138 3.42 3.42 0 0 0-1.946.806 3.42 3.42 0 0 1-4.438 0 3.42 3.42 0 0 0-1.946-.806 3.42 3.42 0 0 1-3.138-3.138 3.42 3.42 0 0 0-.806-1.946 3.42 3.42 0 0 1 0-4.438 3.42 3.42 0 0 0 .806-1.946 3.42 3.42 0 0 1 3.138-3.138z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <div><span className="highlight">Compra segura</span><br/><small>Seus dados protegidos</small></div>
          </div>
          <div className="trust-item">
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" className="trust-icon">
              <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <rect x="9" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8"/>
            </svg>
            <div><span className="highlight">Entrega rápida</span><br/><small>Para todo o Brasil</small></div>
          </div>
          <div className="trust-item">
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" className="trust-icon">
              <polyline points="1 4 1 10 7 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M3.51 15a9 9 0 1 0 .49-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <div><span className="highlight">Troca fácil</span><br/><small>7 dias para trocar</small></div>
          </div>
          <div className="trust-item">
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" className="trust-icon">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <div><span className="highlight">Suporte</span><br/><small>Atendimento humano</small></div>
          </div>
        </div>
      </section>
    </div>
  )
}
