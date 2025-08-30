import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export interface Produto {
  id: string;
  nome: string;
  preco: number;
  estoque: number;
  categoria: string;
  codigo: string;
  dataCadastro: string;
}

export interface ItemVenda {
  produto: Produto;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}

export interface Venda {
  id: string;
  itens: ItemVenda[];
  total: number;
  formaPagamento: 'dinheiro' | 'cartao' | 'pix';
  data: string;
  desconto: number;
  troco: number;
}

interface AppContextType {
  produtos: Produto[];
  vendas: Venda[];
  adicionarProduto: (produto: Omit<Produto, 'id' | 'dataCadastro'>) => void;
  atualizarProduto: (id: string, produto: Partial<Produto>) => void;
  removerProduto: (id: string) => void;
  adicionarVenda: (venda: Omit<Venda, 'id'>) => void;
  buscarProdutoPorCodigo: (codigo: string) => Produto | undefined;
  atualizarEstoque: (produtoId: string, quantidade: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext deve ser usado dentro de um AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [vendas, setVendas] = useState<Venda[]>([]);

  // Carregar dados salvos
  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const produtosSalvos = await AsyncStorage.getItem('produtos');
      const vendasSalvas = await AsyncStorage.getItem('vendas');
      
      if (produtosSalvos) {
        setProdutos(JSON.parse(produtosSalvos));
      }
      if (vendasSalvas) {
        setVendas(JSON.parse(vendasSalvas));
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const salvarProdutos = async (novosProdutos: Produto[]) => {
    try {
      await AsyncStorage.setItem('produtos', JSON.stringify(novosProdutos));
    } catch (error) {
      console.error('Erro ao salvar produtos:', error);
    }
  };

  const salvarVendas = async (novasVendas: Venda[]) => {
    try {
      await AsyncStorage.setItem('vendas', JSON.stringify(novasVendas));
    } catch (error) {
      console.error('Erro ao salvar vendas:', error);
    }
  };

  const adicionarProduto = (produto: Omit<Produto, 'id' | 'dataCadastro'>) => {
    const novoProduto: Produto = {
      ...produto,
      id: Date.now().toString(),
      dataCadastro: new Date().toISOString(),
    };
    const novosProdutos = [...produtos, novoProduto];
    setProdutos(novosProdutos);
    salvarProdutos(novosProdutos);
  };

  const atualizarProduto = (id: string, produto: Partial<Produto>) => {
    const novosProdutos = produtos.map(p => 
      p.id === id ? { ...p, ...produto } : p
    );
    setProdutos(novosProdutos);
    salvarProdutos(novosProdutos);
  };

  const removerProduto = (id: string) => {
    const novosProdutos = produtos.filter(p => p.id !== id);
    setProdutos(novosProdutos);
    salvarProdutos(novosProdutos);
  };

  const adicionarVenda = (venda: Omit<Venda, 'id'>) => {
    const novaVenda: Venda = {
      ...venda,
      id: Date.now().toString(),
    };
    const novasVendas = [...vendas, novaVenda];
    setVendas(novasVendas);
    salvarVendas(novasVendas);
  };

  const buscarProdutoPorCodigo = (codigo: string) => {
    return produtos.find(p => p.codigo === codigo);
  };

  const atualizarEstoque = (produtoId: string, quantidade: number) => {
    const novosProdutos = produtos.map(p => 
      p.id === produtoId 
        ? { ...p, estoque: Math.max(0, p.estoque - quantidade) }
        : p
    );
    setProdutos(novosProdutos);
    salvarProdutos(novosProdutos);
  };

  const value: AppContextType = {
    produtos,
    vendas,
    adicionarProduto,
    atualizarProduto,
    removerProduto,
    adicionarVenda,
    buscarProdutoPorCodigo,
    atualizarEstoque,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}; 