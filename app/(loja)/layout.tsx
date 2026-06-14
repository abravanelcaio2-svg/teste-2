import { prisma } from '@/lib/prisma'
import Header from '@/components/loja/Header'
import Footer from '@/components/loja/Footer'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: { default: 'Gazin - Sua Loja de Eletrônicos e Muito Mais', template: '%s | Gazin' },
  description: 'Compre online com segurança. Celulares, Eletrodomésticos, TVs, Móveis e muito mais com entrega para todo o Brasil.',
}

async function getLogoUrl(): Promise<string | undefined> {
  try {
    const cfg = await prisma.siteConfig.findUnique({ where: { key: 'logo_url' } })
    return cfg?.value || undefined
  } catch {
    return undefined
  }
}

export default async function LojaLayout({ children }: { children: React.ReactNode }) {
  const logoUrl = await getLogoUrl()
  return (
    <div className="flex flex-col min-h-screen">
      <Header logoUrl={logoUrl} />
      <main className="flex-1 bg-gazin-bg">
        {children}
      </main>
      <Footer />
    </div>
  )
}
