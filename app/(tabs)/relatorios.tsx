import * as Clipboard from 'expo-clipboard';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
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
  const [notaModalVisible, setNotaModalVisible] = useState(false);
  const [notaTexto, setNotaTexto] = useState('');
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

  const copiarParaClipboard = async (texto: string) => {
    try {
      await Clipboard.setStringAsync(texto);
      Alert.alert('Sucesso', 'Conteúdo copiado para a área de transferência!');
    } catch (error) {
      Alert.alert('Erro', 'Erro ao copiar para a área de transferência');
    }
  };

  const gerarNotaFiscal = (venda: any, caixaNome: string) => {
    const notaFiscal = `
NOTA FISCAL - VENDA ${venda.id ? venda.id.slice(-4).toUpperCase() : 'N/A'}
Caixa: ${caixaNome}
Data: ${formatarData(venda.data)}
Hora: ${new Date(venda.data).toLocaleTimeString('pt-BR')}

ITENS:
${venda.itens.map((item: any, index: number) => `${index + 1}. ${item.produto.nome}
    ${item.quantidade}x R$ ${item.precoUnitario.toFixed(2)} = R$ ${item.subtotal.toFixed(2)}`).join('\n')}

${venda.desconto > 0 ? `Desconto: -${formatarMoeda(venda.desconto)}\n` : ''}
TOTAL: ${formatarMoeda(venda.total)}

FORMA DE PAGAMENTO: ${venda.formaPagamento.toUpperCase()}
${venda.formaPagamento === 'dinheiro' ? `Valor Recebido: ${formatarMoeda(parseFloat(venda.total + venda.troco))}\nTroco: ${formatarMoeda(venda.troco)}` : ''}
${venda.formaPagamento === 'combinar' ? `Dinheiro: ${formatarMoeda(venda.pagamentoDinheiro || 0)}\nPIX: ${formatarMoeda(venda.pagamentoPix || 0)}` : ''}

Obrigado pela preferência!
    `.trim();
    return notaFiscal;
  };

  const exportarParaExcel = (caixa: Caixa) => {
    const estatisticasCaixa = calcularEstatisticasCaixa(caixa);
    
    // Formato CSV para Excel/Google Sheets
    const csvContent = `RELATÓRIO DO CAIXA: ${caixa.nome}
Data de Abertura,${formatarData(caixa.dataAbertura)}
${caixa.dataFechamento ? `Data de Fechamento,${formatarData(caixa.dataFechamento)}` : 'Status,ABERTO'}
Troco Inicial,${formatarMoeda(caixa.trocoInicial || 0)}

RESUMO FINANCEIRO
Total de Vendas,${formatarMoeda(caixa.totalVendas)}
Quantidade de Vendas,${caixa.vendas.length}
Total em Dinheiro,${formatarMoeda(estatisticasCaixa.totalDinheiro)}
Total em PIX,${formatarMoeda(estatisticasCaixa.totalPix)}
Troco Total,${formatarMoeda(estatisticasCaixa.trocoTotal)}
Descontos Aplicados,${formatarMoeda(estatisticasCaixa.totalDescontos)}

VENDAS REALIZADAS
Número,Data,Total,Forma de Pagamento,Itens
${caixa.vendas.map((venda, index) => {
  const itens = venda.itens.map(item => `${item.quantidade}x ${item.produto.nome}`).join('; ');
  return `${index + 1},${formatarData(venda.data)},${formatarMoeda(venda.total)},${venda.formaPagamento.toUpperCase()},${itens}`;
}).join('\n')}`;

    Alert.alert(
      'Exportar para Excel/Google Sheets',
      'Escolha uma opção:',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Copiar CSV', 
          onPress: () => copiarParaClipboard(csvContent)
        },
        { 
          text: 'Compartilhar Arquivo', 
          onPress: async () => {
            try {
              const htmlContent = `
                <html>
                  <head>
                    <meta charset="utf-8">
                    <title>Relatório - ${caixa.nome}</title>
                    <style>
                      body { font-family: Arial, sans-serif; margin: 20px; }
                      table { border-collapse: collapse; width: 100%; margin-top: 20px; }
                      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                      th { background-color: #00407B; color: white; }
                      .header { background-color: #f0f0f0; font-weight: bold; }
                    </style>
                  </head>
                  <body>
                    <h1>RELATÓRIO DO CAIXA: ${caixa.nome}</h1>
                    <p><strong>Data de Abertura:</strong> ${formatarData(caixa.dataAbertura)}</p>
                    ${caixa.dataFechamento ? `<p><strong>Data de Fechamento:</strong> ${formatarData(caixa.dataFechamento)}</p>` : '<p><strong>Status:</strong> ABERTO</p>'}
                    <p><strong>Troco Inicial:</strong> ${formatarMoeda(caixa.trocoInicial || 0)}</p>
                    
                    <h2>RESUMO FINANCEIRO</h2>
                    <table>
                      <tr><td>Total de Vendas</td><td>${formatarMoeda(caixa.totalVendas)}</td></tr>
                      <tr><td>Quantidade de Vendas</td><td>${caixa.vendas.length}</td></tr>
                      <tr><td>Total em Dinheiro</td><td>${formatarMoeda(estatisticasCaixa.totalDinheiro)}</td></tr>
                      <tr><td>Total em PIX</td><td>${formatarMoeda(estatisticasCaixa.totalPix)}</td></tr>
                      <tr><td>Troco Total</td><td>${formatarMoeda(estatisticasCaixa.trocoTotal)}</td></tr>
                      <tr><td>Descontos Aplicados</td><td>${formatarMoeda(estatisticasCaixa.totalDescontos)}</td></tr>
                    </table>
                    
                    <h2>VENDAS REALIZADAS</h2>
                    <table>
                      <tr class="header">
                        <th>Número</th>
                        <th>Data</th>
                        <th>Total</th>
                        <th>Forma de Pagamento</th>
                        <th>Itens</th>
                      </tr>
                      ${caixa.vendas.map((venda, index) => {
                        const itens = venda.itens.map(item => `${item.quantidade}x ${item.produto.nome}`).join(', ');
                        return `
                          <tr key={venda.id}>
                            <td>${index + 1}</td>
                            <td>${formatarData(venda.data)}</td>
                            <td>${formatarMoeda(venda.total)}</td>
                            <td>${venda.formaPagamento.toUpperCase()}</td>
                            <td>${itens}</td>
                          </tr>
                        `;
                      }).join('')}
                    </table>
                  </body>
                </html>
              `;
              
              const { uri } = await Print.printToFileAsync({ html: htmlContent });
              await Sharing.shareAsync(uri, {
                mimeType: 'application/pdf',
                dialogTitle: `Relatório - ${caixa.nome}`,
              });
            } catch (error) {
              Alert.alert('Erro', 'Erro ao gerar arquivo para compartilhamento');
            }
          }
        }
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
      'Escolha uma opção:',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Copiar Texto', 
          onPress: () => copiarParaClipboard(relatorio)
        },
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

  const exportarVendaIndividual = async (venda: any, caixaNome: string) => {
    const notaFiscal = gerarNotaFiscal(venda, caixaNome);
    setNotaTexto(notaFiscal);
    setNotaModalVisible(true);
  };
    
  const copiarNotaDoModal = async () => {
    if (notaTexto) {
      await Clipboard.setStringAsync(notaTexto);
      Alert.alert('Copiado!', 'A nota fiscal foi copiada para a área de transferência.');
    }
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
                    <Card key={caixa.id} style={styles.caixaItem} onPress={() => abrirDetalhesCaixa(caixa)}>
                      <Card.Content style={styles.caixaContent}>
                        <View style={styles.caixaInfo}>
                          <Text variant="bodyMedium" style={styles.caixaNome}>
                            {caixa.nome}
                          </Text>
                          <Text variant="bodySmall" style={styles.caixaData}>
                            {formatarData(caixa.dataAbertura)}
                          </Text>
                          <Text variant="bodySmall" style={styles.caixaVendas}>
                            {caixa.vendas.length} venda(s) {"\n"}{caixa.itens.length} produto(s)
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
                                icon="download"
                                size={16}
                                onPress={() => {
                                  const nota = gerarNotaFiscal(venda, caixaSelecionada.nome);
                                  setNotaTexto(nota);
                                  setNotaModalVisible(true);
                                }}
                                iconColor="#4CAF50"
                              />
                            </View>
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                  
                  <View style={styles.modalButtons}>
                    <Button
                      mode="outlined"
                      onPress={() => exportarParaExcel(caixaSelecionada)}
                      style={styles.modalButton}
                      icon="table"
                    >
                      Exportar Excel
                    </Button>
                    <Button
                      mode="contained"
                      onPress={() => setModalVisible(false)}
                      style={styles.modalButton}
                    >
                      Fechar
                    </Button>
                  </View>
                </>
              );
            })()}
          </ScrollView>
        </Modal>
      </Portal>

      {/* Modal da Nota Fiscal */}
      <Portal>
        <Modal
          visible={notaModalVisible}
          onDismiss={() => setNotaModalVisible(false)}
          contentContainerStyle={styles.notaModal}
        >
          <ScrollView style={styles.notaScrollView}>
            <Text style={styles.notaTexto}>{notaTexto}</Text>
          </ScrollView>
          <View style={styles.notaBotoes}>
            <Button
              mode="outlined"
              onPress={() => setNotaModalVisible(false)}
              style={styles.notaBotao}
            >
              Fechar
            </Button>
            <Button
              mode="contained"
              onPress={() => copiarParaClipboard(notaTexto)}
              style={styles.notaBotao}
            >
              Copiar Nota
            </Button>
          </View>
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
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
  },
  notaModal: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  notaScrollView: {
    flexGrow: 1,
  },
  notaTexto: {
    fontFamily: 'monospace',
    fontSize: 14,
    lineHeight: 20,
  },
  notaBotoes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  notaBotao: {
    flex: 1,
  },
});
