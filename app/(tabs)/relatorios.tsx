import { useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";

export default function Relatorios() {
  const [pedidos] = useState<any[]>([
    { id: 1, total: 15.0, data: "30/08/2025 14:00" },
    { id: 2, total: 20.0, data: "30/08/2025 15:30" }
  ]);

  const totalDia = pedidos.reduce((sum, p) => sum + p.total, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Relatórios</Text>
      <FlatList
        data={pedidos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Text>Pedido #{item.id} - R${item.total.toFixed(2)} ({item.data})</Text>
        )}
      />
      <Text style={styles.subtitulo}>Total do dia: R${totalDia.toFixed(2)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  titulo: { fontSize: 22, fontWeight: "bold" },
  subtitulo: { fontSize: 18, marginTop: 20 }
});
