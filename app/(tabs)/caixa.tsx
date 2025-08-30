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
    Surface,
    Text,
    TextInput
} from 'react-native-paper';
import { ItemVenda, useAppContext } from '../../contexts/AppContext';

export default function CaixaScreen() {
  const { produtos, adicionarVenda, atualizarEstoque } = useAppContext();
  const [codigoProduto, setCodigoProduto] = useState('');
  const [carrinho, setCarrinho] = useState<ItemVenda[]>([]);
  const [modalPagamento, setModalPagamento] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState<'dinheiro' | 'cartao' | 'pix'>('dinheiro');
  const [valorRecebido, setValorRecebido] = useState('');
  const [desconto, setDesconto] = useState('0');
  
  const codigoInputRef = useRef<any>(null);

  const totalCarrinho = carrinho.reduce((sum, item) => sum + item.subtotal, 0);
  const descontoValor = parseFloat(desconto) || 0;
  const totalFinal = totalCarrinho - descontoValor;

  const buscarProduto = () => {
    if (!codigoProduto.trim()) {
      Alert.alert('Erro', 'Digite o código do produto!');
      return;
    }

    const produto = produtos.find(p => p.codigo === codigoProduto.toUpperCase());
    if (!produto) {
      Alert.alert('Erro', 'Produto não encontrado!');
      setCodigoProduto('');
      return;
    }

    if (produto.estoque <= 0) {
      Alert.alert('Erro', 'Produto sem estoque!');
      setCodigoProduto('');
      return;
    }

    // Verificar se produto já está no carrinho
    const itemExistente = carrinho.find(item => item.produto.id === produto.id);
    if (itemExistente) {
      const novoCarrinho = carrinho.map(item =>
        item.produto.id === produto.id
          ? {
              ...item,
              quantidade: item.quantidade + 1,
              subtotal: (item.quantidade + 1) * item.precoUnitario,
            }
          : item
      );
      setCarrinho(novoCarrinho);
    } else {
      const novoItem: ItemVenda = {
        produto,
        quantidade: 1,
        precoUnitario: produto.preco,
        subtotal: produto.preco,
      };
      setCarrinho([...carrinho, novoItem]);
    }

    setCodigoProduto('');
    codigoInputRef.current?.focus();
  };

  const alterarQuantidade = (produtoId: string, novaQuantidade: number) => {
    if (novaQuantidade <= 0) {
      setCarrinho(carrinho.filter(item => item.produto.id !== produtoId));
      return;
    }

    const produto = produtos.find(p => p.id === produtoId);
    if (produto && novaQuantidade > produto.estoque) {
      Alert.alert('Erro', 'Quantidade maior que o estoque disponível!');
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

  const removerItem = (produtoId: string) => {
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
    
    adicionarVenda({
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

        {/* Busca de Produtos */}
        <Card style={styles.buscaCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Buscar Produto
            </Text>
            <View style={styles.buscaContainer}>
              <TextInput
                ref={codigoInputRef}
                label="Código do Produto"
                value={codigoProduto}
                onChangeText={setCodigoProduto}
                style={styles.codigoInput}
                mode="outlined"
                autoCapitalize="characters"
                onSubmitEditing={buscarProduto}
                returnKeyType="search"
              />
              <IconButton
                icon="magnify"
                mode="contained"
                onPress={buscarProduto}
                style={styles.buscaButton}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Carrinho */}
        <Card style={styles.carrinhoCard}>
          <Card.Content>
            <View style={styles.carrinhoHeader}>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Carrinho ({carrinho.length} item(s))
              </Text>
              {carrinho.length > 0 && (
                <IconButton
                  icon="delete-sweep"
                  size={20}
                  onPress={limparCarrinho}
                  iconColor="#f44336"
                />
              )}
            </View>

            {carrinho.length === 0 ? (
              <Text variant="bodyMedium" style={styles.carrinhoVazio}>
                Nenhum produto no carrinho.
              </Text>
            ) : (
              <View style={styles.itensContainer}>
                {carrinho.map((item) => (
                  <Surface key={item.produto.id} style={styles.itemCarrinho}>
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
                        onPress={() => alterarQuantidade(item.produto.id, item.quantidade - 1)}
                      />
                      <Text variant="bodyMedium" style={styles.itemQuantidade}>
                        {item.quantidade}
                      </Text>
                      <IconButton
                        icon="plus"
                        size={16}
                        onPress={() => alterarQuantidade(item.produto.id, item.quantidade + 1)}
                      />
                      <IconButton
                        icon="delete"
                        size={16}
                        onPress={() => removerItem(item.produto.id)}
                        iconColor="#f44336"
                      />
                    </View>
                    
                    <Text variant="bodyMedium" style={styles.itemSubtotal}>
                      R$ {item.subtotal.toFixed(2)}
                    </Text>
                  </Surface>
                ))}
              </View>
            )}
          </Card.Content>
        </Card>

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
              onValueChange={(value) => setFormaPagamento(value as any)}
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
  buscaCard: {
    marginBottom: 16,
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  buscaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codigoInput: {
    flex: 1,
    marginRight: 8,
  },
  buscaButton: {
    margin: 0,
  },
  carrinhoCard: {
    marginBottom: 16,
  },
  carrinhoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  carrinhoVazio: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  itensContainer: {
    gap: 8,
  },
  itemCarrinho: {
    padding: 12,
    borderRadius: 8,
    elevation: 1,
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
  modalTotal: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 20,
  },
  segmentedButtons: {
    marginBottom: 20,
  },
  input: {
    marginBottom: 16,
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
