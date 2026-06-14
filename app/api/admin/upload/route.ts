export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

async function checkAdmin() {
  const s = await getServerSession(authOptions)
  return s?.user && (s.user as any).role === 'ADMIN'
}

const TIPOS_ACEITOS = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
const MAX_BYTES     = 5 * 1024 * 1024 // 5 MB

export async function POST(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const tipo = (formData.get('tipo') as string) || 'produto' // 'logo' | 'produto' | 'banner'

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

    const ext =
      file.type === 'image/png'     ? 'png'  :
      file.type === 'image/webp'    ? 'webp' :
      file.type === 'image/svg+xml' ? 'svg'  : 'jpg'

    const filename  = `${uuidv4()}.${ext}`
    const uploadDir = join(process.cwd(), 'public', 'uploads')

    await mkdir(uploadDir, { recursive: true })
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(join(uploadDir, filename), buffer)

    const url = `/uploads/${filename}`

    // Persiste no banco para logo e banner
    if (tipo === 'logo') {
      await prisma.siteConfig.upsert({
        where:  { key: 'logo_url' },
        update: { value: url },
        create: { key: 'logo_url', value: url },
      })
    }

    // Banner: persiste na lista de banners
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
