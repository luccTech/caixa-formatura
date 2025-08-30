import React, { useMemo, useState } from 'react';
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
    IconButton,
    Modal,
    Portal,
    SegmentedButtons,
    Text
} from 'react-native-paper';
import { useAppContext, Venda } from '../../contexts/AppContext';

export default function RelatoriosScreen() {
  const { vendas, produtos } = useAppContext();
  const [modalVisible, setModalVisible] = useState(false);
  const [vendaSelecionada, setVendaSelecionada] = useState<Venda | null>(null);
  const [filtroPeriodo, setFiltroPeriodo] = useState<'hoje' | 'semana' | 'mes' | 'todos'>('todos');

  // Filtrar vendas por período
  const vendasFiltradas = useMemo(() => {
    const agora = new Date();
    const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    const umaSemanaAtras = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);
    const umMesAtras = new Date(hoje.getFullYear(), agora.getMonth() - 1, agora.getDate());

    return vendas.filter(venda => {
      const dataVenda = new Date(venda.data);
      switch (filtroPeriodo) {
        case 'hoje':
          return dataVenda >= hoje;
        case 'semana':
          return dataVenda >= umaSemanaAtras;
        case 'mes':
          return dataVenda >= umMesAtras;
        default:
          return true;
      }
    });
  }, [vendas, filtroPeriodo]);

  // Estatísticas
  const estatisticas = useMemo(() => {
    const totalVendas = vendasFiltradas.length;
    const totalReceita = vendasFiltradas.reduce((sum, venda) => sum + venda.total, 0);
    const totalItens = vendasFiltradas.reduce((sum, venda) => 
      sum + venda.itens.reduce((itemSum, item) => itemSum + item.quantidade, 0), 0
    );
    
    const vendasPorPagamento = vendasFiltradas.reduce((acc, venda) => {
      acc[venda.formaPagamento] = (acc[venda.formaPagamento] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalDescontos = vendasFiltradas.reduce((sum, venda) => sum + venda.desconto, 0);

    return {
      totalVendas,
      totalReceita,
      totalItens,
      vendasPorPagamento,
      totalDescontos,
      ticketMedio: totalVendas > 0 ? totalReceita / totalVendas : 0,
    };
  }, [vendasFiltradas]);

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

  const formatarMoeda = (valor: number) => {
    return `R$ ${valor.toFixed(2)}`;
  };

  const abrirDetalhesVenda = (venda: Venda) => {
    setVendaSelecionada(venda);
    setModalVisible(true);
  };

  const exportarRelatorio = () => {
    Alert.alert(
      'Exportar Relatório',
      'Funcionalidade de exportação será implementada em breve!',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            Relatórios
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Análise de vendas e estatísticas
          </Text>
        </View>

        {/* Filtros */}
        <Card style={styles.filtrosCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Período
            </Text>
            <SegmentedButtons
              value={filtroPeriodo}
              onValueChange={(value) => setFiltroPeriodo(value as any)}
              buttons={[
                { value: 'hoje', label: 'Hoje' },
                { value: 'semana', label: 'Semana' },
                { value: 'mes', label: 'Mês' },
                { value: 'todos', label: 'Todos' },
              ]}
              style={styles.segmentedButtons}
            />
          </Card.Content>
        </Card>

        {/* Estatísticas Gerais */}
        <Card style={styles.estatisticasCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Resumo Geral
            </Text>
            
            <View style={styles.estatisticasGrid}>
              <View style={styles.estatisticaItem}>
                <Text variant="headlineSmall" style={styles.estatisticaValor}>
                  {estatisticas.totalVendas}
                </Text>
                <Text variant="bodySmall" style={styles.estatisticaLabel}>
                  Vendas
                </Text>
              </View>
              
              <View style={styles.estatisticaItem}>
                <Text variant="headlineSmall" style={styles.estatisticaValor}>
                  {formatarMoeda(estatisticas.totalReceita)}
                </Text>
                <Text variant="bodySmall" style={styles.estatisticaLabel}>
                  Receita Total
                </Text>
              </View>
              
              <View style={styles.estatisticaItem}>
                <Text variant="headlineSmall" style={styles.estatisticaValor}>
                  {estatisticas.totalItens}
                </Text>
                <Text variant="bodySmall" style={styles.estatisticaLabel}>
                  Itens Vendidos
                </Text>
              </View>
              
              <View style={styles.estatisticaItem}>
                <Text variant="headlineSmall" style={styles.estatisticaValor}>
                  {formatarMoeda(estatisticas.ticketMedio)}
                </Text>
                <Text variant="bodySmall" style={styles.estatisticaLabel}>
                  Ticket Médio
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Formas de Pagamento */}
        <Card style={styles.pagamentoCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Formas de Pagamento
            </Text>
            
            <View style={styles.pagamentoStats}>
              {Object.entries(estatisticas.vendasPorPagamento).map(([forma, quantidade]) => (
                <View key={forma} style={styles.pagamentoItem}>
                  <Chip mode="outlined" style={styles.pagamentoChip}>
                    {forma.toUpperCase()}
                  </Chip>
                  <Text variant="bodyMedium" style={styles.pagamentoQuantidade}>
                    {quantidade} venda(s)
                  </Text>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Lista de Vendas */}
        <Card style={styles.vendasCard}>
          <Card.Content>
            <View style={styles.vendasHeader}>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Últimas Vendas
              </Text>
              <Button
                mode="outlined"
                onPress={exportarRelatorio}
                icon="download"
                compact
              >
                Exportar
              </Button>
            </View>
            
            {vendasFiltradas.length === 0 ? (
              <Text variant="bodyMedium" style={styles.vendasVazio}>
                Nenhuma venda encontrada para o período selecionado.
              </Text>
            ) : (
              <View style={styles.vendasList}>
                {vendasFiltradas.slice(0, 10).map((venda) => (
                  <Surface key={venda.id} style={styles.vendaItem}>
                    <View style={styles.vendaInfo}>
                      <Text variant="bodyMedium" style={styles.vendaData}>
                        {formatarData(venda.data)}
                      </Text>
                      <Text variant="bodySmall" style={styles.vendaItens}>
                        {venda.itens.length} item(s)
                      </Text>
                    </View>
                    
                    <View style={styles.vendaValores}>
                      <Chip mode="outlined" style={styles.vendaPagamento}>
                        {venda.formaPagamento.toUpperCase()}
                      </Chip>
                      <Text variant="bodyMedium" style={styles.vendaTotal}>
                        {formatarMoeda(venda.total)}
                      </Text>
                    </View>
                    
                    <IconButton
                      icon="eye"
                      size={16}
                      onPress={() => abrirDetalhesVenda(venda)}
                    />
                  </Surface>
                ))}
              </View>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Modal de Detalhes da Venda */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <ScrollView>
            {vendaSelecionada && (
              <>
                <Text variant="headlineSmall" style={styles.modalTitle}>
                  Detalhes da Venda
                </Text>
                
                <Text variant="bodyMedium" style={styles.modalData}>
                  {formatarData(vendaSelecionada.data)}
                </Text>
                
                <Divider style={styles.divider} />
                
                <View style={styles.modalItens}>
                  <Text variant="titleMedium" style={styles.modalSubtitle}>
                    Itens da Venda
                  </Text>
                  
                  {vendaSelecionada.itens.map((item, index) => (
                    <View key={index} style={styles.modalItem}>
                      <View style={styles.modalItemInfo}>
                        <Text variant="bodyMedium" style={styles.modalItemNome}>
                          {item.produto.nome}
                        </Text>
                        <Text variant="bodySmall" style={styles.modalItemDetalhes}>
                          {item.quantidade}x R$ {item.precoUnitario.toFixed(2)}
                        </Text>
                      </View>
                      <Text variant="bodyMedium" style={styles.modalItemSubtotal}>
                        {formatarMoeda(item.subtotal)}
                      </Text>
                    </View>
                  ))}
                </View>
                
                <Divider style={styles.divider} />
                
                <View style={styles.modalResumo}>
                  <View style={styles.modalResumoItem}>
                    <Text variant="bodyMedium">Subtotal:</Text>
                    <Text variant="bodyMedium">
                      {formatarMoeda(vendaSelecionada.total + vendaSelecionada.desconto)}
                    </Text>
                  </View>
                  
                  {vendaSelecionada.desconto > 0 && (
                    <View style={styles.modalResumoItem}>
                      <Text variant="bodyMedium">Desconto:</Text>
                      <Text variant="bodyMedium" style={styles.descontoText}>
                        -{formatarMoeda(vendaSelecionada.desconto)}
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.modalResumoItem}>
                    <Text variant="titleMedium" style={styles.totalLabel}>
                      Total:
                    </Text>
                    <Text variant="titleMedium" style={styles.totalValue}>
                      {formatarMoeda(vendaSelecionada.total)}
                    </Text>
                  </View>
                  
                  <View style={styles.modalResumoItem}>
                    <Text variant="bodyMedium">Pagamento:</Text>
                    <Chip mode="outlined">
                      {vendaSelecionada.formaPagamento.toUpperCase()}
                    </Chip>
                  </View>
                  
                  {vendaSelecionada.troco > 0 && (
                    <View style={styles.modalResumoItem}>
                      <Text variant="bodyMedium">Troco:</Text>
                      <Text variant="bodyMedium" style={styles.trocoText}>
                        {formatarMoeda(vendaSelecionada.troco)}
                      </Text>
                    </View>
                  )}
                </View>
                
                <Button
                  mode="contained"
                  onPress={() => setModalVisible(false)}
                  style={styles.modalButton}
                >
                  Fechar
                </Button>
              </>
            )}
          </ScrollView>
        </Modal>
      </Portal>
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
  filtrosCard: {
    marginBottom: 16,
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  segmentedButtons: {
    marginTop: 8,
  },
  estatisticasCard: {
    marginBottom: 16,
  },
  estatisticasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  estatisticaItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  estatisticaValor: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
  estatisticaLabel: {
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  pagamentoCard: {
    marginBottom: 16,
  },
  pagamentoStats: {
    gap: 8,
  },
  pagamentoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pagamentoChip: {
    flex: 1,
  },
  pagamentoQuantidade: {
    fontWeight: '500',
    marginLeft: 12,
  },
  vendasCard: {
    marginBottom: 20,
  },
  vendasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  vendasVazio: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  vendasList: {
    gap: 8,
  },
  vendaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    elevation: 1,
  },
  vendaInfo: {
    flex: 1,
  },
  vendaData: {
    fontWeight: 'bold',
  },
  vendaItens: {
    color: '#666',
  },
  vendaValores: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  vendaPagamento: {
    marginBottom: 4,
  },
  vendaTotal: {
    fontWeight: 'bold',
    color: '#2196F3',
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
    marginBottom: 8,
    fontWeight: 'bold',
  },
  modalData: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 16,
  },
  divider: {
    marginVertical: 16,
  },
  modalItens: {
    marginBottom: 16,
  },
  modalSubtitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  modalItemInfo: {
    flex: 1,
  },
  modalItemNome: {
    fontWeight: '500',
  },
  modalItemDetalhes: {
    color: '#666',
  },
  modalItemSubtotal: {
    fontWeight: 'bold',
  },
  modalResumo: {
    gap: 8,
  },
  modalResumoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  descontoText: {
    color: '#f44336',
  },
  totalLabel: {
    fontWeight: 'bold',
  },
  totalValue: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
  trocoText: {
    color: '#4CAF50',
  },
  modalButton: {
    marginTop: 16,
  },
});
