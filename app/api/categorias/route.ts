export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const categorias = await prisma.categoria.findMany({
      where:   { ativo: true },
      orderBy: { ordem: 'asc' },
      include: {
        _count: { select: { produtos: { where: { ativo: true } } } },
      },
    })
    return NextResponse.json(categorias)
  } catch (error) {
    console.error('[GET /api/categorias]', error)
    return NextResponse.json({ erro: 'Erro interno.' }, { status: 500 })
  }
}
