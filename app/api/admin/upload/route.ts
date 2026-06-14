import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const schema = z.object({ aberturaId: z.string() })

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuth(req)
    const { aberturaId } = schema.parse(await req.json())

    // Valida abertura
    const abertura = await prisma.caixaAbertura.findUnique({
      where: { id: aberturaId },
      include: {
        caixa: {
          include: {
            skinForcada: true,
            skins: {
              include: { skin: true },
            },
          },
        },
      },
    })

    if (!abertura) return NextResponse.json({ error: 'Abertura não encontrada' }, { status: 404 })
    if (abertura.userId !== authUser.sub) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    if (!abertura.pago && !abertura.free) return NextResponse.json({ error: 'Abertura não paga' }, { status: 400 })
    if (abertura.abertaEm) return NextResponse.json({ error: 'Caixa já aberta' }, { status: 400 })

    // Determina skin: forçada (sorteio entre fixas) ou sorteio por peso
    let skinGanha: { id: string; [key: string]: unknown } | null = null
    const skinsForcadasIds: string[] = abertura.caixa.skinsForcadasIds
      ? JSON.parse(abertura.caixa.skinsForcadasIds as string)
      : []

    if (skinsForcadasIds.length > 0) {
      // Sorteia aleatoriamente entre as skins fixas cadastradas
      const idSorteado = skinsForcadasIds[Math.floor(Math.random() * skinsForcadasIds.length)]
      const skinSorteada = await prisma.skin.findUnique({ where: { id: idSorteado } })
      skinGanha = skinSorteada ?? abertura.caixa.skinForcada
    } else if (abertura.caixa.skinForcada) {
      skinGanha = abertura.caixa.skinForcada
    } else {
      const pool = abertura.caixa.skins
      if (!pool.length) return NextResponse.json({ error: 'Caixa sem skins cadastradas' }, { status: 400 })

      // Sorteio ponderado por peso
      const totalPeso = pool.reduce((sum, cs) => sum + cs.peso, 0)
      let rnd = Math.random() * totalPeso
      let escolhido = pool[pool.length - 1]
      for (const cs of pool) {
        rnd -= cs.peso
        if (rnd <= 0) { escolhido = cs; break }
      }
      skinGanha = escolhido.skin
    }

    // ✅ FIX: Guard explícito — garante ao TypeScript (e em runtime) que skinGanha não é null
    if (!skinGanha) {
      return NextResponse.json({ error: 'Skin não encontrada para esta caixa' }, { status: 400 })
    }

    // Calcula holdUntil: 24h para saque via bot
    const holdUntil = new Date(Date.now() + 24 * 60 * 60 * 1000)

    // Registra abertura + cria item no inventário
    const [aberturaAtualizada, inventarioItem] = await prisma.$transaction([
      prisma.caixaAbertura.update({
        where: { id: aberturaId },
        data:  { skinGanhaId: skinGanha.id, abertaEm: new Date() },
      }),
      prisma.userInventory.create({
        data: {
          userId:    authUser.sub,
          skinId:    skinGanha.id,
          status:    'HOLD',
          holdUntil,
          origem:    `caixa:${abertura.caixaId}`,
        },
      }),
    ])

    return NextResponse.json({
      ok:    true,
      skin:  skinGanha,
      inventarioId: inventarioItem.id,
      holdUntil: holdUntil.toISOString(),
    })
  } catch (err: any) {
    console.error('Abrir caixa error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
