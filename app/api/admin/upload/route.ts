export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function checkAdmin() {
  const s = await getServerSession(authOptions)
  return s?.user && (s.user as any).role === 'ADMIN'
}

const TIPOS_ACEITOS = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
const MAX_BYTES     = 5 * 1024 * 1024 // 5 MB

const IMAGEKIT_PRIVATE_KEY = process.env.IMAGEKIT_PRIVATE_KEY!
const IMAGEKIT_URL_ENDPOINT = process.env.IMAGEKIT_URL_ENDPOINT!

export async function POST(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const tipo = (formData.get('tipo') as string) || 'produto'

    if (!file) return NextResponse.json({ erro: 'Nenhum arquivo enviado.' }, { status: 400 })

    if (!TIPOS_ACEITOS.includes(file.type)) {
      return NextResponse.json(
        { erro: 'Tipo não aceito. Use JPG, PNG, WebP ou SVG.' },
        { status: 400 }
      )
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ erro: 'Arquivo muito grande (máx 5 MB).' }, { status: 400 })
    }

    // Converte o arquivo para base64
    const buffer = Buffer.from(await file.arrayBuffer())
    const base64 = buffer.toString('base64')

    // Pasta no ImageKit baseada no tipo
    const folder = tipo === 'logo' ? '/logo' : tipo === 'banner' ? '/banners' : '/produtos'
    const fileName = `${Date.now()}-${file.name.replace(/\s/g, '_')}`

    // Upload para o ImageKit via API REST
    const ikFormData = new FormData()
    ikFormData.append('file', base64)
    ikFormData.append('fileName', fileName)
    ikFormData.append('folder', folder)
    ikFormData.append('useUniqueFileName', 'true')

    const auth = Buffer.from(`${IMAGEKIT_PRIVATE_KEY}:`).toString('base64')

    const ikRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
      },
      body: ikFormData,
    })

    if (!ikRes.ok) {
      const err = await ikRes.text()
      console.error('[ImageKit error]', err)
      return NextResponse.json({ erro: 'Erro no upload para ImageKit.' }, { status: 500 })
    }

    const ikData = await ikRes.json()
    const url: string = ikData.url

    // Persiste no banco para logo
    if (tipo === 'logo') {
      await prisma.siteConfig.upsert({
        where:  { key: 'logo_url' },
        update: { value: url },
        create: { key: 'logo_url', value: url },
      })
    }

    // Persiste no banco para banner
    if (tipo === 'banner') {
      const atual = await prisma.siteConfig.findUnique({ where: { key: 'banner_imagens' } })
      let banners: string[] = []
      try { banners = JSON.parse(atual?.value || '[]') } catch {}
      if (!Array.isArray(banners)) banners = []
      banners.push(url)
      await prisma.siteConfig.upsert({
        where:  { key: 'banner_imagens' },
        update: { value: JSON.stringify(banners) },
        create: { key: 'banner_imagens', value: JSON.stringify(banners) },
      })
    }

    return NextResponse.json({ url })
  } catch (error) {
    console.error('[POST /api/admin/upload]', error)
    return NextResponse.json({ erro: 'Erro no upload.' }, { status: 500 })
  }
}
