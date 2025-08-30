import React, { useRef, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import {
    Button,
    Card,
    Divider,
    IconButton,
    Modal,
    Portal,
    SegmentedButtons,
    Text,
    TextInput
} from 'react-native-paper';
import { ItemVenda, Produto, useAppContext } from '../../contexts/AppContext';

export default function CaixaScreen() {
  const { 
    produtos, 
    caixaAtual, 
    abrirCaixa, 
    fecharCaixa, 
    adicionarItemAoCaixa, 
    removerItemDoCaixa,
    atualizarQuantidadeCaixa,
    adicionarVenda, 
    atualizarEstoque 
  } = useAppContext();
  
  const [modalAbertura, setModalAbertura] = useState(false);
  const [modalAdicionarProduto, setModalAdicionarProduto] = useState(false);
  const [modalPagamento, setModalPagamento] = useState(false);
  const [nomeCaixa, setNomeCaixa] = useState('');
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [quantidadeProduto, setQuantidadeProduto] = useState('1');
  const [carrinho, setCarrinho] = useState<ItemVenda[]>([]);
  const [formaPagamento, setFormaPagamento] = useState<'dinheiro' | 'cartao' | 'pix'>('dinheiro');
  const [valorRecebido, setValorRecebido] = useState('');
  const [desconto, setDesconto] = useState('0');
  
  const nomeInputRef = useRef<any>(null);

  const totalCarrinho = carrinho.reduce((sum, item) => sum + item.subtotal, 0);
  const descontoValor = parseFloat(desconto) || 0;
  const totalFinal = totalCarrinho - descontoValor;

  const handleAbrirCaixa = () => {
    if (!nomeCaixa.trim()) {
      Alert.alert('Erro', 'Digite um nome para o caixa!');
      return;
    }

    try {
      abrirCaixa(nomeCaixa);
      setModalAbertura(false);
      setNomeCaixa('');
      Alert.alert('Sucesso', 'Caixa aberto com sucesso!');
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Erro ao abrir caixa');
    }
  };

  const handleFecharCaixa = () => {
    Alert.alert(
      'Fechar Caixa',
      `Deseja realmente fechar o caixa "${caixaAtual?.nome}"?\n\nTotal de vendas: R$ ${caixaAtual?.totalVendas.toFixed(2) || '0.00'}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Fechar', 
          style: 'destructive',
          onPress: () => {
            try {
              fecharCaixa();
              Alert.alert('Sucesso', 'Caixa fechado com sucesso!');
            } catch (error) {
              Alert.alert('Erro', error instanceof Error ? error.message : 'Erro ao fechar caixa');
            }
          }
        },
      ]
    );
  };

  const abrirModalAdicionarProduto = () => {
    setModalAdicionarProduto(true);
    setProdutoSelecionado(null);
    setQuantidadeProduto('1');
  };

  const selecionarProduto = (produto: Produto) => {
    setProdutoSelecionado(produto);
  };

  const adicionarProdutoAoCaixa = () => {
    if (!produtoSelecionado) {
      Alert.alert('Erro', 'Selecione um produto!');
      return;
    }

    const quantidade = parseInt(quantidadeProduto);
    if (isNaN(quantidade) || quantidade <= 0) {
      Alert.alert('Erro', 'Quantidade deve ser um número válido!');
      return;
    }

    if (quantidade > produtoSelecionado.estoque) {
      Alert.alert('Erro', 'Quantidade maior que o estoque disponível!');
      return;
    }

    try {
      adicionarItemAoCaixa(produtoSelecionado.id, quantidade);
      setModalAdicionarProduto(false);
      setProdutoSelecionado(null);
      setQuantidadeProduto('1');
      Alert.alert('Sucesso', 'Produto adicionado ao caixa!');
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Erro ao adicionar produto');
    }
  };

  const removerProdutoDoCaixa = (produtoId: string) => {
    Alert.alert(
      'Remover Produto',
      'Deseja realmente remover este produto do caixa?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Remover', 
          style: 'destructive',
          onPress: () => {
            try {
              removerItemDoCaixa(produtoId);
              Alert.alert('Sucesso', 'Produto removido do caixa!');
            } catch (error) {
              Alert.alert('Erro', error instanceof Error ? error.message : 'Erro ao remover produto');
            }
          }
        },
      ]
    );
  };

  const alterarQuantidadeCaixa = (produtoId: string, novaQuantidade: number) => {
    try {
      atualizarQuantidadeCaixa(produtoId, novaQuantidade);
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Erro ao alterar quantidade');
    }
  };

  const adicionarAoCarrinho = (item: any) => {
    const itemExistente = carrinho.find(c => c.produto.id === item.produto.id);
    if (itemExistente) {
      const novoCarrinho = carrinho.map(c =>
        c.produto.id === item.produto.id
          ? {
              ...c,
              quantidade: c.quantidade + 1,
              subtotal: (c.quantidade + 1) * c.precoUnitario,
            }
          : c
      );
      setCarrinho(novoCarrinho);
    } else {
      const novoItem: ItemVenda = {
        produto: item.produto,
        quantidade: 1,
        precoUnitario: item.produto.preco,
        subtotal: item.produto.preco,
      };
      setCarrinho([...carrinho, novoItem]);
    }
  };

  const alterarQuantidadeCarrinho = (produtoId: string, novaQuantidade: number) => {
    if (novaQuantidade <= 0) {
      setCarrinho(carrinho.filter(item => item.produto.id !== produtoId));
      return;
    }

    const novoCarrinho = carrinho.map(item =>
      item.produto.id === produtoId
        ? {
            ...item,
            quantidade: novaQuantidade,
            subtotal: novaQuantidade * item.precoUnitario,
          }
        : item
    );
    setCarrinho(novoCarrinho);
  };

  const removerItemCarrinho = (produtoId: string) => {
    setCarrinho(carrinho.filter(item => item.produto.id !== produtoId));
  };

  const limparCarrinho = () => {
    Alert.alert(
      'Limpar Carrinho',
      'Deseja realmente limpar o carrinho?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Limpar', 
          style: 'destructive',
          onPress: () => setCarrinho([])
        },
      ]
    );
  };

  const finalizarVenda = () => {
    if (carrinho.length === 0) {
      Alert.alert('Erro', 'Carrinho vazio!');
      return;
    }

    if (formaPagamento === 'dinheiro') {
      const valor = parseFloat(valorRecebido);
      if (isNaN(valor) || valor < totalFinal) {
        Alert.alert('Erro', 'Valor recebido deve ser maior ou igual ao total!');
        return;
      }
    }

    // Atualizar estoque
    carrinho.forEach(item => {
      atualizarEstoque(item.produto.id, item.quantidade);
    });

    // Registrar venda
    const troco = formaPagamento === 'dinheiro' ? parseFloat(valorRecebido) - totalFinal : 0;
    
    try {
      adicionarVenda({
        caixaId: caixaAtual!.id,
        itens: carrinho,
        total: totalFinal,
        formaPagamento,
        data: new Date().toISOString(),
        desconto: descontoValor,
        troco,
      });

      // Limpar carrinho e fechar modal
      setCarrinho([]);
      setModalPagamento(false);
      setValorRecebido('');
      setDesconto('0');
      setFormaPagamento('dinheiro');

      Alert.alert(
        'Venda Finalizada!',
        `Total: R$ ${totalFinal.toFixed(2)}\nForma de Pagamento: ${formaPagamento.toUpperCase()}${troco > 0 ? `\nTroco: R$ ${troco.toFixed(2)}` : ''}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Erro ao finalizar venda');
    }
  };

  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            Caixa
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {produtos.length} produto(s) disponível(is)
          </Text>
        </View>

        {/* Status do Caixa */}
        {!caixaAtual ? (
          <Card style={styles.statusCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Status: Caixa Fechado
              </Text>
              <Text variant="bodyMedium" style={styles.statusText}>
                Nenhum caixa está aberto no momento.
              </Text>
              <Button
                mode="contained"
                onPress={() => setModalAbertura(true)}
                style={styles.abrirButton}
                icon="cash-register"
              >
                Abrir Caixa
              </Button>
            </Card.Content>
          </Card>
        ) : (
          <Card style={styles.statusCard}>
            <Card.Content>
              <View style={styles.caixaHeader}>
                <View>
                  <Text variant="titleMedium" style={styles.cardTitle}>
                    Caixa: {caixaAtual.nome}
                  </Text>
                  <Text variant="bodySmall" style={styles.caixaData}>
                    Aberto em: {formatarData(caixaAtual.dataAbertura)}
                  </Text>
                  <Text variant="bodyMedium" style={styles.caixaTotal}>
                    Total de Vendas: R$ {caixaAtual.totalVendas.toFixed(2)}
                  </Text>
                </View>
                <Button
                  mode="outlined"
                  onPress={handleFecharCaixa}
                  icon="close-circle"
                  buttonColor="#f44336"
                  textColor="#f44336"
                >
                  Fechar
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Produtos do Caixa */}
        {caixaAtual && (
          <Card style={styles.produtosCard}>
            <Card.Content>
              <View style={styles.produtosHeader}>
                <Text variant="titleMedium" style={styles.cardTitle}>
                  Produtos no Caixa ({caixaAtual.itens.length})
                </Text>
                <Button
                  mode="outlined"
                  onPress={abrirModalAdicionarProduto}
                  icon="plus"
                  compact
                >
                  Adicionar
                </Button>
              </View>

              {caixaAtual.itens.length === 0 ? (
                <Text variant="bodyMedium" style={styles.produtosVazio}>
                  Nenhum produto adicionado ao caixa.
                </Text>
              ) : (
                <View style={styles.produtosList}>
                  {caixaAtual.itens.map((item) => (
                    <Card key={item.produto.id} style={styles.produtoItem}>
                      <Card.Content>
                        <View style={styles.produtoInfo}>
                          <Text variant="bodyMedium" style={styles.produtoNome}>
                            {item.produto.nome}
                          </Text>
                          <Text variant="bodySmall" style={styles.produtoPreco}>
                            R$ {item.produto.preco.toFixed(2)} cada
                          </Text>
                        </View>
                        
                        <View style={styles.produtoControles}>
                          <IconButton
                            icon="minus"
                            size={16}
                            onPress={() => alterarQuantidadeCaixa(item.produto.id, item.quantidade - 1)}
                          />
                          <Text variant="bodyMedium" style={styles.produtoQuantidade}>
                            {item.quantidade}
                          </Text>
                          <IconButton
                            icon="plus"
                            size={16}
                            onPress={() => alterarQuantidadeCaixa(item.produto.id, item.quantidade + 1)}
                          />
                          <IconButton
                            icon="delete"
                            size={16}
                            onPress={() => removerProdutoDoCaixa(item.produto.id)}
                            iconColor="#f44336"
                          />
                          <Button
                            mode="contained"
                            onPress={() => adicionarAoCarrinho(item)}
                            compact
                            style={styles.venderButton}
                          >
                            Vender
                          </Button>
                        </View>
                      </Card.Content>
                    </Card>
                  ))}
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Carrinho */}
        {carrinho.length > 0 && (
          <Card style={styles.carrinhoCard}>
            <Card.Content>
              <View style={styles.carrinhoHeader}>
                <Text variant="titleMedium" style={styles.cardTitle}>
                  Carrinho ({carrinho.length} item(s))
                </Text>
                <IconButton
                  icon="delete-sweep"
                  size={20}
                  onPress={limparCarrinho}
                  iconColor="#f44336"
                />
              </View>

              <View style={styles.itensContainer}>
                {carrinho.map((item) => (
                  <Card key={item.produto.id} style={styles.itemCarrinho}>
                    <Card.Content>
                      <View style={styles.itemInfo}>
                        <Text variant="bodyMedium" style={styles.itemNome}>
                          {item.produto.nome}
                        </Text>
                        <Text variant="bodySmall" style={styles.itemPreco}>
                          R$ {item.precoUnitario.toFixed(2)} cada
                        </Text>
                      </View>
                      
                      <View style={styles.itemControles}>
                        <IconButton
                          icon="minus"
                          size={16}
                          onPress={() => alterarQuantidadeCarrinho(item.produto.id, item.quantidade - 1)}
                        />
                        <Text variant="bodyMedium" style={styles.itemQuantidade}>
                          {item.quantidade}
                        </Text>
                        <IconButton
                          icon="plus"
                          size={16}
                          onPress={() => alterarQuantidadeCarrinho(item.produto.id, item.quantidade + 1)}
                        />
                        <IconButton
                          icon="delete"
                          size={16}
                          onPress={() => removerItemCarrinho(item.produto.id)}
                          iconColor="#f44336"
                        />
                      </View>
                      
                      <Text variant="bodyMedium" style={styles.itemSubtotal}>
                        R$ {item.subtotal.toFixed(2)}
                      </Text>
                    </Card.Content>
                  </Card>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Resumo */}
        {carrinho.length > 0 && (
          <Card style={styles.resumoCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Resumo da Venda
              </Text>
              
              <View style={styles.resumoItem}>
                <Text variant="bodyMedium">Subtotal:</Text>
                <Text variant="bodyMedium">R$ {totalCarrinho.toFixed(2)}</Text>
              </View>
              
              <View style={styles.descontoContainer}>
                <Text variant="bodyMedium">Desconto:</Text>
                <TextInput
                  label="R$"
                  value={desconto}
                  onChangeText={setDesconto}
                  style={styles.descontoInput}
                  mode="outlined"
                  keyboardType="numeric"
                  dense
                />
              </View>
              
              <Divider style={styles.divider} />
              
              <View style={styles.resumoItem}>
                <Text variant="titleMedium" style={styles.totalLabel}>
                  Total:
                </Text>
                <Text variant="titleMedium" style={styles.totalValue}>
                  R$ {totalFinal.toFixed(2)}
                </Text>
              </View>
              
              <Button
                mode="contained"
                onPress={() => setModalPagamento(true)}
                style={styles.finalizarButton}
                disabled={totalFinal <= 0}
              >
                Finalizar Venda
              </Button>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* Modal de Abertura de Caixa */}
      <Portal>
        <Modal
          visible={modalAbertura}
          onDismiss={() => setModalAbertura(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>
            Abrir Caixa
          </Text>
          
          <TextInput
            ref={nomeInputRef}
            label="Nome do Caixa"
            value={nomeCaixa}
            onChangeText={setNomeCaixa}
            style={styles.input}
            mode="outlined"
            placeholder="Ex: Caixa 1, Manhã, etc."
          />
          
          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setModalAbertura(false)}
              style={styles.modalButton}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={handleAbrirCaixa}
              style={styles.modalButton}
            >
              Abrir
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Modal de Adicionar Produto */}
      <Portal>
        <Modal
          visible={modalAdicionarProduto}
          onDismiss={() => setModalAdicionarProduto(false)}
          contentContainerStyle={styles.modal}
        >
          <ScrollView>
            <Text variant="headlineSmall" style={styles.modalTitle}>
              Adicionar Produto ao Caixa
            </Text>
            
            <TextInput
              label="Quantidade"
              value={quantidadeProduto}
              onChangeText={setQuantidadeProduto}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
            />
            
            <Text variant="titleMedium" style={styles.modalSubtitle}>
              Selecione um Produto:
            </Text>
            
            <View style={styles.produtosSelect}>
              {produtos.map((produto) => (
                <Card
                  key={produto.id}
                  style={[
                    styles.produtoSelectItem,
                    produtoSelecionado?.id === produto.id && styles.produtoSelecionado
                  ]}
                  onPress={() => selecionarProduto(produto)}
                >
                  <Card.Content>
                    <Text variant="bodyMedium" style={styles.produtoSelectNome}>
                      {produto.nome}
                    </Text>
                    <Text variant="bodySmall" style={styles.produtoSelectPreco}>
                      R$ {produto.preco.toFixed(2)} - Estoque: {produto.estoque}
                    </Text>
                  </Card.Content>
                </Card>
              ))}
            </View>
            
            <View style={styles.modalButtons}>
              <Button
                mode="outlined"
                onPress={() => setModalAdicionarProduto(false)}
                style={styles.modalButton}
              >
                Cancelar
              </Button>
              <Button
                mode="contained"
                onPress={adicionarProdutoAoCaixa}
                style={styles.modalButton}
                disabled={!produtoSelecionado}
              >
                Adicionar
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>

      {/* Modal de Pagamento */}
      <Portal>
        <Modal
          visible={modalPagamento}
          onDismiss={() => setModalPagamento(false)}
          contentContainerStyle={styles.modal}
        >
          <ScrollView>
            <Text variant="headlineSmall" style={styles.modalTitle}>
              Forma de Pagamento
            </Text>
            
            <Text variant="bodyLarge" style={styles.modalTotal}>
              Total: R$ {totalFinal.toFixed(2)}
            </Text>
            
            <SegmentedButtons
              value={formaPagamento}
              onValueChange={(value: string) => setFormaPagamento(value as 'dinheiro' | 'cartao' | 'pix')}
              buttons={[
                { value: 'dinheiro', label: 'Dinheiro' },
                { value: 'cartao', label: 'Cartão' },
                { value: 'pix', label: 'PIX' },
              ]}
              style={styles.segmentedButtons}
            />
            
            {formaPagamento === 'dinheiro' && (
              <TextInput
                label="Valor Recebido (R$)"
                value={valorRecebido}
                onChangeText={setValorRecebido}
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
              />
            )}
            
            {formaPagamento === 'dinheiro' && valorRecebido && (
              <View style={styles.trocoContainer}>
                <Text variant="bodyMedium">Troco:</Text>
                <Text variant="bodyLarge" style={styles.trocoValue}>
                  R$ {(parseFloat(valorRecebido) - totalFinal).toFixed(2)}
                </Text>
              </View>
            )}
            
            <View style={styles.modalButtons}>
              <Button
                mode="outlined"
                onPress={() => setModalPagamento(false)}
                style={styles.modalButton}
              >
                Cancelar
              </Button>
              <Button
                mode="contained"
                onPress={finalizarVenda}
                style={styles.modalButton}
                disabled={formaPagamento === 'dinheiro' && (!valorRecebido || parseFloat(valorRecebido) < totalFinal)}
              >
                Confirmar
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
  subtitle: {
    color: '#666',
    marginTop: 4,
  },
  statusCard: {
    marginBottom: 16,
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusText: {
    color: '#666',
    marginBottom: 16,
  },
  abrirButton: {
    marginTop: 8,
  },
  caixaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  caixaData: {
    color: '#666',
    marginBottom: 4,
  },
  caixaTotal: {
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  produtosCard: {
    marginBottom: 16,
  },
  produtosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  produtosVazio: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  produtosList: {
    gap: 8,
  },
  produtoItem: {
    marginBottom: 8,
  },
  produtoInfo: {
    marginBottom: 8,
  },
  produtoNome: {
    fontWeight: 'bold',
  },
  produtoPreco: {
    color: '#666',
  },
  produtoControles: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  produtoQuantidade: {
    fontWeight: 'bold',
    minWidth: 30,
    textAlign: 'center',
  },
  venderButton: {
    marginLeft: 8,
  },
  carrinhoCard: {
    marginBottom: 16,
  },
  carrinhoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itensContainer: {
    gap: 8,
  },
  itemCarrinho: {
    marginBottom: 8,
  },
  itemInfo: {
    marginBottom: 8,
  },
  itemNome: {
    fontWeight: 'bold',
  },
  itemPreco: {
    color: '#666',
  },
  itemControles: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemQuantidade: {
    fontWeight: 'bold',
    minWidth: 30,
    textAlign: 'center',
  },
  itemSubtotal: {
    fontWeight: 'bold',
    color: '#2196F3',
    textAlign: 'right',
  },
  resumoCard: {
    marginBottom: 20,
  },
  resumoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  descontoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  descontoInput: {
    width: 100,
  },
  divider: {
    marginVertical: 12,
  },
  totalLabel: {
    fontWeight: 'bold',
  },
  totalValue: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
  finalizarButton: {
    marginTop: 16,
  },
  modal: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  input: {
    marginBottom: 16,
  },
  produtosSelect: {
    gap: 8,
    marginBottom: 20,
  },
  produtoSelectItem: {
    marginBottom: 4,
  },
  produtoSelecionado: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
    borderWidth: 2,
  },
  produtoSelectNome: {
    fontWeight: '500',
  },
  produtoSelectPreco: {
    color: '#666',
  },
  modalTotal: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 20,
  },
  segmentedButtons: {
    marginBottom: 20,
  },
  trocoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  trocoValue: {
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});
