'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function BuscaClient({ initialQuery }: { initialQuery: string }) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/busca?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <div className="mb-8">
      <form onSubmit={handleSubmit} className="flex gap-2 max-w-2xl">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Busque por produto, marca, modelo…"
          autoFocus
          className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          🔍 Buscar
        </button>
      </form>
    </div>
  )
}
