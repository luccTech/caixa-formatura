![Descrição](./assets/images/logo1.png)

# Sistema de Caixa - Formatura 4° Informatica 2025

Um sistema de caixa profissional desenvolvido em React Native com Expo, para gerenciamento de produtos e vendas e otimizar nosso controle de caixa da formatura!!!!!

## 🚀 Funcionalidades

### 📦 Gestão de Produtos
- ✅ Cadastro completo de produtos (nome, código, preço, estoque, categoria)
- ✅ Edição de produtos existentes
- ✅ Exclusão com confirmação
- ✅ Códigos únicos para cada produto
- ✅ Controle de estoque automático

### 💰 Sistema de Caixa
- ✅ Busca de produtos por código
- ✅ Carrinho de compras interativo
- ✅ Controle de quantidade e estoque
- ✅ Múltiplas formas de pagamento (Dinheiro, Cartão, PIX)
- ✅ Cálculo automático de troco
- ✅ Aplicação de descontos
- ✅ Atualização automática do estoque

### 📊 Relatórios Avançados
- ✅ Filtros por período (Hoje, Semana, Mês, Todos)
- ✅ Estatísticas em tempo real
- ✅ Análise por forma de pagamento
- ✅ Ticket médio e receita total
- ✅ Detalhes completos de cada venda

## 🛠️ Tecnologias Utilizadas

- **React Native** - Framework mobile
- **Expo** - Plataforma de desenvolvimento
- **TypeScript** - Tipagem estática
- **React Native Paper** - Componentes Material Design
- **AsyncStorage** - Persistência de dados
- **Expo Router** - Navegação

## 📱 Como Executar

### Pré-requisitos
- Node.js (versão 16 ou superior)
- npm ou yarn
- Expo CLI

### Instalação

1. **Clone o repositório:**
   ```bash
   git clone <url-do-repositorio>
   cd caixa-formatura
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Execute o projeto:**
   ```bash
   npm start
   ```

4. **Escaneie o QR Code** com o app Expo Go no seu dispositivo móvel

## 📋 Como Usar

### 1. Cadastrar Produtos
- Acesse a aba "Produtos"
- Toque no botão "+" para adicionar um novo produto
- Preencha todos os campos obrigatórios:
  - **Nome**: Nome do produto
  - **Código**: Código único (ex: COLA001)
  - **Preço**: Preço em reais
  - **Estoque**: Quantidade disponível
  - **Categoria**: Categoria do produto (livre)

### 2. Realizar Vendas
- Acesse a aba "Caixa"
- Digite o código do produto no campo de busca
- Toque na lupa ou pressione Enter
- O produto será adicionado ao carrinho
- Ajuste quantidades com os botões + e -
- Aplique desconto se necessário
- Toque em "Finalizar Venda"
- Escolha a forma de pagamento
- Confirme a venda

### 3. Acompanhar Relatórios
- Acesse a aba "Relatórios"
- Use os filtros para ver vendas por período
- Visualize estatísticas gerais
- Toque em uma venda para ver detalhes completos

## 🎨 Interface

- **Design Material Design** com cores profissionais
- **Navegação intuitiva** por abas
- **Feedback visual** para todas as ações
- **Modais elegantes** para formulários
- **Cards organizados** para informações

## 💾 Persistência de Dados

- Todos os dados são salvos automaticamente no dispositivo
- Produtos e vendas persistem entre sessões
- Backup automático no AsyncStorage

## 🔧 Estrutura do Projeto

```
caixa-formatura/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx          # Tela de Produtos
│   │   ├── caixa.tsx          # Tela do Caixa
│   │   ├── relatorios.tsx     # Tela de Relatórios
│   │   └── _layout.tsx        # Layout das abas
│   └── _layout.tsx            # Layout principal
├── contexts/
│   └── AppContext.tsx         # Contexto global
├── components/                # Componentes reutilizáveis
└── package.json
```

## 🚀 Próximas Funcionalidades

- [ ] Exportação de relatórios em PDF
- [ ] Backup na nuvem
- [ ] Múltiplos usuários
- [ ] Impressão de comprovantes
- [ ] Integração com impressoras térmicas

