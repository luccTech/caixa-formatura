import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import {
    Button,
    Card,
    Chip,
    Divider,
    FAB,
    IconButton,
    Modal,
    Portal,
    Text,
    TextInput
} from 'react-native-paper';
import { Produto, useAppContext } from '../../contexts/AppContext';

export default function ProdutosScreen() {
  const { produtos, adicionarProduto, removerProduto } = useAppContext();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  
  const [formData, setFormData] = useState({
    nome: '',
    preco: '',
    estoque: '',
    categoria: '',
    codigo: '',
  });

  const categorias = ['Alimentos', 'Bebidas', 'Higiene', 'Outros'];

  const limparFormulario = () => {
    setFormData({
      nome: '',
      preco: '',
      estoque: '',
      categoria: '',
      codigo: '',
    });
    setEditingProduto(null);
  };

  const handleSubmit = () => {
    if (!formData.nome || !formData.preco || !formData.estoque || !formData.categoria || !formData.codigo) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios!');
      return;
    }

    const preco = parseFloat(formData.preco);
    const estoque = parseInt(formData.estoque);

    if (isNaN(preco) || isNaN(estoque) || preco <= 0 || estoque < 0) {
      Alert.alert('Erro', 'Preço e estoque devem ser números válidos!');
      return;
    }

    // Verificar se código já existe
    const codigoExiste = produtos.some(p => p.codigo === formData.codigo);
    if (codigoExiste) {
      Alert.alert('Erro', 'Código do produto já existe!');
      return;
    }

    adicionarProduto({
      nome: formData.nome,
      preco,
      estoque,
      categoria: formData.categoria,
      codigo: formData.codigo,
    });

    limparFormulario();
    setModalVisible(false);
    Alert.alert('Sucesso', 'Produto cadastrado com sucesso!');
  };

  const handleRemoverProduto = (produto: Produto) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente remover o produto "${produto.nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Remover', 
          style: 'destructive',
          onPress: () => {
            removerProduto(produto.id);
            Alert.alert('Sucesso', 'Produto removido com sucesso!');
          }
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            Produtos
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {produtos.length} produto(s) cadastrado(s)
          </Text>
        </View>

        {produtos.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text variant="bodyLarge" style={styles.emptyText}>
                Nenhum produto cadastrado ainda.
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubtext}>
                Toque no botão + para adicionar seu primeiro produto.
              </Text>
            </Card.Content>
          </Card>
        ) : (
          produtos.map((produto) => (
            <Card key={produto.id} style={styles.produtoCard}>
              <Card.Content>
                <View style={styles.produtoHeader}>
                  <View style={styles.produtoInfo}>
                    <Text variant="titleMedium" style={styles.produtoNome}>
                      {produto.nome}
                    </Text>
                    <Chip mode="outlined" style={styles.categoriaChip}>
                      {produto.categoria}
                    </Chip>
                  </View>
                  <IconButton
                    icon="delete"
                    size={20}
                    onPress={() => handleRemoverProduto(produto)}
                    iconColor="#f44336"
                  />
                </View>
                
                <Divider style={styles.divider} />
                
                <View style={styles.produtoDetails}>
                  <View style={styles.detailRow}>
                    <Text variant="bodyMedium" style={styles.detailLabel}>
                      Código:
                    </Text>
                    <Text variant="bodyMedium" style={styles.detailValue}>
                      {produto.codigo}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text variant="bodyMedium" style={styles.detailLabel}>
                      Preço:
                    </Text>
                    <Text variant="bodyMedium" style={styles.precoValue}>
                      R$ {produto.preco.toFixed(2)}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text variant="bodyMedium" style={styles.detailLabel}>
                      Estoque:
                    </Text>
                    <Text 
                      variant="bodyMedium" 
                      style={[
                        styles.estoqueValue,
                        produto.estoque === 0 && styles.estoqueZero
                      ]}
                    >
                      {produto.estoque} unidade(s)
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => {
            setModalVisible(false);
            limparFormulario();
          }}
          contentContainerStyle={styles.modal}
        >
          <ScrollView>
            <Text variant="headlineSmall" style={styles.modalTitle}>
              Cadastrar Produto
            </Text>
            
            <TextInput
              label="Nome do Produto *"
              value={formData.nome}
              onChangeText={(text) => setFormData({ ...formData, nome: text })}
              style={styles.input}
              mode="outlined"
            />
            
            <TextInput
              label="Código do Produto *"
              value={formData.codigo}
              onChangeText={(text) => setFormData({ ...formData, codigo: text.toUpperCase() })}
              style={styles.input}
              mode="outlined"
              autoCapitalize="characters"
            />
            
            <TextInput
              label="Preço (R$) *"
              value={formData.preco}
              onChangeText={(text) => setFormData({ ...formData, preco: text })}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
            />
            
            <TextInput
              label="Quantidade em Estoque *"
              value={formData.estoque}
              onChangeText={(text) => setFormData({ ...formData, estoque: text })}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
            />
            
            <Text variant="bodyMedium" style={styles.categoriaLabel}>
              Categoria *
            </Text>
            <View style={styles.categoriasContainer}>
              {categorias.map((categoria) => (
                <Chip
                  key={categoria}
                  selected={formData.categoria === categoria}
                  onPress={() => setFormData({ ...formData, categoria })}
                  style={styles.categoriaChip}
                  mode="outlined"
                >
                  {categoria}
                </Chip>
              ))}
            </View>
            
            <View style={styles.modalButtons}>
              <Button
                mode="outlined"
                onPress={() => {
                  setModalVisible(false);
                  limparFormulario();
                }}
                style={styles.modalButton}
              >
                Cancelar
              </Button>
              <Button
                mode="contained"
                onPress={handleSubmit}
                style={styles.modalButton}
              >
                Cadastrar
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      />
    </View>
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
  emptyCard: {
    marginTop: 20,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
  },
  emptySubtext: {
    textAlign: 'center',
    color: '#999',
    marginTop: 8,
  },
  produtoCard: {
    marginBottom: 12,
    elevation: 2,
  },
  produtoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  produtoInfo: {
    flex: 1,
  },
  produtoNome: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  categoriaChip: {
    alignSelf: 'flex-start',
  },
  divider: {
    marginVertical: 12,
  },
  produtoDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    color: '#666',
  },
  detailValue: {
    fontWeight: '500',
  },
  precoValue: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
  estoqueValue: {
    fontWeight: '500',
    color: '#4CAF50',
  },
  estoqueZero: {
    color: '#f44336',
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
  categoriaLabel: {
    marginBottom: 8,
    color: '#666',
  },
  categoriasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
