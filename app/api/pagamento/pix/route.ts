export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function getAsaasConfig() {
  const [keyRow, envRow] = await Promise.all([
    prisma.siteConfig.findUnique({ where: { key: 'asaas_api_key' } }),
    prisma.siteConfig.findUnique({ where: { key: 'asaas_env' } }),
  ])
  const apiKey = keyRow?.value || process.env.ASAAS_API_KEY || ''
  const env    = envRow?.value || process.env.ASAAS_ENV    || 'sandbox'
  const baseUrl =
    env === 'producao'
      ? 'https://api.asaas.com/v3'
      : 'https://sandbox.asaas.com/api/v3'
  return { apiKey, baseUrl }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 })
    }
    const usuarioId = (session.user as any).id

    const { pedidoId } = await req.json()

    const pedido = await prisma.pedido.findFirst({
      where:   { id: pedidoId, usuarioId },
      include: { usuario: true },
    })

    if (!pedido) {
      return NextResponse.json({ erro: 'Pedido não encontrado.' }, { status: 404 })
    }

    if (pedido.formaPagamento !== 'PIX') {
      return NextResponse.json({ erro: 'Pedido não é PIX.' }, { status: 400 })
    }

    const { apiKey, baseUrl } = await getAsaasConfig()

    if (!apiKey) {
      return NextResponse.json(
        { erro: 'Integração Asaas não configurada. Configure a API Key no painel admin.' },
        { status: 503 }
      )
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'access_token': apiKey,
    }

    // 1. Busca ou cria customer
    let customerId: string
    const searchRes  = await fetch(
      `${baseUrl}/customers?email=${encodeURIComponent(pedido.usuario.email)}`,
      { headers }
    )
    const searchData = await searchRes.json()

    if (searchData?.data?.length > 0) {
      customerId = searchData.data[0].id
    } else {
      const custRes  = await fetch(`${baseUrl}/customers`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name:     pedido.usuario.nome,
          email:    pedido.usuario.email,
          cpfCnpj:  pedido.usuario.cpf     || '',
          phone:    pedido.usuario.telefone || '',
        }),
      })
      const custData = await custRes.json()
      if (!custData.id) {
        throw new Error(`Asaas customer error: ${JSON.stringify(custData)}`)
      }
      customerId = custData.id
    }

    // 2. Cria cobrança PIX
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 1)
    const dueDateStr = dueDate.toISOString().split('T')[0]

    const payRes  = await fetch(`${baseUrl}/payments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        customer:    customerId,
        billingType: 'PIX',
        value:       pedido.total,
        dueDate:     dueDateStr,
        description: `Pedido #${pedido.id}`,
      }),
    })
    const payData = await payRes.json()

    if (!payData.id) {
      throw new Error(`Asaas payment error: ${JSON.stringify(payData)}`)
    }

    // 3. Busca QR Code (aguarda 1s para processar)
    await new Promise((r) => setTimeout(r, 1000))

    const qrRes  = await fetch(`${baseUrl}/payments/${payData.id}/pixQrCode`, { headers })
    const qrData = await qrRes.json()

    // 4. Salva no pedido
    await prisma.pedido.update({
      where: { id: pedidoId },
      data: {
        pixAsaasId:   payData.id,
        pixQrCode:    qrData.encodedImage || '',
        pixCopiaECola: qrData.payload     || '',
      },
    })

    return NextResponse.json({
      pixQrCode:    qrData.encodedImage,
      pixCopiaECola: qrData.payload,
      pedidoId,
    })
  } catch (error) {
    console.error('[POST /api/pagamento/pix]', error)
    return NextResponse.json({ erro: 'Erro ao gerar PIX.' }, { status: 500 })
  }
}
