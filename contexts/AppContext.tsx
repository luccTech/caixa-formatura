import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export interface Produto {
  id: string;
  nome: string;
  preco: number;
  estoque: number;
  codigo: string;
  dataCadastro: string;
}

export interface ItemCaixa {
  produto: Produto;
  quantidade: number;
}

export interface Caixa {
  id: string;
  nome: string;
  dataAbertura: string;
  dataFechamento?: string;
  itens: ItemCaixa[];
  vendas: Venda[];
  totalVendas: number;
  trocoInicial: number;
  status: 'aberto' | 'fechado';
}

export interface ItemVenda {
  produto: Produto;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}

export interface Venda {
  id: string;
  caixaId: string;
  itens: ItemVenda[];
  total: number;
  formaPagamento: 'dinheiro' | 'pix' | 'combinar';
  pagamentoDinheiro?: number;
  pagamentoPix?: number;
  data: string;
  desconto: number;
  troco: number;
}

interface AppContextType {
  produtos: Produto[];
  caixas: Caixa[];
  caixaAtual: Caixa | null;
  vendas: Venda[];
  adicionarProduto: (produto: Omit<Produto, 'id' | 'dataCadastro'>) => void;
  atualizarProduto: (id: string, produto: Partial<Produto>) => void;
  removerProduto: (id: string) => void;
  abrirCaixa: (nome: string, trocoInicial: number) => void;
  fecharCaixa: () => void;
  adicionarVenda: (venda: Omit<Venda, 'id'>) => void;
  buscarProdutoPorCodigo: (codigo: string) => Produto | undefined;
  atualizarEstoque: (produtoId: string, quantidade: number) => void;
  getVendasPorCaixa: (caixaId: string) => Venda[];
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
  const [caixas, setCaixas] = useState<Caixa[]>([]);
  const [caixaAtual, setCaixaAtual] = useState<Caixa | null>(null);
  const [vendas, setVendas] = useState<Venda[]>([]);

  // Carregar dados salvos
  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const produtosSalvos = await AsyncStorage.getItem('produtos');
      const caixasSalvas = await AsyncStorage.getItem('caixas');
      const vendasSalvas = await AsyncStorage.getItem('vendas');
      const caixaAtualSalvo = await AsyncStorage.getItem('caixaAtual');
      
      if (produtosSalvos) {
        setProdutos(JSON.parse(produtosSalvos));
      }
      if (caixasSalvas) {
        setCaixas(JSON.parse(caixasSalvas));
      }
      if (vendasSalvas) {
        setVendas(JSON.parse(vendasSalvas));
      }
      if (caixaAtualSalvo) {
        setCaixaAtual(JSON.parse(caixaAtualSalvo));
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

  const salvarCaixas = async (novasCaixas: Caixa[]) => {
    try {
      await AsyncStorage.setItem('caixas', JSON.stringify(novasCaixas));
    } catch (error) {
      console.error('Erro ao salvar caixas:', error);
    }
  };

  const salvarVendas = async (novasVendas: Venda[]) => {
    try {
      await AsyncStorage.setItem('vendas', JSON.stringify(novasVendas));
    } catch (error) {
      console.error('Erro ao salvar vendas:', error);
    }
  };

  const salvarCaixaAtual = async (caixa: Caixa | null) => {
    try {
      await AsyncStorage.setItem('caixaAtual', JSON.stringify(caixa));
    } catch (error) {
      console.error('Erro ao salvar caixa atual:', error);
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

  const abrirCaixa = (nome: string, trocoInicial: number) => {
    if (caixaAtual) {
      throw new Error('Já existe um caixa aberto!');
    }

    // Criar itens do caixa com todos os produtos existentes (quantidade 0)
    const itensCaixa: ItemCaixa[] = produtos.map(produto => ({
      produto,
      quantidade: 0,
    }));

    const novoCaixa: Caixa = {
      id: Date.now().toString(),
      nome,
      dataAbertura: new Date().toISOString(),
      itens: itensCaixa,
      vendas: [],
      totalVendas: 0,
      trocoInicial,
      status: 'aberto',
    };

    const novasCaixas = [...caixas, novoCaixa];
    setCaixas(novasCaixas);
    setCaixaAtual(novoCaixa);
    salvarCaixas(novasCaixas);
    salvarCaixaAtual(novoCaixa);
  };

  const fecharCaixa = () => {
    if (!caixaAtual) {
      throw new Error('Nenhum caixa está aberto!');
    }

    const caixaFechado: Caixa = {
      ...caixaAtual,
      dataFechamento: new Date().toISOString(),
      status: 'fechado',
    };

    const novasCaixas = caixas.map(c => 
      c.id === caixaAtual.id ? caixaFechado : c
    );

    setCaixas(novasCaixas);
    setCaixaAtual(null);
    salvarCaixas(novasCaixas);
    salvarCaixaAtual(null);
  };

  const adicionarVenda = (venda: Omit<Venda, 'id'>) => {
    if (!caixaAtual) {
      throw new Error('Nenhum caixa está aberto!');
    }

    const novaVenda: Venda = {
      ...venda,
      id: Date.now().toString(),
    };

    const novasVendas = [...vendas, novaVenda];
    setVendas(novasVendas);

    // Atualizar caixa atual
    const caixaAtualizado = {
      ...caixaAtual,
      vendas: [...caixaAtual.vendas, novaVenda],
      totalVendas: caixaAtual.totalVendas + novaVenda.total,
    };
    setCaixaAtual(caixaAtualizado);

    // Atualizar caixas
    const novasCaixas = caixas.map(c => 
      c.id === caixaAtual.id ? caixaAtualizado : c
    );
    setCaixas(novasCaixas);

    salvarVendas(novasVendas);
    salvarCaixas(novasCaixas);
    salvarCaixaAtual(caixaAtualizado);
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

  const getVendasPorCaixa = (caixaId: string) => {
    return vendas.filter(venda => venda.caixaId === caixaId);
  };

  const value: AppContextType = {
    produtos,
    caixas,
    caixaAtual,
    vendas,
    adicionarProduto,
    atualizarProduto,
    removerProduto,
    abrirCaixa,
    fecharCaixa,
    adicionarVenda,
    buscarProdutoPorCodigo,
    atualizarEstoque,
    getVendasPorCaixa,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}; 