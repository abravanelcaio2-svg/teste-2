'use client'

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'

export interface ItemCarrinho {
  id: string
  slug: string
  nome: string
  preco: number
  precoOriginal: number
  imagem: string
  quantidade: number
  varianteCor?: string
  varianteVoltagem?: string
}

interface CarrinhoState {
  itens: ItemCarrinho[]
  cepFrete?: string
  freteOpcaoSelecionada?: string
  freteSelecionadoValor?: number
  cupom?: string
  descontoCupom?: number
}

type Action =
  | { type: 'ADICIONAR'; item: Omit<ItemCarrinho, 'quantidade'> & { quantidade?: number } }
  | { type: 'REMOVER'; id: string }
  | { type: 'ATUALIZAR_QTD'; id: string; quantidade: number }
  | { type: 'LIMPAR' }
  | { type: 'SET_FRETE'; cep: string; opcao: string; valor: number }
  | { type: 'SET_CUPOM'; cupom: string; desconto: number }
  | { type: 'HYDRATE'; state: CarrinhoState }

function reducer(state: CarrinhoState, action: Action): CarrinhoState {
  switch (action.type) {
    case 'ADICIONAR': {
      const existe = state.itens.find(i => i.id === action.item.id)
      if (existe) {
        return {
          ...state,
          itens: state.itens.map(i =>
            i.id === action.item.id
              ? { ...i, quantidade: i.quantidade + (action.item.quantidade ?? 1) }
              : i
          ),
        }
      }
      return {
        ...state,
        itens: [...state.itens, { ...action.item, quantidade: action.item.quantidade ?? 1 }],
      }
    }
    case 'REMOVER':
      return { ...state, itens: state.itens.filter(i => i.id !== action.id) }
    case 'ATUALIZAR_QTD':
      if (action.quantidade <= 0) {
        return { ...state, itens: state.itens.filter(i => i.id !== action.id) }
      }
      return {
        ...state,
        itens: state.itens.map(i =>
          i.id === action.id ? { ...i, quantidade: action.quantidade } : i
        ),
      }
    case 'LIMPAR':
      return { itens: [] }
    case 'SET_FRETE':
      return {
        ...state,
        cepFrete: action.cep,
        freteOpcaoSelecionada: action.opcao,
        freteSelecionadoValor: action.valor,
      }
    case 'SET_CUPOM':
      return { ...state, cupom: action.cupom, descontoCupom: action.desconto }
    case 'HYDRATE':
      return action.state
    default:
      return state
  }
}

interface CarrinhoCtx {
  itens: ItemCarrinho[]
  totalItens: number
  subtotal: number
  frete: number
  total: number
  cepFrete?: string
  freteOpcaoSelecionada?: string
  cupom?: string
  descontoCupom?: number
  adicionarItem: (item: Omit<ItemCarrinho, 'quantidade'> & { quantidade?: number }) => void
  removerItem: (id: string) => void
  atualizarQuantidade: (id: string, quantidade: number) => void
  limparCarrinho: () => void
  setFrete: (cep: string, opcao: string, valor: number) => void
  setCupom: (cupom: string, desconto: number) => void
}

const CarrinhoContext = createContext<CarrinhoCtx | null>(null)

export function CarrinhoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { itens: [] })

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gazin_carrinho')
      if (saved) {
        const parsed = JSON.parse(saved) as CarrinhoState
        dispatch({ type: 'HYDRATE', state: parsed })
      }
    } catch {}
  }, [])

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('gazin_carrinho', JSON.stringify(state))
    } catch {}
  }, [state])

  const totalItens = state.itens.reduce((acc, i) => acc + i.quantidade, 0)
  const subtotal = state.itens.reduce((acc, i) => acc + i.preco * i.quantidade, 0)
  const frete = state.freteSelecionadoValor ?? 0
  const descCupom = state.descontoCupom ?? 0
  const total = Math.max(0, subtotal + frete - descCupom)

  return (
    <CarrinhoContext.Provider value={{
      itens: state.itens,
      totalItens,
      subtotal,
      frete,
      total,
      cepFrete: state.cepFrete,
      freteOpcaoSelecionada: state.freteOpcaoSelecionada,
      cupom: state.cupom,
      descontoCupom: state.descontoCupom,
      adicionarItem: (item) => dispatch({ type: 'ADICIONAR', item }),
      removerItem: (id) => dispatch({ type: 'REMOVER', id }),
      atualizarQuantidade: (id, quantidade) => dispatch({ type: 'ATUALIZAR_QTD', id, quantidade }),
      limparCarrinho: () => dispatch({ type: 'LIMPAR' }),
      setFrete: (cep, opcao, valor) => dispatch({ type: 'SET_FRETE', cep, opcao, valor }),
      setCupom: (cupom, desconto) => dispatch({ type: 'SET_CUPOM', cupom, desconto }),
    }}>
      {children}
    </CarrinhoContext.Provider>
  )
}

export function useCarrinho() {
  const ctx = useContext(CarrinhoContext)
  if (!ctx) throw new Error('useCarrinho must be used inside CarrinhoProvider')
  return ctx
}
