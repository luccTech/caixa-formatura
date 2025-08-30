import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
        },
        headerStyle: {
          backgroundColor: '#2196F3',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Produtos",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="inventory" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="caixa"
        options={{
          title: "Caixa",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="point-of-sale" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="relatorios"
        options={{
          title: "Relatórios",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="analytics" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
