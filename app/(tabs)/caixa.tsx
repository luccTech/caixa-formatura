import { useState } from "react";
import { View, Text, Button, FlatList, TouchableOpacity, StyleSheet } from "react-native";

export default function Caixa() {
  const [produtos] = useState([
    { id: 1, nome: "Coxinha", preco: 5.0, estoque: 10 },
    { id: 2, nome: "Refrigerante", preco: 6.0, estoque: 8 },
  ]);
  const [sacola, setSacola] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);

  const adicionarSacola = (produto: any) => {
    setSacola([...sacola, produto]);
  };

  const fecharPedido = () => {
    if (sacola.length === 0) return alert("Sacola vazia!");
    const total = sacola.reduce((sum, item) => sum + item.preco, 0);
    setPedidos([...pedidos, { id: pedidos.length + 1, itens: sacola, total, data: new Date().toLocaleString() }]);
    setSacola([]);
    alert(`Pedido fechado! Total: R$${total.toFixed(2)}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Caixa</Text>
      <FlatList
        data={produtos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => adicionarSacola(item)}>
            <Text>{item.nome} - R${item.preco.toFixed(2)}</Text>
          </TouchableOpacity>
        )}
      />

      <Text style={styles.subtitulo}>Sacola ({sacola.length} itens)</Text>
      <Button title="Fechar Pedido" onPress={fecharPedido} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  titulo: { fontSize: 22, fontWeight: "bold" },
  subtitulo: { fontSize: 18, marginVertical: 10 },
  item: { padding: 10, backgroundColor: "#eee", marginVertical: 5, borderRadius: 5 }
});
