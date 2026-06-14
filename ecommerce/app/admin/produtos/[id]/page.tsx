export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ProdutoForm } from '@/components/admin/ProdutoForm'

interface Props {
  params: { id: string }
}

async function getProduto(id: string) {
  const res = await fetch(
    `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/api/admin/produtos/${id}`,
    { cache: 'no-store' }
  )
  if (!res.ok) return null
  return res.json()
}

export default async function AdminEditarProdutoPage({ params }: Props) {
  const produto = await getProduto(params.id)
  if (!produto) notFound()

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/produtos" className="text-gray-400 hover:text-gray-600 text-sm">
          ← Produtos
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Editar produto</h1>
        <span className="text-sm text-gray-400 font-mono">{produto.nome}</span>
      </div>

      <ProdutoForm produto={produto} />
    </div>
  )
}
