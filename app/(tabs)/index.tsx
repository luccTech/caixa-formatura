import { useState } from "react";
import { View, Text, TextInput, Button, FlatList, StyleSheet } from "react-native";

export default function Produtos() {
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [estoque, setEstoque] = useState("");
  const [produtos, setProdutos] = useState<any[]>([]);

  const adicionarProduto = () => {
    if (!nome || !preco || !estoque) return alert("Preencha todos os campos!");
    setProdutos([...produtos, { id: Date.now(), nome, preco: parseFloat(preco), estoque: parseInt(estoque) }]);
    setNome("");
    setPreco("");
    setEstoque("");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Cadastrar Produto</Text>
      <TextInput style={styles.input} placeholder="Nome" value={nome} onChangeText={setNome} />
      <TextInput style={styles.input} placeholder="Preço" keyboardType="numeric" value={preco} onChangeText={setPreco} />
      <TextInput style={styles.input} placeholder="Estoque" keyboardType="numeric" value={estoque} onChangeText={setEstoque} />
      <Button title="Adicionar" onPress={adicionarProduto} />

      <Text style={styles.subtitulo}>Produtos Cadastrados</Text>
      <FlatList
        data={produtos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Text>{item.nome} - R${item.preco.toFixed(2)} (Estoque: {item.estoque})</Text>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  titulo: { fontSize: 20, fontWeight: "bold" },
  subtitulo: { fontSize: 18, marginTop: 20 },
  input: { borderWidth: 1, marginVertical: 5, padding: 8, borderRadius: 5 }
});
