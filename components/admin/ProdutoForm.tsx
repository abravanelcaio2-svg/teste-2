'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { slugify } from '@/lib/utils'

/* ── Tipos ────────────────────────────────────────────────────── */
interface Variacao {
  id?: string
  tipo: string   // 'cor' | 'voltagem' | 'tamanho'
  valor: string
  ativo: boolean
}

interface Categoria {
  id: string
  nome: string
}

interface ProdutoFormProps {
  /** Dados do produto quando em modo edição. Undefined = modo criação */
  produto?: {
    id: string
    nome: string
    slug: string
    codigo: string | null
    descricao: string
    preco: number
    precoOriginal: number | null
    categoriaId: string
    fotos: string[]
    ativo: boolean
    mediaEstrelas: number
    totalAvaliacoes: number
    temCor: boolean
    temVoltagem: boolean
    temTamanho: boolean
    variacoes: Variacao[]
  }
}

/* ── Componente ───────────────────────────────────────────────── */
export function ProdutoForm({ produto }: ProdutoFormProps) {
  const router  = useRouter()
  const isEdit  = !!produto

  /* estados do formulário */
  const [nome,           setNome]           = useState(produto?.nome           ?? '')
  const [slug,           setSlug]           = useState(produto?.slug           ?? '')
  const [codigo,         setCodigo]         = useState(produto?.codigo         ?? '')
  const [descricao,      setDescricao]      = useState(produto?.descricao      ?? '')
  const [preco,          setPreco]          = useState(String(produto?.preco   ?? ''))
  const [precoOriginal,  setPrecoOriginal]  = useState(String(produto?.precoOriginal ?? ''))
  const [categoriaId,    setCategoriaId]    = useState(produto?.categoriaId    ?? '')
  const [fotos,          setFotos]          = useState<string[]>(produto?.fotos ?? [])
  const [ativo,          setAtivo]          = useState(produto?.ativo          ?? true)
  const [mediaEstrelas,  setMediaEstrelas]  = useState(String(produto?.mediaEstrelas  ?? '0'))
  const [totalAvaliacoes,setTotalAvaliacoes]= useState(String(produto?.totalAvaliacoes ?? '0'))
  const [temCor,         setTemCor]         = useState(produto?.temCor         ?? false)
  const [temVoltagem,    setTemVoltagem]    = useState(produto?.temVoltagem    ?? false)
  const [temTamanho,     setTemTamanho]     = useState(produto?.temTamanho     ?? false)
  const [variacoes,      setVariacoes]      = useState<Variacao[]>(produto?.variacoes ?? [])

  const [categorias,     setCategorias]     = useState<Categoria[]>([])
  const [uploading,      setUploading]      = useState(false)
  const [saving,         setSaving]         = useState(false)
  const [erro,           setErro]           = useState('')

  /* auto-slug somente na criação */
  useEffect(() => {
    if (!isEdit) setSlug(slugify(nome))
  }, [nome, isEdit])

  /* carrega categorias */
  useEffect(() => {
    fetch('/api/admin/categorias')
      .then((r) => r.json())
      .then(setCategorias)
      .catch(() => {})
  }, [])

  /* ── Upload de foto ──────────────────────────────────────────── */
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('tipo', 'produto')
      const res  = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) setFotos((prev) => [...prev, data.url])
      else setErro(data.erro || 'Erro no upload.')
    } catch {
      setErro('Erro no upload.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  function removerFoto(url: string) {
    setFotos((prev) => prev.filter((f) => f !== url))
  }

  /* ── Variações ───────────────────────────────────────────────── */
  function addVariacao(tipo: string) {
    setVariacoes((prev) => [...prev, { tipo, valor: '', ativo: true }])
  }

  function updateVariacao(i: number, field: keyof Variacao, val: any) {
    setVariacoes((prev) => prev.map((v, idx) => idx === i ? { ...v, [field]: val } : v))
  }

  function removeVariacao(i: number) {
    setVariacoes((prev) => prev.filter((_, idx) => idx !== i))
  }

  /* ── Submit ──────────────────────────────────────────────────── */
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setErro('')

    const payload = {
      nome, slug, codigo: codigo || null,
      descricao, preco, precoOriginal: precoOriginal || null,
      categoriaId, fotos, ativo,
      mediaEstrelas, totalAvaliacoes,
      temCor, temVoltagem, temTamanho,
      variacoes,
    }

    try {
      const url    = isEdit ? `/api/admin/produtos/${produto!.id}` : '/api/admin/produtos'
      const method = isEdit ? 'PUT' : 'POST'
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok) {
        setErro(data.erro || 'Erro ao salvar.')
        return
      }
      router.push('/admin/produtos')
      router.refresh()
    } catch {
      setErro('Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {erro}
        </div>
      )}

      {/* ── Informações básicas ── */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">Informações básicas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              type="text" required value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL)</label>
            <input
              type="text" value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código (SKU)</label>
            <input
              type="text" value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preço (R$) <span className="text-red-500">*</span>
            </label>
            <input
              type="number" step="0.01" min="0" required value={preco}
              onChange={(e) => setPreco(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preço original (R$)
              <span className="text-xs text-gray-400 ml-1">— exibido riscado</span>
            </label>
            <input
              type="number" step="0.01" min="0" value={precoOriginal}
              onChange={(e) => setPrecoOriginal(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoria <span className="text-red-500">*</span>
            </label>
            <select
              required value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Selecione…</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox" id="ativo" checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="ativo" className="text-sm font-medium text-gray-700">
              Produto ativo (visível na loja)
            </label>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição <span className="text-red-500">*</span>
            </label>
            <textarea
              required rows={5} value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </section>

      {/* ── Fotos ── */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">Fotos do produto</h2>

        <div className="flex flex-wrap gap-3 mb-4">
          {fotos.map((url, i) => (
            <div key={i} className="relative group w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`foto ${i + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removerFoto(url)}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xl"
              >
                ✕
              </button>
            </div>
          ))}

          <label className={`w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-blue-400 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            <span className="text-2xl mb-1">+</span>
            <span className="text-xs">Upload</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleUpload} />
          </label>
        </div>

        {uploading && <p className="text-sm text-blue-600">Enviando imagem…</p>}
        <p className="text-xs text-gray-400">JPG, PNG ou WebP · máx 5 MB · primeira foto = capa</p>
      </section>

      {/* ── Variações ── */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Variações</h2>
        <p className="text-sm text-gray-500 mb-5">
          Ative os tipos de variação e cadastre os valores disponíveis.
        </p>

        {/* Toggles */}
        <div className="flex flex-wrap gap-4 mb-6">
          {[
            { key: 'temCor',      label: 'Cor',      val: temCor,      set: setTemCor,      tipo: 'cor'      },
            { key: 'temVoltagem', label: 'Voltagem',  val: temVoltagem, set: setTemVoltagem, tipo: 'voltagem' },
            { key: 'temTamanho',  label: 'Tamanho',   val: temTamanho,  set: setTemTamanho,  tipo: 'tamanho'  },
          ].map(({ key, label, val, set, tipo }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox" checked={val}
                onChange={(e) => {
                  set(e.target.checked)
                  if (!e.target.checked)
                    setVariacoes((prev) => prev.filter((v) => v.tipo !== tipo))
                }}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">{label}</span>
            </label>
          ))}
        </div>

        {/* Botões add variação */}
        <div className="flex gap-2 mb-4">
          {temCor && (
            <button type="button" onClick={() => addVariacao('cor')}
              className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
              + Cor
            </button>
          )}
          {temVoltagem && (
            <button type="button" onClick={() => addVariacao('voltagem')}
              className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
              + Voltagem
            </button>
          )}
          {temTamanho && (
            <button type="button" onClick={() => addVariacao('tamanho')}
              className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
              + Tamanho
            </button>
          )}
        </div>

        {/* Lista de variações */}
        {variacoes.length > 0 && (
          <div className="space-y-2">
            {variacoes.map((v, i) => (
              <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-xs font-medium text-gray-500 w-20 capitalize">{v.tipo}</span>
                <input
                  type="text" placeholder="Ex: Vermelho, 110v, P…"
                  value={v.valor}
                  onChange={(e) => updateVariacao(i, 'valor', e.target.value)}
                  className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <label className="flex items-center gap-1.5 text-xs text-gray-600">
                  <input
                    type="checkbox" checked={v.ativo}
                    onChange={(e) => updateVariacao(i, 'ativo', e.target.checked)}
                    className="w-3.5 h-3.5"
                  />
                  Ativo
                </label>
                <button
                  type="button"
                  onClick={() => removeVariacao(i)}
                  className="text-gray-400 hover:text-red-500 transition-colors text-lg leading-none"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Avaliações (apenas edição) ── */}
      {isEdit && (
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-5">Dados de avaliação</h2>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Média de estrelas</label>
              <input
                type="number" step="0.1" min="0" max="5" value={mediaEstrelas}
                onChange={(e) => setMediaEstrelas(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total de avaliações</label>
              <input
                type="number" min="0" value={totalAvaliacoes}
                onChange={(e) => setTotalAvaliacoes(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </section>
      )}

      {/* ── Ações ── */}
      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit" disabled={saving}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Criar produto'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
