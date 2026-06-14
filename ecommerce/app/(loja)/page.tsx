import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import BannerCarousel from '@/components/loja/BannerCarousel'
import ProductShelf from '@/components/loja/ProductShelf'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Loja - Eletrônicos, Celulares, Eletrodomésticos e Muito Mais',
  description: 'Compre online com segurança. Celulares, Eletrodomésticos, TVs, Móveis e muito mais.',
}

export const dynamic = 'force-dynamic'

async function getProdutos(secao: 'promocoes' | 'populares' | 'novidades', limit = 12) {
  const orderBy: any = secao === 'novidades' ? { createdAt: 'desc' } : { totalAvaliacoes: 'desc' }

  const produtos = await prisma.produto.findMany({
    where: { ativo: true },
    orderBy,
    take: limit,
  })

  return produtos.map(p => ({
    id: p.id,
    slug: p.slug,
    nome: p.nome,
    precoOriginal: p.precoOriginal ? Number(p.precoOriginal) : undefined,
    preco: Number(p.preco),
    avaliacoes: p.totalAvaliacoes ?? 0,
    mediaAvaliacoes: Number(p.mediaEstrelas ?? 0),
    imagem: p.fotos[0] ?? '/images/placeholder.jpg',
    desconto: p.precoOriginal
      ? Math.round((1 - Number(p.preco) / Number(p.precoOriginal)) * 100)
      : 0,
  }))
}

async function getBanners() {
  return []
}

export default async function HomePage() {
  const [banners, promocoes, populares, novidades] = await Promise.all([
    getBanners(),
    getProdutos('promocoes', 12),
    getProdutos('populares', 12),
    getProdutos('novidades', 12),
  ])

  return (
    <div className="pb-8">
      <BannerCarousel banners={banners} />

      {promocoes.length > 0 && (
        <ProductShelf titulo="Promoções Imperdíveis" linkVerMais="/categoria/promocoes" produtos={promocoes} />
      )}

      {populares.length > 0 && (
        <ProductShelf titulo="Mais Populares" linkVerMais="/categoria/mais-populares" produtos={populares} />
      )}

      {novidades.length > 0 && (
        <ProductShelf titulo="Novidades" linkVerMais="/categoria/novidades" produtos={novidades} />
      )}

      <section className="px-4 py-8 max-w-7xl mx-auto">
        <h2 className="text-xl font-bold mb-4">Compre por Categoria</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '1rem' }}>
          {[
            { name: 'Celulares',        slug: 'celulares-e-smartphones',  emoji: '📱' },
            { name: 'Eletrodomésticos', slug: 'eletrodomesticos',          emoji: '🏠' },
            { name: "TV's",             slug: 'tvs-e-video',               emoji: '📺' },
            { name: 'Notebooks',        slug: 'notebooks',                 emoji: '💻' },
            { name: 'Fogões',           slug: 'fogoes',                    emoji: '🍳' },
            { name: 'Geladeiras',       slug: 'geladeiras-refrigeradores', emoji: '❄️' },
            { name: 'Ar Cond.',         slug: 'ar-condicionado',           emoji: '🌬️' },
            { name: 'Móveis',           slug: 'moveis',                    emoji: '🛋️' },
          ].map(cat => (
            <Link
              key={cat.slug}
              href={`/categoria/${cat.slug}`}
              className="bg-white border rounded-lg p-3 flex flex-col items-center gap-2 text-center hover:shadow-md transition-all"
            >
              <span className="text-2xl">{cat.emoji}</span>
              <span className="text-xs font-medium leading-tight">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
