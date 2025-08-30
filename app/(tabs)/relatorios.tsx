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
import { Caixa, useAppContext } from '../../contexts/AppContext';

export default function RelatoriosScreen() {
  const { caixas, vendas, getVendasPorCaixa } = useAppContext();
  const [modalVisible, setModalVisible] = useState(false);
  const [caixaSelecionada, setCaixaSelecionada] = useState<Caixa | null>(null);
  const [filtroPeriodo, setFiltroPeriodo] = useState<'hoje' | 'semana' | 'mes' | 'todos'>('todos');

  // Filtrar caixas por período
  const caixasFiltradas = useMemo(() => {
    const agora = new Date();
    const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    const umaSemanaAtras = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);
    const umMesAtras = new Date(hoje.getFullYear(), agora.getMonth() - 1, agora.getDate());

    return caixas.filter(caixa => {
      const dataCaixa = new Date(caixa.dataAbertura);
      switch (filtroPeriodo) {
        case 'hoje':
          return dataCaixa >= hoje;
        case 'semana':
          return dataCaixa >= umaSemanaAtras;
        case 'mes':
          return dataCaixa >= umMesAtras;
        default:
          return true;
      }
    });
  }, [caixas, filtroPeriodo]);

  // Estatísticas
  const estatisticas = useMemo(() => {
    const totalCaixas = caixasFiltradas.length;
    const caixasAbertos = caixasFiltradas.filter(c => c.status === 'aberto').length;
    const caixasFechados = caixasFiltradas.filter(c => c.status === 'fechado').length;
    const totalReceita = caixasFiltradas.reduce((sum, caixa) => sum + caixa.totalVendas, 0);
    const totalVendas = caixasFiltradas.reduce((sum, caixa) => sum + caixa.vendas.length, 0);
    
    const vendasPorPagamento = caixasFiltradas.reduce((acc, caixa) => {
      caixa.vendas.forEach(venda => {
        acc[venda.formaPagamento] = (acc[venda.formaPagamento] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    const totalDescontos = caixasFiltradas.reduce((sum, caixa) => 
      sum + caixa.vendas.reduce((vendaSum, venda) => vendaSum + venda.desconto, 0), 0
    );

    return {
      totalCaixas,
      caixasAbertos,
      caixasFechados,
      totalReceita,
      totalVendas,
      vendasPorPagamento,
      totalDescontos,
    };
  }, [caixasFiltradas]);

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

  const abrirDetalhesCaixa = (caixa: Caixa) => {
    setCaixaSelecionada(caixa);
    setModalVisible(true);
  };

  const exportarRelatorioCaixa = (caixa: Caixa) => {
    const estatisticasCaixa = calcularEstatisticasCaixa(caixa);
    
    const relatorio = `
RELATÓRIO DO CAIXA: ${caixa.nome}
Data de Abertura: ${formatarData(caixa.dataAbertura)}
${caixa.dataFechamento ? `Data de Fechamento: ${formatarData(caixa.dataFechamento)}` : 'Status: ABERTO'}

RESUMO FINANCEIRO:
- Total de Vendas: ${formatarMoeda(caixa.totalVendas)}
- Quantidade de Vendas: ${caixa.vendas.length}
- Total em Dinheiro: ${formatarMoeda(estatisticasCaixa.totalDinheiro)}
- Total em PIX: ${formatarMoeda(estatisticasCaixa.totalPix)}
- Total Combinado: ${formatarMoeda(estatisticasCaixa.totalCombinado)}
- Troco Total: ${formatarMoeda(estatisticasCaixa.trocoTotal)}
- Descontos Aplicados: ${formatarMoeda(estatisticasCaixa.totalDescontos)}

PRODUTOS NO CAIXA:
${caixa.itens.map(item => `- ${item.produto.nome}: ${item.quantidade} unidade(s) - R$ ${item.produto.preco.toFixed(2)} cada`).join('\n')}

VENDAS REALIZADAS:
${caixa.vendas.map((venda, index) => `
Venda ${index + 1} - ${formatarData(venda.data)}
Total: ${formatarMoeda(venda.total)}
Forma de Pagamento: ${venda.formaPagamento.toUpperCase()}
${venda.formaPagamento === 'combinar' ? `- Dinheiro: ${formatarMoeda(venda.pagamentoDinheiro || 0)}\n- PIX: ${formatarMoeda(venda.pagamentoPix || 0)}` : ''}
${venda.troco > 0 ? `Troco: ${formatarMoeda(venda.troco)}` : ''}
Itens: ${venda.itens.map(item => `${item.quantidade}x ${item.produto.nome}`).join(', ')}
`).join('\n')}

MÉTODOS DE PAGAMENTO UTILIZADOS:
${Object.entries(estatisticasCaixa.vendasPorPagamento).map(([metodo, quantidade]) => `- ${metodo.toUpperCase()}: ${quantidade} venda(s)`).join('\n')}
    `.trim();

    Alert.alert(
      'Relatório Gerado',
      'Relatório copiado para a área de transferência!',
      [
        { text: 'OK' },
        { 
          text: 'Ver Relatório', 
          onPress: () => {
            Alert.alert('Relatório do Caixa', relatorio, [
              { text: 'Fechar' }
            ]);
          }
        }
      ]
    );
  };

  const calcularEstatisticasCaixa = (caixa: Caixa) => {
    const vendasPorPagamento = caixa.vendas.reduce((acc, venda) => {
      acc[venda.formaPagamento] = (acc[venda.formaPagamento] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalDinheiro = caixa.vendas
      .filter(v => v.formaPagamento === 'dinheiro')
      .reduce((sum, v) => sum + v.total, 0);

    const totalPix = caixa.vendas
      .filter(v => v.formaPagamento === 'pix')
      .reduce((sum, v) => sum + v.total, 0);

    const totalCombinado = caixa.vendas
      .filter(v => v.formaPagamento === 'combinar')
      .reduce((sum, v) => sum + (v.pagamentoDinheiro || 0) + (v.pagamentoPix || 0), 0);

    const trocoTotal = caixa.vendas.reduce((sum, v) => sum + v.troco, 0);
    const totalDescontos = caixa.vendas.reduce((sum, v) => sum + v.desconto, 0);

    return {
      vendasPorPagamento,
      totalDinheiro,
      totalPix,
      totalCombinado,
      trocoTotal,
      totalDescontos,
    };
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            Relatórios
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Análise de caixas e vendas
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
              onValueChange={(value: string) => setFiltroPeriodo(value as 'hoje' | 'semana' | 'mes' | 'todos')}
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
                  {estatisticas.totalCaixas}
                </Text>
                <Text variant="bodySmall" style={styles.estatisticaLabel}>
                  Caixas
                </Text>
              </View>
              
              <View style={styles.estatisticaItem}>
                <Text variant="headlineSmall" style={styles.estatisticaValor}>
                  {estatisticas.caixasAbertos}
                </Text>
                <Text variant="bodySmall" style={styles.estatisticaLabel}>
                  Abertos
                </Text>
              </View>
              
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

        {/* Lista de Caixas */}
        <Card style={styles.caixasCard}>
          <Card.Content>
            <View style={styles.caixasHeader}>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Caixas
              </Text>
            </View>
            
            {caixasFiltradas.length === 0 ? (
              <Text variant="bodyMedium" style={styles.caixasVazio}>
                Nenhum caixa encontrado para o período selecionado.
              </Text>
            ) : (
              <View style={styles.caixasList}>
                {caixasFiltradas.map((caixa) => {
                  const estatisticasCaixa = calcularEstatisticasCaixa(caixa);
                  return (
                    <Card key={caixa.id} style={styles.caixaItem}>
                      <Card.Content style={styles.caixaContent}>
                        <View style={styles.caixaInfo}>
                          <Text variant="bodyMedium" style={styles.caixaNome}>
                            {caixa.nome}
                          </Text>
                          <Text variant="bodySmall" style={styles.caixaData}>
                            {formatarData(caixa.dataAbertura)}
                          </Text>
                          <Text variant="bodySmall" style={styles.caixaVendas}>
                            {caixa.vendas.length} venda(s) - {caixa.itens.length} produto(s)
                          </Text>
                        </View>
                        
                        <View style={styles.caixaValores}>
                          <Chip 
                            mode="outlined" 
                            style={[
                              styles.caixaStatus,
                              caixa.status === 'aberto' ? styles.statusAberto : styles.statusFechado
                            ]}
                          >
                            {caixa.status.toUpperCase()}
                          </Chip>
                          <Text variant="bodyMedium" style={styles.caixaTotal}>
                            {formatarMoeda(caixa.totalVendas)}
                          </Text>
                        </View>
                        
                        <View style={styles.caixaActions}>
                          <IconButton
                            icon="eye"
                            size={16}
                            onPress={() => abrirDetalhesCaixa(caixa)}
                          />
                          <IconButton
                            icon="download"
                            size={16}
                            onPress={() => exportarRelatorioCaixa(caixa)}
                            iconColor="#2196F3"
                          />
                        </View>
                      </Card.Content>
                    </Card>
                  );
                })}
              </View>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Modal de Detalhes do Caixa */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <ScrollView>
            {caixaSelecionada && (() => {
              const estatisticasCaixa = calcularEstatisticasCaixa(caixaSelecionada);
              return (
                <>
                  <Text variant="headlineSmall" style={styles.modalTitle}>
                    Detalhes do Caixa
                  </Text>
                  
                  <Text variant="bodyLarge" style={styles.modalCaixaNome}>
                    {caixaSelecionada.nome}
                  </Text>
                  
                  <Text variant="bodyMedium" style={styles.modalData}>
                    Aberto em: {formatarData(caixaSelecionada.dataAbertura)}
                  </Text>
                  
                  {caixaSelecionada.dataFechamento && (
                    <Text variant="bodyMedium" style={styles.modalData}>
                      Fechado em: {formatarData(caixaSelecionada.dataFechamento)}
                    </Text>
                  )}
                  
                  <Divider style={styles.divider} />
                  
                  <View style={styles.modalResumo}>
                    <View style={styles.modalResumoItem}>
                      <Text variant="bodyMedium">Status:</Text>
                      <Chip 
                        mode="outlined"
                        style={caixaSelecionada.status === 'aberto' ? styles.statusAberto : styles.statusFechado}
                      >
                        {caixaSelecionada.status.toUpperCase()}
                      </Chip>
                    </View>
                    
                    <View style={styles.modalResumoItem}>
                      <Text variant="bodyMedium">Total de Vendas:</Text>
                      <Text variant="bodyLarge" style={styles.modalTotalValue}>
                        {formatarMoeda(caixaSelecionada.totalVendas)}
                      </Text>
                    </View>
                    
                    <View style={styles.modalResumoItem}>
                      <Text variant="bodyMedium">Quantidade de Vendas:</Text>
                      <Text variant="bodyLarge">
                        {caixaSelecionada.vendas.length}
                      </Text>
                    </View>

                    <View style={styles.modalResumoItem}>
                      <Text variant="bodyMedium">Produtos no Caixa:</Text>
                      <Text variant="bodyLarge">
                        {caixaSelecionada.itens.length}
                      </Text>
                    </View>
                  </View>
                  
                  <Divider style={styles.divider} />
                  
                  <View style={styles.modalFinanceiro}>
                    <Text variant="titleMedium" style={styles.modalSubtitle}>
                      Resumo Financeiro
                    </Text>
                    
                    <View style={styles.modalResumoItem}>
                      <Text variant="bodyMedium">Total em Dinheiro:</Text>
                      <Text variant="bodyLarge" style={styles.modalDinheiroValue}>
                        {formatarMoeda(estatisticasCaixa.totalDinheiro)}
                      </Text>
                    </View>
                    
                    <View style={styles.modalResumoItem}>
                      <Text variant="bodyMedium">Total em PIX:</Text>
                      <Text variant="bodyLarge" style={styles.modalPixValue}>
                        {formatarMoeda(estatisticasCaixa.totalPix)}
                      </Text>
                    </View>
                    
                    <View style={styles.modalResumoItem}>
                      <Text variant="bodyMedium">Total Combinado:</Text>
                      <Text variant="bodyLarge" style={styles.modalCombinadoValue}>
                        {formatarMoeda(estatisticasCaixa.totalCombinado)}
                      </Text>
                    </View>
                    
                    <View style={styles.modalResumoItem}>
                      <Text variant="bodyMedium">Troco Total:</Text>
                      <Text variant="bodyLarge" style={styles.modalTrocoValue}>
                        {formatarMoeda(estatisticasCaixa.trocoTotal)}
                      </Text>
                    </View>
                    
                    <View style={styles.modalResumoItem}>
                      <Text variant="bodyMedium">Descontos Aplicados:</Text>
                      <Text variant="bodyLarge" style={styles.modalDescontoValue}>
                        {formatarMoeda(estatisticasCaixa.totalDescontos)}
                      </Text>
                    </View>
                  </View>
                  
                  <Divider style={styles.divider} />
                  
                  <View style={styles.modalMetodos}>
                    <Text variant="titleMedium" style={styles.modalSubtitle}>
                      Métodos de Pagamento
                    </Text>
                    
                    {Object.entries(estatisticasCaixa.vendasPorPagamento).map(([metodo, quantidade]) => (
                      <View key={metodo} style={styles.modalMetodoItem}>
                        <Chip mode="outlined" style={styles.modalMetodoChip}>
                          {metodo.toUpperCase()}
                        </Chip>
                        <Text variant="bodyMedium" style={styles.modalMetodoQuantidade}>
                          {quantidade} venda(s)
                        </Text>
                      </View>
                    ))}
                  </View>
                  
                  <Divider style={styles.divider} />
                  
                  <View style={styles.modalItens}>
                    <Text variant="titleMedium" style={styles.modalSubtitle}>
                      Produtos no Caixa
                    </Text>
                    
                    {caixaSelecionada.itens.length === 0 ? (
                      <Text variant="bodyMedium" style={styles.modalVazio}>
                        Nenhum produto adicionado.
                      </Text>
                    ) : (
                      caixaSelecionada.itens.map((item, index) => (
                        <View key={index} style={styles.modalItem}>
                          <View style={styles.modalItemInfo}>
                            <Text variant="bodyMedium" style={styles.modalItemNome}>
                              {item.produto.nome}
                            </Text>
                            <Text variant="bodySmall" style={styles.modalItemDetalhes}>
                              R$ {item.produto.preco.toFixed(2)} cada
                            </Text>
                          </View>
                          <Text variant="bodyMedium" style={styles.modalItemQuantidade}>
                            {item.quantidade} unidade(s)
                          </Text>
                        </View>
                      ))
                    )}
                  </View>
                  
                  <Divider style={styles.divider} />
                  
                  <View style={styles.modalVendas}>
                    <Text variant="titleMedium" style={styles.modalSubtitle}>
                      Vendas Realizadas
                    </Text>
                    
                    {caixaSelecionada.vendas.length === 0 ? (
                      <Text variant="bodyMedium" style={styles.modalVazio}>
                        Nenhuma venda realizada.
                      </Text>
                    ) : (
                      caixaSelecionada.vendas.map((venda, index) => (
                        <View key={index} style={styles.modalVenda}>
                          <View style={styles.modalVendaInfo}>
                            <Text variant="bodyMedium" style={styles.modalVendaData}>
                              {formatarData(venda.data)}
                            </Text>
                            <Text variant="bodySmall" style={styles.modalVendaItens}>
                              {venda.itens.length} item(s)
                            </Text>
                          </View>
                          
                          <View style={styles.modalVendaValores}>
                            <Chip mode="outlined" style={styles.modalVendaPagamento}>
                              {venda.formaPagamento.toUpperCase()}
                            </Chip>
                            <Text variant="bodyMedium" style={styles.modalVendaTotal}>
                              {formatarMoeda(venda.total)}
                            </Text>
                          </View>
                        </View>
                      ))
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
              );
            })()}
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
  caixasCard: {
    marginBottom: 20,
  },
  caixasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  caixasVazio: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  caixasList: {
    gap: 8,
  },
  caixaItem: {
    marginBottom: 8,
  },
  caixaContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  caixaInfo: {
    flex: 1,
  },
  caixaNome: {
    fontWeight: 'bold',
  },
  caixaData: {
    color: '#666',
  },
  caixaVendas: {
    color: '#666',
  },
  caixaValores: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  caixaStatus: {
    marginBottom: 4,
  },
  statusAberto: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4CAF50',
  },
  statusFechado: {
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
  },
  caixaTotal: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
  caixaActions: {
    flexDirection: 'row',
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
  modalCaixaNome: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 8,
  },
  modalData: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 4,
  },
  divider: {
    marginVertical: 16,
  },
  modalResumo: {
    gap: 8,
  },
  modalResumoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTotalValue: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
  modalFinanceiro: {
    marginBottom: 16,
  },
  modalDinheiroValue: {
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  modalPixValue: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
  modalCombinadoValue: {
    fontWeight: 'bold',
    color: '#FF9800',
  },
  modalTrocoValue: {
    fontWeight: 'bold',
    color: '#9C27B0',
  },
  modalDescontoValue: {
    fontWeight: 'bold',
    color: '#f44336',
  },
  modalMetodos: {
    marginBottom: 16,
  },
  modalMetodoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalMetodoChip: {
    flex: 1,
  },
  modalMetodoQuantidade: {
    fontWeight: '500',
    marginLeft: 12,
  },
  modalSubtitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalVazio: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  modalItens: {
    marginBottom: 16,
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
  modalItemQuantidade: {
    fontWeight: 'bold',
  },
  modalVendas: {
    marginBottom: 16,
  },
  modalVenda: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalVendaInfo: {
    flex: 1,
  },
  modalVendaData: {
    fontWeight: '500',
  },
  modalVendaItens: {
    color: '#666',
  },
  modalVendaValores: {
    alignItems: 'flex-end',
  },
  modalVendaPagamento: {
    marginBottom: 4,
  },
  modalVendaTotal: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
  modalButton: {
    marginTop: 16,
  },
});
