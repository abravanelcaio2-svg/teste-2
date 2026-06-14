export const dynamic = 'force-dynamic'
'use client'

import { useState, useEffect, FormEvent } from 'react'

interface Config {
  site_nome?: string
  site_descricao?: string
  logo_url?: string
  prazo_entrega_dias?: string
  frete_gratis_acima?: string
  correios_cep_origem?: string
  asaas_api_key?: string
  asaas_env?: string
}

export default function AdminConfigPage() {
  const [config,    setConfig]    = useState<Config>({})
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [uploading, setUploading] = useState(false)
  const [ok,        setOk]        = useState('')
  const [erro,      setErro]      = useState('')

  useEffect(() => {
    fetch('/api/admin/config')
      .then((r) => r.json())
      .then((data) => { setConfig(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function salvarChave(key: string, value: string) {
    const res = await fetch('/api/admin/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    })
    return res.ok
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true); setOk(''); setErro('')
    try {
      const entries = Object.entries(config)
      const results = await Promise.all(
        entries.map(([k, v]) => salvarChave(k, v ?? ''))
      )
      if (results.every(Boolean)) setOk('Configurações salvas com sucesso!')
      else setErro('Algumas configurações não puderam ser salvas.')
    } catch {
      setErro('Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('tipo', 'logo')
      const res  = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) setConfig((c) => ({ ...c, logo_url: data.url }))
      else setErro(data.erro || 'Erro no upload do logo.')
    } catch {
      setErro('Erro no upload do logo.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  function field(key: keyof Config) {
    return {
      value:    config[key] ?? '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setConfig((c) => ({ ...c, [key]: e.target.value })),
    }
  }

  if (loading) return <div className="p-8 text-gray-400">Carregando…</div>

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Configurações do site</h1>

      <form onSubmit={handleSubmit} className="space-y-6">

        {ok   && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{ok}</div>}
        {erro && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{erro}</div>}

        {/* ── Identidade ── */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <h2 className="text-base font-semibold text-gray-900">Identidade da loja</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do site</label>
            <input
              type="text"
              {...field('site_nome')}
              placeholder="Minha Loja"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              rows={2}
              value={config.site_descricao ?? ''}
              onChange={(e) => setConfig((c) => ({ ...c, site_descricao: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
            <div className="flex items-center gap-4">
              {config.logo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={config.logo_url} alt="Logo" className="h-12 object-contain border border-gray-200 rounded-lg p-1" />
              )}
              <label className={`text-sm px-4 py-2 rounded-lg border border-gray-300 cursor-pointer hover:bg-gray-50 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                {uploading ? 'Enviando…' : config.logo_url ? 'Trocar logo' : 'Upload logo'}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleLogoUpload} />
              </label>
            </div>
          </div>
        </section>

        {/* ── Entrega ── */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <h2 className="text-base font-semibold text-gray-900">Entrega e frete</h2>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prazo de entrega (dias úteis)
              </label>
              <input
                type="number" min="1"
                {...field('prazo_entrega_dias')}
                placeholder="7"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frete grátis acima de (R$)
              </label>
              <input
                type="number" min="0" step="0.01"
                {...field('frete_gratis_acima')}
                placeholder="200"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">0 = frete nunca é grátis</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CEP de origem (Correios)
            </label>
            <input
              type="text" maxLength={9}
              {...field('correios_cep_origem')}
              placeholder="87013-060"
              className="w-full max-w-xs border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
        </section>

        {/* ── Asaas ── */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Pagamentos (Asaas)</h2>
            <a
              href="https://www.asaas.com"
              target="_blank" rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:underline"
            >
              Painel Asaas ↗
            </a>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ambiente
            </label>
            <select
              value={config.asaas_env ?? 'sandbox'}
              onChange={(e) => setConfig((c) => ({ ...c, asaas_env: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="sandbox">Sandbox (testes)</option>
              <option value="producao">Produção</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <input
              type="password"
              {...field('asaas_api_key')}
              placeholder="$aact_…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <p className="text-xs text-gray-400 mt-1">
              Encontre em: Asaas → Integrações → Configurações → Chaves de API
            </p>
          </div>
        </section>

        {/* Salvar */}
        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit" disabled={saving}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? 'Salvando…' : 'Salvar configurações'}
          </button>
        </div>
      </form>
    </div>
  )
}
