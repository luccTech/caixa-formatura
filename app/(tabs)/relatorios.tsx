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
  const { caixas, vendas, getVendasPorCaixa, excluirCaixa } = useAppContext();
  const [modalVisible, setModalVisible] = useState(false);
  const [caixaSelecionada, setCaixaSelecionada] = useState<Caixa | null>(null);
  const [filtroPeriodo, setFiltroPeriodo] = useState<'hoje' | 'semana' | 'mes' | 'todos'>('todos');

  // Filtrar caixas por período
  const caixasFiltradas = useMemo(() => {
    const agora = new Date();
    const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    const umaSemanaAtras = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);
    const umMesAtras = new Date(agora.getFullYear(), agora.getMonth() - 1, agora.getDate());

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

    const totalDescontos = caixasFiltradas.reduce((sum, caixa) => 
      sum + caixa.vendas.reduce((vendaSum, venda) => vendaSum + (venda.desconto || 0), 0), 0
    );

    return {
      totalCaixas,
      caixasAbertos,
      caixasFechados,
      totalReceita,
      totalVendas,
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

  const excluirCaixaComConfirmacao = (caixa: Caixa) => {
    if (caixa.status === 'aberto') {
      Alert.alert('Erro', 'Não é possível excluir um caixa aberto!');
      return;
    }

    Alert.alert(
      'Excluir Caixa',
      `Deseja realmente excluir o caixa "${caixa.nome}"?\n\nEsta ação não pode ser desfeita e removerá:\n• O caixa e todos os seus dados\n• ${caixa.vendas.length} venda(s) registrada(s)\n• Histórico completo`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: () => {
            try {
              excluirCaixa(caixa.id);
              Alert.alert('Sucesso', 'Caixa excluído com sucesso!');
            } catch (error) {
              Alert.alert('Erro', error instanceof Error ? error.message : 'Erro ao excluir caixa');
            }
          }
        },
      ]
    );
  };

  const exportarRelatorioCaixa = (caixa: Caixa) => {
    const estatisticasCaixa = calcularEstatisticasCaixa(caixa);
    
    const relatorio = `
RELATÓRIO DO CAIXA: ${caixa.nome}
Data de Abertura: ${formatarData(caixa.dataAbertura)}
${caixa.dataFechamento ? `Data de Fechamento: ${formatarData(caixa.dataFechamento)}` : 'Status: ABERTO'}
Troco Inicial: ${formatarMoeda(caixa.trocoInicial || 0)}

RESUMO FINANCEIRO:
- Total de Vendas: ${formatarMoeda(caixa.totalVendas)}
- Quantidade de Vendas: ${caixa.vendas.length}
- Total em Dinheiro: ${formatarMoeda(estatisticasCaixa.totalDinheiro)}
- Total em PIX: ${formatarMoeda(estatisticasCaixa.totalPix)}
- Troco Total: ${formatarMoeda(estatisticasCaixa.trocoTotal)}
- Descontos Aplicados: ${formatarMoeda(estatisticasCaixa.totalDescontos)}

VENDAS REALIZADAS:
${caixa.vendas.map((venda, index) => `
Venda ${index + 1} - ${formatarData(venda.data)}
Total: ${formatarMoeda(venda.total)}
Forma de Pagamento: ${venda.formaPagamento.toUpperCase()}
${venda.formaPagamento === 'combinar' ? `- Dinheiro: ${formatarMoeda(venda.pagamentoDinheiro || 0)}\n- PIX: ${formatarMoeda(venda.pagamentoPix || 0)}` : ''}
${venda.troco > 0 ? `Troco: ${formatarMoeda(venda.troco)}` : ''}
Itens: ${venda.itens.map(item => `${item.quantidade}x ${item.produto.nome}`).join(', ')}
`).join('\n')}
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

  const exportarVendaIndividual = (venda: any, caixaNome: string) => {
    const notaFiscal = `
NOTA FISCAL - VENDA ${venda.id.slice(-4).toUpperCase()}
Caixa: ${caixaNome}
Data: ${formatarData(venda.data)}
Hora: ${new Date(venda.data).toLocaleTimeString('pt-BR')}

ITENS:
${venda.itens.map((item: any, index: number) => `${index + 1}. ${item.produto.nome}
   ${item.quantidade}x R$ ${item.precoUnitario.toFixed(2)} = R$ ${item.subtotal.toFixed(2)}`).join('\n')}

${venda.desconto > 0 ? `Desconto: -${formatarMoeda(venda.desconto)}\n` : ''}
TOTAL: ${formatarMoeda(venda.total)}

FORMA DE PAGAMENTO: ${venda.formaPagamento.toUpperCase()}
${venda.formaPagamento === 'dinheiro' ? `Valor Recebido: ${formatarMoeda(parseFloat(venda.valorRecebido || '0'))}\nTroco: ${formatarMoeda(venda.troco)}` : ''}
${venda.formaPagamento === 'combinar' ? `Dinheiro: ${formatarMoeda(venda.pagamentoDinheiro || 0)}\nPIX: ${formatarMoeda(venda.pagamentoPix || 0)}` : ''}

Obrigado pela preferência!
    `.trim();

    Alert.alert(
      'Nota Fiscal Gerada',
      'Nota fiscal copiada para a área de transferência!',
      [
        { text: 'OK' },
        { 
          text: 'Ver Nota Fiscal', 
          onPress: () => {
            Alert.alert('Nota Fiscal', notaFiscal, [
              { text: 'Fechar' }
            ]);
          }
        }
      ]
    );
  };

  const calcularEstatisticasCaixa = (caixa: Caixa) => {
    // Verificar se caixa e vendas existem
    if (!caixa || !caixa.vendas) {
      return {
        totalDinheiro: 0,
        totalPix: 0,
        trocoTotal: 0,
        totalDescontos: 0,
      };
    }

    const totalDinheiro = caixa.vendas
      .filter(v => v && v.formaPagamento === 'dinheiro')
      .reduce((sum, v) => sum + (v.total || 0), 0);

    const totalPix = caixa.vendas
      .filter(v => v && v.formaPagamento === 'pix')
      .reduce((sum, v) => sum + (v.total || 0), 0);

    // Para vendas combinadas, separar os valores
    const vendasCombinadas = caixa.vendas.filter(v => v && v.formaPagamento === 'combinar');
    const totalDinheiroCombinado = vendasCombinadas.reduce((sum, v) => sum + (v.pagamentoDinheiro || 0), 0);
    const totalPixCombinado = vendasCombinadas.reduce((sum, v) => sum + (v.pagamentoPix || 0), 0);

    const trocoTotal = caixa.vendas.reduce((sum, v) => sum + (v.troco || 0), 0);
    const totalDescontos = caixa.vendas.reduce((sum, v) => sum + (v.desconto || 0), 0);

    return {
      totalDinheiro: totalDinheiro + totalDinheiroCombinado,
      totalPix: totalPix + totalPixCombinado,
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
                            iconColor="#00407B"
                          />
                          {caixa.status === 'fechado' && (
                            <IconButton
                              icon="delete"
                              size={16}
                              onPress={() => excluirCaixaComConfirmacao(caixa)}
                              iconColor="#f44336"
                            />
                          )}
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
                      <Text variant="bodyMedium">Troco Inicial:</Text>
                      <Text variant="bodyLarge" style={styles.modalTrocoInicialValue}>
                        {formatarMoeda(caixaSelecionada.trocoInicial || 0)}
                      </Text>
                    </View>
                    
                    <View style={styles.modalResumoItem}>
                      <Text variant="bodyMedium">Quantidade de Vendas:</Text>
                      <Text variant="bodyLarge">
                        {caixaSelecionada.vendas.length}
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
                        <View key={venda.id} style={styles.modalVenda}>
                          <View style={styles.modalVendaInfo}>
                            <Text variant="bodyMedium" style={styles.modalVendaData}>
                              Venda {index + 1} - {formatarData(venda.data)}
                            </Text>
                            <Text variant="bodySmall" style={styles.modalVendaItens}>
                              {venda.itens.map(item => `${item.quantidade}x ${item.produto.nome}`).join(', ')}
                            </Text>
                          </View>
                          
                          <View style={styles.modalVendaValores}>
                            <Text variant="bodySmall" style={styles.modalVendaPagamento}>
                              {venda.formaPagamento.toUpperCase()}
                            </Text>
                            <Text variant="bodyMedium" style={styles.modalVendaTotal}>
                              {formatarMoeda(venda.total)}
                            </Text>
                            <View style={styles.modalVendaActions}>
                              <IconButton
                                icon="eye"
                                size={16}
                                onPress={() => exportarVendaIndividual(venda, caixaSelecionada.nome)}
                                iconColor="#00407B"
                              />
                              <IconButton
                                icon="download"
                                size={16}
                                onPress={() => exportarVendaIndividual(venda, caixaSelecionada.nome)}
                                iconColor="#4CAF50"
                              />
                            </View>
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
    color: '#00407B',
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
    marginBottom: 8,
  },
  estatisticasCard: {
    marginBottom: 16,
  },
  estatisticasGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  estatisticaItem: {
    alignItems: 'center',
    minWidth: '22%',
    marginBottom: 12,
  },
  estatisticaValor: {
    fontWeight: 'bold',
    color: '#00407B',
  },
  estatisticaLabel: {
    color: '#666',
    textAlign: 'center',
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
    marginBottom: 12,
  },
  caixasVazio: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  caixasList: {
    gap: 12,
  },
  caixaItem: {
    marginBottom: 8,
  },
  caixaContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  caixaInfo: {
    flex: 1,
  },
  caixaNome: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  caixaData: {
    color: '#666',
    marginBottom: 2,
  },
  caixaVendas: {
    color: '#666',
    fontSize: 12,
  },
  caixaValores: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  caixaStatus: {
    marginBottom: 4,
  },
  statusAberto: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
  },
  statusFechado: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF9800',
  },
  caixaTotal: {
    fontWeight: 'bold',
    color: '#00407B',
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
    marginBottom: 20,
    fontWeight: 'bold',
  },
  modalCaixaNome: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#00407B',
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
    marginBottom: 16,
  },
  modalResumoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTotalValue: {
    fontWeight: 'bold',
    color: '#00407B',
  },
  modalTrocoInicialValue: {
    fontWeight: 'bold',
    color: '#FF9800',
  },
  modalFinanceiro: {
    marginBottom: 16,
  },
  modalSubtitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalDinheiroValue: {
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  modalPixValue: {
    fontWeight: 'bold',
    color: '#00407B',
  },
  modalTrocoValue: {
    fontWeight: 'bold',
    color: '#9C27B0',
  },
  modalDescontoValue: {
    fontWeight: 'bold',
    color: '#f44336',
  },
  modalItens: {
    marginBottom: 16,
  },
  modalVazio: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
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
    color: '#666',
  },
  modalVendaTotal: {
    fontWeight: 'bold',
    color: '#00407B',
  },
  modalVendaActions: {
    flexDirection: 'row',
    marginTop: 4,
  },
  modalButton: {
    marginTop: 16,
  },
});
