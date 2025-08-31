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
    adicionarVenda, 
    atualizarEstoque 
  } = useAppContext();
  
  const [modalAbertura, setModalAbertura] = useState(false);
  const [modalPagamento, setModalPagamento] = useState(false);
  const [nomeCaixa, setNomeCaixa] = useState('');
  const [trocoInicial, setTrocoInicial] = useState('');
  const [carrinho, setCarrinho] = useState<ItemVenda[]>([]);
  const [formaPagamento, setFormaPagamento] = useState<'dinheiro' | 'pix' | 'combinar'>('dinheiro');
  const [valorRecebido, setValorRecebido] = useState('');
  const [pagamentoDinheiro, setPagamentoDinheiro] = useState('');
  const [pagamentoPix, setPagamentoPix] = useState('');
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

    const troco = parseFloat(trocoInicial) || 0;
    if (troco < 0) {
      Alert.alert('Erro', 'O troco inicial não pode ser negativo!');
      return;
    }

    if (produtos.length === 0) {
      Alert.alert('Erro', 'Não há produtos cadastrados! Cadastre produtos primeiro.');
      return;
    }

    try {
      abrirCaixa(nomeCaixa, troco);
      setModalAbertura(false);
      setNomeCaixa('');
      setTrocoInicial('');
      Alert.alert('Sucesso', 'Caixa aberto com sucesso!');
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Erro ao abrir caixa');
    }
  };

  const handleFecharCaixa = () => {
    if (!caixaAtual) {
      Alert.alert('Erro', 'Nenhum caixa está aberto!');
      return;
    }

    Alert.alert(
      'Fechar Caixa',
      `Deseja realmente fechar o caixa "${caixaAtual.nome}"?\n\nTotal de vendas: R$ ${(caixaAtual.totalVendas || 0).toFixed(2)}`,
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

  const adicionarAoCarrinho = (produto: Produto) => {
    if (produto.estoque <= 0) {
      Alert.alert('Erro', 'Produto sem estoque!');
      return;
    }

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
  };

  const alterarQuantidadeCarrinho = (produtoId: string, novaQuantidade: number) => {
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
    if (!caixaAtual) {
      Alert.alert('Erro', 'Nenhum caixa está aberto!');
      return;
    }

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

    if (formaPagamento === 'combinar') {
      const dinheiro = parseFloat(pagamentoDinheiro) || 0;
      const pix = parseFloat(pagamentoPix) || 0;
      const totalCombinado = dinheiro + pix;
      
      if (totalCombinado !== totalFinal) {
        Alert.alert('Erro', 'A soma dos pagamentos deve ser igual ao total!');
        return;
      }
    }

    // Atualizar estoque
    carrinho.forEach(item => {
      if (item && item.produto && item.produto.id) {
        atualizarEstoque(item.produto.id, item.quantidade);
      }
    });

    // Calcular troco
    let troco = 0;
    if (formaPagamento === 'dinheiro') {
      troco = parseFloat(valorRecebido) - totalFinal;
    }

    // Preparar dados da venda
    const dadosVenda: any = {
      caixaId: caixaAtual.id,
      itens: carrinho,
      total: totalFinal,
      formaPagamento,
      data: new Date().toISOString(),
      desconto: descontoValor,
      troco,
    };

    // Adicionar valores específicos para pagamento combinado
    if (formaPagamento === 'combinar') {
      dadosVenda.pagamentoDinheiro = parseFloat(pagamentoDinheiro) || 0;
      dadosVenda.pagamentoPix = parseFloat(pagamentoPix) || 0;
    }

    try {
      adicionarVenda(dadosVenda);

      // Limpar carrinho e fechar modal
      setCarrinho([]);
      setModalPagamento(false);
      setValorRecebido('');
      setPagamentoDinheiro('');
      setPagamentoPix('');
      setDesconto('0');
      setFormaPagamento('dinheiro');

      let mensagem = `Total: R$ ${totalFinal.toFixed(2)}\nForma de Pagamento: ${formaPagamento.toUpperCase()}`;
      
      if (formaPagamento === 'dinheiro' && troco > 0) {
        mensagem += `\nTroco: R$ ${troco.toFixed(2)}`;
      }
      
      if (formaPagamento === 'combinar') {
        mensagem += `\nDinheiro: R$ ${dadosVenda.pagamentoDinheiro.toFixed(2)}`;
        mensagem += `\nPIX: R$ ${dadosVenda.pagamentoPix.toFixed(2)}`;
      }

      Alert.alert('Venda Finalizada!', mensagem, [{ text: 'OK' }]);
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
                  <Text variant="bodyMedium" style={styles.caixaTroco}>
                    Troco Inicial: R$ {(caixaAtual.trocoInicial || 0).toFixed(2)}
                  </Text>
                </View>
                <Button
                  mode="outlined"
                  onPress={handleFecharCaixa}
                  icon="close-circle"
                  buttonColor="#f44336"
                  textColor="#ffffff"
                >
                  Fechar caixa
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Produtos Disponíveis */}
        {caixaAtual && (
          <Card style={styles.produtosCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Produtos Disponíveis ({produtos.length})
              </Text>

              <View style={styles.produtosList}>
                {produtos.map((produto) => (
                  <Card key={produto.id} style={styles.produtoItem}>
                    <Card.Content>
                      <View style={styles.produtoRow}>
                        <View style={styles.produtoInfo}>
                          <Text variant="bodyMedium" style={styles.produtoNome}>
                            {produto.nome}
                          </Text>
                          <Text variant="bodySmall" style={styles.produtoPreco}>
                            R$ {produto.preco.toFixed(2)} - Estoque: {produto.estoque}
                          </Text>
                        </View>
                        
                        <Button
                          mode="contained"
                          onPress={() => adicionarAoCarrinho(produto)}
                          disabled={produto.estoque <= 0}
                          style={styles.venderButton}
                          icon="plus"
                          compact
                        >
                          Vender
                        </Button>
                      </View>
                    </Card.Content>
                  </Card>
                ))}
              </View>
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

          <TextInput
            label="Troco Inicial (R$)"
            value={trocoInicial}
            onChangeText={setTrocoInicial}
            style={styles.input}
            mode="outlined"
            keyboardType="numeric"
            placeholder="0.00"
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
              onValueChange={(value: string) => setFormaPagamento(value as 'dinheiro' | 'pix' | 'combinar')}
              buttons={[
                { value: 'dinheiro', label: 'Dinheiro' },
                { value: 'pix', label: 'PIX' },
                { value: 'combinar', label: 'Combinar' },
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
            
            {formaPagamento === 'combinar' && (
              <>
                <TextInput
                  label="Valor em Dinheiro (R$)"
                  value={pagamentoDinheiro}
                  onChangeText={setPagamentoDinheiro}
                  style={styles.input}
                  mode="outlined"
                  keyboardType="numeric"
                />
                <TextInput
                  label="Valor em PIX (R$)"
                  value={pagamentoPix}
                  onChangeText={setPagamentoPix}
                  style={styles.input}
                  mode="outlined"
                  keyboardType="numeric"
                />
                {pagamentoDinheiro && pagamentoPix && (
                  <View style={styles.trocoContainer}>
                    <Text variant="bodyMedium">Total Combinado:</Text>
                    <Text variant="bodyLarge" style={styles.trocoValue}>
                      R$ {((parseFloat(pagamentoDinheiro) || 0) + (parseFloat(pagamentoPix) || 0)).toFixed(2)}
                    </Text>
                  </View>
                )}
              </>
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
                disabled={
                  (formaPagamento === 'dinheiro' && (!valorRecebido || parseFloat(valorRecebido) < totalFinal)) ||
                  (formaPagamento === 'combinar' && (!pagamentoDinheiro || !pagamentoPix || ((parseFloat(pagamentoDinheiro) || 0) + (parseFloat(pagamentoPix) || 0)) !== totalFinal))
                }
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
    color: '#00407B',
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
    marginBottom: 4,
  },
  caixaTroco: {
    fontWeight: 'bold',
    color: '#FF9800',
  },
  produtosCard: {
    marginBottom: 16,
  },
  produtosList: {
    gap: 8,
  },
  produtoItem: {
    marginBottom: 8,
  },
  produtoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  produtoInfo: {
    flex: 1,
    marginRight: 12,
  },
  produtoNome: {
    fontWeight: 'bold',
  },
  produtoPreco: {
    color: '#666',
  },
  venderButton: {
    minWidth: 80,
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
    color: '#00407B',
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
    color: '#00407B',
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
  input: {
    marginBottom: 16,
  },
  modalTotal: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#00407B',
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
