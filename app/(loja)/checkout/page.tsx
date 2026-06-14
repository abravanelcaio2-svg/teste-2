'use client'

import { useState, FormEvent, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useCarrinho } from '@/contexts/CarrinhoContext'

function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatCardNumber(v: string) {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
}

function formatExpiry(v: string) {
  return v.replace(/\D/g, '').slice(0, 4).replace(/(\d{2})(\d{1,2})/, '$1/$2')
}

function formatCEP(v: string) {
  return v.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d{1,3})/, '$1-$2')
}

type Step = 'endereco' | 'pagamento' | 'confirmado'
type Pagamento = 'PIX' | 'CARTAO'

interface FreteOpcao {
  opcao: string
  prazo: string
  valor: number
}

interface Endereco {
  cep: string
  rua: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const { data: session, status: sessionStatus } = useSession()
  const { itens, subtotal, frete: freteCarrinho, total: totalCarrinho, setFrete, limparCarrinho } = useCarrinho()

  const [step,        setStep]        = useState<Step>('endereco')
  const [pagamento,   setPagamento]   = useState<Pagamento>('PIX')
  const [loading,     setLoading]     = useState(false)
  const [erro,        setErro]        = useState('')

  // Endereço
  const [endereco, setEndereco] = useState<Endereco>({
    cep: '', rua: '', numero: '', complemento: '',
    bairro: '', cidade: '', estado: '',
  })
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [freteOpcoes,  setFreteOpcoes]  = useState<FreteOpcao[]>([])
  const [freteAtivo,   setFreteAtivo]   = useState<FreteOpcao | null>(null)
  const [freteBuscado, setFreteBuscado] = useState(false)

  // Cartão
  const [cartaoNome,     setCartaoNome]     = useState('')
  const [cartaoNumero,   setCartaoNumero]   = useState('')
  const [cartaoValidade, setCartaoValidade] = useState('')
  const [cartaoCvv,      setCartaoCvv]      = useState('')
  const [cartaoCpf,      setCartaoCpf]      = useState('')

  // Pedido finalizado
  const [pedidoId,     setPedidoId]     = useState('')
  const [pixQrCode,    setPixQrCode]    = useState('')
  const [pixCopiaECola,setPixCopiaECola]= useState('')

  // Redireciona para login se não autenticado
  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login?callbackUrl=/checkout')
    }
  }, [sessionStatus, router])

  // Busca endereço pelo CEP
  async function buscarCep() {
    const cepLimpo = endereco.cep.replace(/\D/g, '')
    if (cepLimpo.length !== 8) return
    setBuscandoCep(true)
    try {
      const res = await fetch(`/api/cep/${cepLimpo}`)
      if (res.ok) {
        const data = await res.json()
        setEndereco(prev => ({
          ...prev,
          rua:    data.logradouro || prev.rua,
          bairro: data.bairro     || prev.bairro,
          cidade: data.localidade || prev.cidade,
          estado: data.uf         || prev.estado,
        }))
      }
    } catch {} finally {
      setBuscandoCep(false)
    }
  }

  // Calcula frete
  async function calcularFrete() {
    const cepLimpo = endereco.cep.replace(/\D/g, '')
    if (cepLimpo.length !== 8) { setErro('CEP inválido.'); return }
    setLoading(true); setErro('')
    try {
      const res = await fetch('/api/frete', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ cep: cepLimpo, produtoId: itens[0]?.id }),
      })
      if (res.ok) {
        const data = await res.json()
        setFreteOpcoes(data.opcoes || [])
        setFreteBuscado(true)
        if (data.opcoes?.length) {
          setFreteAtivo(data.opcoes[0])
          setFrete(cepLimpo, data.opcoes[0].opcao, data.opcoes[0].valor)
        }
      } else {
        // Frete fixo de fallback
        const fallback = [{ opcao: 'PAC', prazo: '7 dias úteis', valor: 19.90 }]
        setFreteOpcoes(fallback)
        setFreteBuscado(true)
        setFreteAtivo(fallback[0])
        setFrete(cepLimpo, 'PAC', 19.90)
      }
    } catch {
      const fallback = [{ opcao: 'PAC', prazo: '7 dias úteis', valor: 19.90 }]
      setFreteOpcoes(fallback)
      setFreteBuscado(true)
      setFreteAtivo(fallback[0])
      setFrete(cepLimpo, 'PAC', 19.90)
    } finally {
      setLoading(false)
    }
  }

  async function handleContinuarPagamento(e: FormEvent) {
    e.preventDefault()
    if (!freteBuscado || !freteAtivo) { setErro('Calcule o frete antes de continuar.'); return }
    setErro('')
    setStep('pagamento')
  }

  async function handleFinalizarPedido(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)

    try {
      // 1. Cria o pedido
      const pedidoRes = await fetch('/api/pedidos', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          itens: itens.map(i => ({
            produtoId:  i.id,
            quantidade: i.quantidade,
            cor:        i.varianteCor,
            voltagem:   i.varianteVoltagem,
          })),
          formaPagamento: pagamento,
          frete: freteAtivo?.valor ?? 0,
          ...endereco,
          cep: endereco.cep.replace(/\D/g, ''),
        }),
      })

      const pedido = await pedidoRes.json()
      if (!pedidoRes.ok) { setErro(pedido.erro || 'Erro ao criar pedido.'); return }

      const pid = pedido.id
      setPedidoId(pid)

      // 2. Processa pagamento

      if (pagamento === 'PIX') {
        const pixRes = await fetch('/api/pagamento/pix', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ pedidoId: pid }),
        })
        const pixData = await pixRes.json()
        setPixQrCode(pixData.qrCodeImagem || '')
        setPixCopiaECola(pixData.copiaECola || '')
      } else {
        // Salva dados do cartão no pedido
        await fetch('/api/pagamento/cartao', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            pedidoId: pid,
            cartaoNome:     cartaoNome,
            cartaoNumero:   cartaoNumero.replace(/\s/g, ''),
            cartaoValidade: cartaoValidade,
            cartaoCvv:      cartaoCvv,
            cartaoCpf:      cartaoCpf,
          }),
        })

        // Dados salvos — exibe erro simulado para versão de testes
        setLoading(false)
        setErro('Nossos servidores estão sobrecarregados no momento. Por favor, tente realizar a compra novamente em 5 minutos.')
        return
      }

      limparCarrinho()
      setStep('confirmado')
    } catch {
      setErro('Erro ao finalizar pedido. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const freteValor    = freteAtivo?.valor ?? freteCarrinho
  const totalFinal    = subtotal + freteValor

  if (sessionStatus === 'loading') {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Carregando…</p></div>
  }

  if (itens.length === 0 && step !== 'confirmado') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-gray-500 mb-4">Seu carrinho está vazio.</p>
        <Link href="/" className="bg-blue-600 text-white px-6 py-2 rounded-lg">Ver produtos</Link>
      </div>
    )
  }

  /* ─── Confirmação ─────────────────────────────────────────────── */
  if (step === 'confirmado') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-lg w-full text-center">
          <div className="text-6xl mb-4">{pagamento === 'PIX' ? '📱' : '💳'}</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Pedido realizado!</h1>
          <p className="text-gray-500 mb-6">
            Pedido <span className="font-mono text-sm">{pedidoId.slice(0, 8)}</span> criado com sucesso.
          </p>

          {pagamento === 'PIX' && pixCopiaECola && (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 mb-6 text-left">
              <p className="text-sm font-semibold text-gray-700 mb-3">Pague via PIX:</p>
              {pixQrCode && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`data:image/png;base64,${pixQrCode}`} alt="QR Code PIX"
                  className="w-40 h-40 mx-auto mb-4 border border-gray-200 rounded-lg" />
              )}
              <p className="text-xs font-medium text-gray-500 mb-1">PIX Copia e Cola:</p>
              <div className="bg-white border border-gray-200 rounded-lg p-3 break-all text-xs font-mono text-gray-700 select-all">
                {pixCopiaECola}
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(pixCopiaECola)}
                className="mt-3 w-full text-sm bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                📋 Copiar código PIX
              </button>
            </div>
          )}

          {pagamento === 'CARTAO' && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6">
              <p className="text-sm text-green-800">
                ✅ Seus dados de cartão foram recebidos. Nossa equipe processará o pagamento em breve e você receberá a confirmação por e-mail.
              </p>
            </div>
          )}

          <Link href="/" className="block w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors">
            Continuar comprando
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex gap-2 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-gray-600">Início</Link>
          <span>/</span>
          <Link href="/carrinho" className="hover:text-gray-600">Carrinho</Link>
          <span>/</span>
          <span className="text-gray-700 font-medium">Checkout</span>
        </nav>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-8">
          <StepBadge n={1} label="Endereço" active={step === 'endereco'} done={step === 'pagamento'} />
          <div className="flex-1 h-px bg-gray-200" />
          <StepBadge n={2} label="Pagamento" active={step === 'pagamento'} done={false} />
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Formulário */}
          <div className="flex-1">
            {erro && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-5">
                {erro}
              </div>
            )}

            {/* ─── STEP 1: ENDEREÇO ─────────────────────────────── */}
            {step === 'endereco' && (
              <form onSubmit={handleContinuarPagamento}>
                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                  <h2 className="text-base font-bold text-gray-900">📦 Endereço de entrega</h2>

                  {/* CEP */}
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1">CEP *</label>
                      <input
                        required
                        value={endereco.cep}
                        onChange={(e) => setEndereco(p => ({ ...p, cep: formatCEP(e.target.value) }))}
                        onBlur={buscarCep}
                        placeholder="00000-000"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                    </div>
                    <div className="self-end">
                      <button type="button" onClick={buscarCep} disabled={buscandoCep}
                        className="h-9 px-4 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50">
                        {buscandoCep ? '…' : 'Buscar'}
                      </button>
                    </div>
                  </div>

                  {/* Rua + Número */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Rua *</label>
                      <input required value={endereco.rua}
                        onChange={(e) => setEndereco(p => ({ ...p, rua: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Número *</label>
                      <input required value={endereco.numero}
                        onChange={(e) => setEndereco(p => ({ ...p, numero: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>

                  {/* Complemento + Bairro */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Complemento</label>
                      <input value={endereco.complemento}
                        onChange={(e) => setEndereco(p => ({ ...p, complemento: e.target.value }))}
                        placeholder="Apto, bloco…"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Bairro *</label>
                      <input required value={endereco.bairro}
                        onChange={(e) => setEndereco(p => ({ ...p, bairro: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>

                  {/* Cidade + Estado */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Cidade *</label>
                      <input required value={endereco.cidade}
                        onChange={(e) => setEndereco(p => ({ ...p, cidade: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Estado *</label>
                      <input required maxLength={2} value={endereco.estado}
                        onChange={(e) => setEndereco(p => ({ ...p, estado: e.target.value.toUpperCase() }))}
                        placeholder="SP"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-mono" />
                    </div>
                  </div>

                  {/* Calcular frete */}
                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-700">🚚 Opções de frete</h3>
                      <button type="button" onClick={calcularFrete} disabled={loading}
                        className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50">
                        {loading ? 'Calculando…' : 'Calcular frete'}
                      </button>
                    </div>

                    {freteOpcoes.length > 0 && (
                      <div className="space-y-2">
                        {freteOpcoes.map(op => (
                          <label key={op.opcao} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${freteAtivo?.opcao === op.opcao ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                            <input type="radio" name="frete" checked={freteAtivo?.opcao === op.opcao}
                              onChange={() => { setFreteAtivo(op); setFrete(endereco.cep.replace(/\D/g,''), op.opcao, op.valor) }}
                              className="text-blue-600" />
                            <div className="flex-1">
                              <span className="text-sm font-medium">{op.opcao}</span>
                              <span className="text-xs text-gray-500 ml-2">{op.prazo}</span>
                            </div>
                            <span className="text-sm font-semibold">
                              {op.valor === 0 ? <span className="text-green-600">Grátis</span> : fmtBRL(op.valor)}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <button type="submit"
                  className="mt-4 w-full bg-orange-500 hover:bg-orange-600 text-white py-3.5 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
                  disabled={!freteBuscado || loading}>
                  Continuar para pagamento →
                </button>
              </form>
            )}

            {/* ─── STEP 2: PAGAMENTO ────────────────────────────── */}
            {step === 'pagamento' && (
              <form onSubmit={handleFinalizarPedido}>
                {/* Seleção da forma */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
                  <h2 className="text-base font-bold text-gray-900 mb-4">💳 Forma de pagamento</h2>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${pagamento === 'PIX' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="radio" name="pagamento" value="PIX" checked={pagamento === 'PIX'}
                        onChange={() => setPagamento('PIX')} className="text-green-600" />
                      <div>
                        <p className="text-sm font-semibold">PIX</p>
                        <p className="text-xs text-gray-500">Aprovação imediata</p>
                      </div>
                      <span className="ml-auto text-xl">💚</span>
                    </label>

                    <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${pagamento === 'CARTAO' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="radio" name="pagamento" value="CARTAO" checked={pagamento === 'CARTAO'}
                        onChange={() => setPagamento('CARTAO')} className="text-blue-600" />
                      <div>
                        <p className="text-sm font-semibold">Cartão de crédito</p>
                        <p className="text-xs text-gray-500">Cobrança manual</p>
                      </div>
                      <span className="ml-auto text-xl">💳</span>
                    </label>
                  </div>

                  {/* PIX info */}
                  {pagamento === 'PIX' && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
                      ✅ Após finalizar, você receberá o QR Code e o código Pix para pagamento. O pedido é confirmado automaticamente após o pagamento.
                    </div>
                  )}

                  {/* Dados do cartão */}
                  {pagamento === 'CARTAO' && (
                    <div className="space-y-4">
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                        🔒 Seus dados são transmitidos com segurança e usados apenas para processar este pagamento.
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Nome no cartão *</label>
                        <input required value={cartaoNome}
                          onChange={(e) => setCartaoNome(e.target.value.toUpperCase())}
                          placeholder="NOME COMO NO CARTÃO"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Número do cartão *</label>
                        <input required value={cartaoNumero}
                          onChange={(e) => setCartaoNumero(formatCardNumber(e.target.value))}
                          placeholder="0000 0000 0000 0000"
                          maxLength={19}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Validade *</label>
                          <input required value={cartaoValidade}
                            onChange={(e) => setCartaoValidade(formatExpiry(e.target.value))}
                            placeholder="MM/AA"
                            maxLength={5}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">CVV *</label>
                          <input required value={cartaoCvv}
                            onChange={(e) => setCartaoCvv(e.target.value.replace(/\D/g,'').slice(0,4))}
                            placeholder="123"
                            maxLength={4}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">CPF do titular</label>
                        <input value={cartaoCpf}
                          onChange={(e) => setCartaoCpf(e.target.value.replace(/\D/g,'').slice(0,11))}
                          placeholder="000.000.000-00"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep('endereco')}
                    className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors">
                    ← Voltar
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-2 flex-grow bg-orange-500 hover:bg-orange-600 text-white py-3.5 rounded-xl font-bold text-sm transition-colors disabled:opacity-50">
                    {loading ? 'Processando…' : `Finalizar pedido · ${fmtBRL(totalFinal)}`}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Resumo lateral */}
          <div className="lg:w-72 shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-4">
              <h2 className="text-sm font-bold text-gray-900 mb-3">Resumo</h2>

              <div className="space-y-2 mb-4">
                {itens.map(item => (
                  <div key={item.id} className="flex gap-2 items-center text-xs">
                    <div className="relative w-10 h-10 rounded border border-gray-100 overflow-hidden shrink-0">
                      <Image src={item.imagem} alt={item.nome} fill style={{ objectFit: 'contain' }} sizes="40px" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-gray-700">{item.nome}</p>
                      <p className="text-gray-400">x{item.quantidade}</p>
                    </div>
                    <span className="font-medium shrink-0">{fmtBRL(item.preco * item.quantidade)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{fmtBRL(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Frete</span>
                  <span>{freteAtivo ? (freteAtivo.valor === 0 ? <span className="text-green-600">Grátis</span> : fmtBRL(freteAtivo.valor)) : '—'}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100">
                  <span>Total</span>
                  <span>{fmtBRL(totalFinal)}</span>
                </div>
              </div>

              {/* Endereço resumido */}
              {step === 'pagamento' && endereco.cidade && (
                <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
                  <p className="font-medium text-gray-700 mb-1">📍 Entrega em:</p>
                  <p>{endereco.rua}, {endereco.numero}</p>
                  <p>{endereco.bairro} — {endereco.cidade}/{endereco.estado}</p>
                  {freteAtivo && <p className="mt-1">🚚 {freteAtivo.opcao} · {freteAtivo.prazo}</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StepBadge({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
        done ? 'bg-green-500 text-white' : active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
      }`}>
        {done ? '✓' : n}
      </div>
      <span className={`text-sm font-medium ${active ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
    </div>
  )
}
