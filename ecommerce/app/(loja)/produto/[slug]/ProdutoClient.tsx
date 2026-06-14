'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCarrinho } from '@/contexts/CarrinhoContext'
import ProductShelf from '@/components/loja/ProductShelf'

interface Variacao { id: string; tipo: string; valor: string; ativo: boolean }
interface Avaliacao {
  id: string; estrelas: number; comentario?: string
  nomeCliente: string; cidade?: string; createdAt: string
}
interface Produto {
  id: string; nome: string; slug: string; codigo?: string
  descricao: string; fichaTecnica?: Record<string, string>
  precoOriginal?: number; preco: number
  mediaEstrelas: number; totalAvaliacoes: number
  temCor: boolean; temVoltagem: boolean; temTamanho: boolean
  fotos: string[]; variacoes: Variacao[]; avaliacoes: Avaliacao[]
  categoria: { nome: string; slug: string }
}

function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function desconto(orig: number, preco: number) {
  return Math.round(((orig - preco) / orig) * 100)
}

function Estrelas({ media, total }: { media: number; total: number }) {
  return (
    <div className="produto-stars">
      {[1, 2, 3, 4, 5].map(n => (
        <svg key={n} viewBox="0 0 24 24" width={16} height={16}
          fill={n <= Math.round(media) ? '#F6C90E' : 'none'}
          stroke="#F6C90E" strokeWidth={0.5}>
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      ))}
      <span className="produto-stars-count">
        {total > 0 ? `(${total} avaliação${total > 1 ? 'ões' : ''})` : '(Sem avaliações)'}
      </span>
    </div>
  )
}

export default function ProdutoClient({ produto, relacionados }: { produto: Produto; relacionados: Produto[] }) {
  const router = useRouter()
  const { adicionarItem } = useCarrinho()
  const [imgAtiva, setImgAtiva] = useState(0)
  const [corSelecionada, setCorSelecionada] = useState<string | undefined>(
    produto.variacoes.find(v => v.tipo === 'cor' && v.ativo)?.valor
  )
  const [voltagemSelecionada, setVoltagemSelecionada] = useState<string | undefined>(
    produto.variacoes.find(v => v.tipo === 'voltagem' && v.ativo)?.valor
  )
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState<string | undefined>(
    produto.variacoes.find(v => v.tipo === 'tamanho' && v.ativo)?.valor
  )
  const [quantidade, setQuantidade] = useState(1)
  const [cep, setCep] = useState('')
  const [freteLoading, setFreteLoading] = useState(false)
  const [freteResultado, setFreteResultado] = useState<{ opcao: string; prazo: string; valor: number }[] | null>(null)
  const [freteErro, setFreteErro] = useState('')
  const [tabAtiva, setTabAtiva] = useState<'descricao' | 'ficha' | 'avaliacoes'>('descricao')

  const coresDisponiveis = produto.variacoes.filter(v => v.tipo === 'cor')
  const voltagensDisponiveis = produto.variacoes.filter(v => v.tipo === 'voltagem')
  const tamanhosDispo = produto.variacoes.filter(v => v.tipo === 'tamanho')
  const imagemPrincipal = produto.fotos[imgAtiva] || '/images/placeholder.jpg'

  function handleAdicionarCarrinho() {
    adicionarItem({
      id: produto.id, slug: produto.slug, nome: produto.nome,
      preco: produto.preco, precoOriginal: produto.precoOriginal ?? produto.preco,
      imagem: produto.fotos[0] || '/images/placeholder.jpg',
      quantidade,
    })
  }

  function handleComprarAgora() {
    handleAdicionarCarrinho()
    router.push('/checkout')
  }

  async function handleCalcularFrete() {
    const cepLimpo = cep.replace(/\D/g, '')
    if (cepLimpo.length !== 8) { setFreteErro('CEP inválido'); return }
    setFreteLoading(true); setFreteErro(''); setFreteResultado(null)
    try {
      const res = await fetch('/api/frete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cep: cepLimpo, produtoId: produto.id }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setFreteResultado(data.opcoes || [])
    } catch {
      setFreteErro('Não foi possível calcular o frete. Tente novamente.')
    } finally {
      setFreteLoading(false)
    }
  }

  return (
    <div className="container">
      <nav className="breadcrumb">
        <Link href="/">Início</Link>
        <span>/</span>
        <Link href={`/categoria/${produto.categoria.slug}`}>{produto.categoria.nome}</Link>
        <span>/</span>
        <span>{produto.nome}</span>
      </nav>

      <div className="produto-layout">
        {/* GALERIA */}
        <div className="produto-gallery">
          <div className="produto-gallery-main">
            <div style={{ position: 'relative', width: '100%', paddingBottom: '100%' }}>
              <Image src={imagemPrincipal} alt={produto.nome} fill
                style={{ objectFit: 'contain' }} sizes="(max-width: 768px) 100vw, 480px" priority />
              {produto.precoOriginal && produto.precoOriginal > produto.preco && (
                <span className="badge-desconto">
                  -{desconto(produto.precoOriginal, produto.preco)}%
                </span>
              )}
            </div>
          </div>
          {produto.fotos.length > 1 && (
            <div className="produto-gallery-thumbs">
              {produto.fotos.map((foto, idx) => (
                <button key={idx} onClick={() => setImgAtiva(idx)}
                  className={`produto-thumb-btn${idx === imgAtiva ? ' active' : ''}`}>
                  <Image src={foto} alt={`Imagem ${idx + 1}`} width={70} height={70}
                    style={{ objectFit: 'contain' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* INFO */}
        <div className="produto-info">
          <h1 className="produto-title">{produto.nome}</h1>
          {produto.codigo && <span className="produto-sku">Cód. {produto.codigo}</span>}
          <Estrelas media={produto.mediaEstrelas} total={produto.totalAvaliacoes} />

          <div className="produto-prices">
            {produto.precoOriginal && produto.precoOriginal > produto.preco && (
              <p className="preco-original">De: <span>{fmtBRL(produto.precoOriginal)}</span></p>
            )}
            <div className="preco-pix">
              <span className="preco-pix-valor">{fmtBRL(produto.preco)}</span>
              <span className="preco-pix-label">no Pix</span>
            </div>
          </div>

          {produto.temCor && coresDisponiveis.length > 0 && (
            <div className="produto-variantes">
              <p className="variante-label">Cor: <strong>{corSelecionada}</strong></p>
              <div className="variante-opcoes">
                {coresDisponiveis.map(v => (
                  <button key={v.id} onClick={() => setCorSelecionada(v.valor)} disabled={!v.ativo}
                    className={`variante-cor-btn${corSelecionada === v.valor ? ' selected' : ''}${!v.ativo ? ' indisponivel' : ''}`}>
                    <span>{v.valor}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {produto.temVoltagem && voltagensDisponiveis.length > 0 && (
            <div className="produto-variantes">
              <p className="variante-label">Voltagem: <strong>{voltagemSelecionada}</strong></p>
              <div className="variante-opcoes">
                {voltagensDisponiveis.map(v => (
                  <button key={v.id} onClick={() => v.ativo && setVoltagemSelecionada(v.valor)} disabled={!v.ativo}
                    className={`variante-voltagem-btn${voltagemSelecionada === v.valor ? ' selected' : ''}${!v.ativo ? ' indisponivel' : ''}`}>
                    {v.valor}
                  </button>
                ))}
              </div>
            </div>
          )}

          {produto.temTamanho && tamanhosDispo.length > 0 && (
            <div className="produto-variantes">
              <p className="variante-label">Tamanho: <strong>{tamanhoSelecionado}</strong></p>
              <div className="variante-opcoes">
                {tamanhosDispo.map(v => (
                  <button key={v.id} onClick={() => v.ativo && setTamanhoSelecionado(v.valor)} disabled={!v.ativo}
                    className={`variante-voltagem-btn${tamanhoSelecionado === v.valor ? ' selected' : ''}${!v.ativo ? ' indisponivel' : ''}`}>
                    {v.valor}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="produto-quantidade">
            <span className="variante-label">Quantidade:</span>
            <div className="qty-control">
              <button onClick={() => setQuantidade(q => Math.max(1, q - 1))}>−</button>
              <span>{quantidade}</span>
              <button onClick={() => setQuantidade(q => q + 1)}>+</button>
            </div>
          </div>

          <div className="produto-botoes">
            <button className="btn-comprar-agora" onClick={handleComprarAgora}>🛒 Comprar agora</button>
            <button className="btn-add-carrinho" onClick={handleAdicionarCarrinho}>Adicionar ao carrinho</button>
          </div>

          <div className="frete-calc">
            <h4 className="frete-title">Calcular frete e prazo</h4>
            <div className="frete-input-row">
              <input type="text" placeholder="Digite seu CEP" value={cep}
                onChange={e => setCep(e.target.value.replace(/\D/g, '').slice(0, 8))}
                onKeyDown={e => e.key === 'Enter' && handleCalcularFrete()}
                className="frete-input" maxLength={9} />
              <button onClick={handleCalcularFrete} disabled={freteLoading} className="frete-btn">
                {freteLoading ? '...' : 'Ok'}
              </button>
            </div>
            {freteErro && <p className="frete-erro">{freteErro}</p>}
            {freteResultado && freteResultado.length > 0 && (
              <ul className="frete-resultado">
                {freteResultado.map((op, i) => (
                  <li key={i} className="frete-opcao">
                    <span className="frete-opcao-nome">{op.opcao}</span>
                    <span className="frete-opcao-prazo">{op.prazo}</span>
                    <span className="frete-opcao-valor">{op.valor === 0 ? 'Grátis' : fmtBRL(op.valor)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="tabs">
        <div className="tabs-nav">
          {(['descricao', 'ficha', 'avaliacoes'] as const).map(tab => (
            <button key={tab} onClick={() => setTabAtiva(tab)}
              className={`tab-btn${tabAtiva === tab ? ' active' : ''}`}>
              {tab === 'descricao' && 'Informações do Produto'}
              {tab === 'ficha' && 'Ficha Técnica'}
              {tab === 'avaliacoes' && `Avaliações (${produto.totalAvaliacoes})`}
            </button>
          ))}
        </div>

        {tabAtiva === 'descricao' && (
          <div className="tab-content">
            <div className="produto-descricao" dangerouslySetInnerHTML={{ __html: produto.descricao }} />
          </div>
        )}

        {tabAtiva === 'ficha' && (
          <div className="tab-content">
            {produto.fichaTecnica && Object.keys(produto.fichaTecnica).length > 0 ? (
              <table className="ficha-tecnica">
                <tbody>
                  {Object.entries(produto.fichaTecnica).map(([key, val]) => (
                    <tr key={key}><td className="ficha-key">{key}</td><td className="ficha-val">{val}</td></tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: '#7C8096', padding: '1rem 0' }}>Ficha técnica não disponível.</p>
            )}
          </div>
        )}

        {tabAtiva === 'avaliacoes' && (
          <div className="tab-content">
            {produto.avaliacoes.length === 0 ? (
              <p style={{ color: '#7C8096', padding: '1rem 0' }}>Ainda não há avaliações para este produto.</p>
            ) : (
              <div className="avaliacoes-lista">
                {produto.avaliacoes.map(av => (
                  <div key={av.id} className="avaliacao-item">
                    <div className="avaliacao-header">
                      <div className="avaliacao-estrelas">
                        {[1,2,3,4,5].map(n => (
                          <svg key={n} viewBox="0 0 24 24" width={14} height={14}
                            fill={n <= av.estrelas ? '#F6C90E' : 'none'} stroke="#F6C90E" strokeWidth={0.5}>
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                          </svg>
                        ))}
                      </div>
                      <span className="avaliacao-nome">{av.nomeCliente}</span>
                      {av.cidade && <span className="avaliacao-cidade"> - {av.cidade}</span>}
                      <span className="avaliacao-data">{new Date(av.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                    {av.comentario && <p className="avaliacao-comentario">{av.comentario}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {relacionados.length > 0 && (
        <ProductShelf
          titulo="Produtos Relacionados"
          produtos={relacionados.map(p => ({
            id: p.id, slug: p.slug, nome: p.nome,
            precoOriginal: p.precoOriginal,
            preco: Number(p.preco),
            mediaAvaliacoes: Number(p.mediaEstrelas ?? 0),
            avaliacoes: p.totalAvaliacoes,
            imagem: p.fotos?.[0] ?? '/images/placeholder.jpg',
          }))}
        />
      )}
    </div>
  )
}
