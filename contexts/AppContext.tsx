import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  query,
  setDoc,
  deleteDoc,
  addDoc,
  getDoc,
  updateDoc,
  where,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Verifique o caminho para o seu arquivo de configuração

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
  adicionarProduto: (produto: Omit<Produto, 'id' | 'dataCadastro'>) => Promise<void>;
  atualizarProduto: (id: string, produto: Partial<Produto>) => Promise<void>;
  removerProduto: (id: string) => Promise<void>;
  abrirCaixa: (nome: string, trocoInicial: number) => Promise<void>;
  fecharCaixa: () => Promise<void>;
  excluirCaixa: (caixaId: string) => Promise<void>;
  adicionarVenda: (venda: Omit<Venda, 'id'>) => Promise<void>;
  buscarProdutoPorCodigo: (codigo: string) => Promise<Produto | undefined>;
  atualizarEstoque: (produtoId: string, quantidade: number) => Promise<void>;
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

  useEffect(() => {
    const produtosRef = collection(db, 'produtos');
    const caixasRef = collection(db, 'caixas');
    const vendasRef = collection(db, 'vendas');

    const unsubscribeProdutos = onSnapshot(produtosRef, (snapshot) => {
      const produtosData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Produto[];
      setProdutos(produtosData);
    });

    const unsubscribeCaixas = onSnapshot(caixasRef, (snapshot) => {
      const caixasData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Caixa[];
      setCaixas(caixasData);
      const caixaAberto = caixasData.find(c => c.status === 'aberto');
      setCaixaAtual(caixaAberto || null);
    });

    const unsubscribeVendas = onSnapshot(vendasRef, (snapshot) => {
      const vendasData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Venda[];
      setVendas(vendasData);
    });

    return () => {
      unsubscribeProdutos();
      unsubscribeCaixas();
      unsubscribeVendas();
    };
  }, []);

  const adicionarProduto = async (produto: Omit<Produto, 'id' | 'dataCadastro'>) => {
    try {
      const novoProduto = {
        ...produto,
        dataCadastro: new Date().toISOString(),
      };
      await addDoc(collection(db, 'produtos'), novoProduto);
    } catch (e) {
      console.error('Erro ao adicionar produto: ', e);
    }
  };

  const atualizarProduto = async (id: string, produto: Partial<Produto>) => {
    try {
      const produtoRef = doc(db, 'produtos', id);
      await updateDoc(produtoRef, produto);
    } catch (e) {
      console.error('Erro ao atualizar produto: ', e);
    }
  };

  const removerProduto = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'produtos', id));
    } catch (e) {
      console.error('Erro ao remover produto: ', e);
    }
  };

  const abrirCaixa = async (nome: string, trocoInicial: number) => {
    try {
      const caixaAbertoExistente = caixas.find(c => c.status === 'aberto');
      if (caixaAbertoExistente) {
        throw new Error('Já existe um caixa aberto!');
      }

      const novoCaixa: Caixa = {
        id: '', // será gerado pelo Firestore
        nome,
        dataAbertura: new Date().toISOString(),
        itens: produtos.map(p => ({ produto: p, quantidade: 0 })),
        vendas: [],
        totalVendas: 0,
        trocoInicial,
        status: 'aberto',
      };
      await addDoc(collection(db, 'caixas'), novoCaixa);
    } catch (e) {
      console.error('Erro ao abrir caixa:', e);
    }
  };

  const fecharCaixa = async () => {
    if (!caixaAtual) return;
    try {
      const caixaRef = doc(db, 'caixas', caixaAtual.id);
      await updateDoc(caixaRef, {
        dataFechamento: new Date().toISOString(),
        status: 'fechado',
      });
    } catch (e) {
      console.error('Erro ao fechar caixa:', e);
    }
  };

  const excluirCaixa = async (caixaId: string) => {
    try {
      const caixaParaExcluir = caixas.find(c => c.id === caixaId);
      if (!caixaParaExcluir) {
        throw new Error('Caixa não encontrado!');
      }
      if (caixaParaExcluir.status === 'aberto') {
        throw new Error('Não é possível excluir um caixa aberto!');
      }

      const vendasDoCaixaQuery = query(collection(db, 'vendas'), where('caixaId', '==', caixaId));
      const vendasSnapshot = await getDocs(vendasDoCaixaQuery);
      
      const batch = writeBatch(db);
      
      vendasSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      batch.delete(doc(db, 'caixas', caixaId));
      await batch.commit();
    } catch (e) {
      console.error('Erro ao excluir caixa:', e);
    }
  };

  const adicionarVenda = async (venda: Omit<Venda, 'id'>) => {
    if (!caixaAtual) return;
    try {
      const novaVenda = { ...venda, caixaId: caixaAtual.id };
      const vendaRef = await addDoc(collection(db, 'vendas'), novaVenda);

      const caixaRef = doc(db, 'caixas', caixaAtual.id);
      await updateDoc(caixaRef, {
        vendas: [...caixaAtual.vendas, { ...novaVenda, id: vendaRef.id }],
        totalVendas: caixaAtual.totalVendas + novaVenda.total,
      });
    } catch (e) {
      console.error('Erro ao adicionar venda:', e);
    }
  };
  
  const buscarProdutoPorCodigo = async (codigo: string) => {
    const q = query(collection(db, 'produtos'), where('codigo', '==', codigo));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const docData = querySnapshot.docs[0];
      return { id: docData.id, ...docData.data() } as Produto;
    }
    return undefined;
  };

  const atualizarEstoque = async (produtoId: string, quantidade: number) => {
    try {
      const produtoRef = doc(db, 'produtos', produtoId);
      const produtoSnap = await getDoc(produtoRef);
      if (produtoSnap.exists()) {
        const produtoData = produtoSnap.data() as Produto;
        const novoEstoque = Math.max(0, produtoData.estoque - quantidade);
        await updateDoc(produtoRef, { estoque: novoEstoque });
      }
    } catch (e) {
      console.error('Erro ao atualizar estoque:', e);
    }
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
    excluirCaixa,
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
