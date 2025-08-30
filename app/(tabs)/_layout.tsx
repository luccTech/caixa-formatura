import { Tabs } from "expo-router";

export default function Layout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: "Produtos" }} />
      <Tabs.Screen name="caixa" options={{ title: "Caixa" }} />
      <Tabs.Screen name="relatorios" options={{ title: "Relatórios" }} />
    </Tabs>
  );
}
