import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Image, StyleSheet, View } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#00407B',
        tabBarInactiveTintColor: '#666',
        headerStyle: {
          backgroundColor: '#00407B',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e0e0e0',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '',
          tabBarLabel: 'Produtos',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="inventory" size={size} color={color} />
          ),
          headerTitle: () => (
            <View style={styles.headerContainer}>
              <Image
                source={require('../../assets/images/logo.png')}
                style={styles.headerLogo}
                resizeMode="contain"
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="caixa"
        options={{
          title: '',
          tabBarLabel: 'Caixa',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="point-of-sale" size={size} color={color} />
          ),
          headerTitle: () => (
            <View style={styles.headerContainer}>
              <Image
                source={require('../../assets/images/logo.png')}
                style={styles.headerLogo}
                resizeMode="contain"
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="relatorios"
        options={{
          title: '',
          tabBarLabel: 'Relatórios',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="assessment" size={size} color={color} />
          ),
          headerTitle: () => (
            <View style={styles.headerContainer}>
              <Image
                source={require('../../assets/images/logo.png')}
                style={styles.headerLogo}
                resizeMode="contain"
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogo: {
    width: 120,
    height: 40,
  },
});
