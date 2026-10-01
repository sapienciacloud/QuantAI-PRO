# 🚀 QuantAI MT5 & Crypto - Plataforma de Trading Quantitativo e Robôs de IA

![QuantAI Version](https://img.shields.io/badge/versão-2.4.0-emerald?style=for-the-badge)
![React](https://img.shields.io/badge/React-19.0-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=for-the-badge&logo=tailwindcss)
![Python](https://img.shields.io/badge/Python-3.10%2B-yellow?style=for-the-badge&logo=python)
![MetaTrader 5](https://img.shields.io/badge/MetaTrader-5-green?style=for-the-badge)
![Binance Futures](https://img.shields.io/badge/Binance-Futures_API-F3BA2F?style=for-the-badge&logo=binance)
![Gemini AI](https://img.shields.io/badge/Google_Gemini-3.5_Flash-8E75FF?style=for-the-badge&logo=google)

Plataforma quantitativa profissional de trading algorítmico com modelos de Machine Learning (Random Forest, HistGradientBoosting e Regressão Logística), monitoramento ao vivo de ordens, gestão rigorosa de risco estatístico, suporte nativo a múltiplos robôs para **B3 Futuros (Mini Índice WIN e Mini Dólar WDO)**, **Binance USD-M Futures (BTC, ETH, SOL, BNB, XRP)** e **Forex**, além de disparo automático de **Webhooks HTTP (Discord, TradingView, Slack)** e **Copilot de Risco com IA generativa**.

---

## 📑 Tabela de Conteúdos

- [Visão Geral](#-visão-geral)
- [Principais Funcionalidades](#-principais-funcionalidades)
- [Arquitetura do Sistema](#-arquitetura-do-sistema)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação e Uso da Plataforma Web](#-instalação-e-uso-da-plataforma-web)
- [Como Rodar o Robô em Python (MT5 & Binance)](#-como-rodar-o-robô-em-python-mt5--binance)
- [Configuração de Webhooks & Alertas](#-configuração-de-webhooks--alertas)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Configuração de Variáveis de Ambiente](#-configuração-de-variáveis-de-ambiente)
- [Aviso de Risco](#-aviso-de-risco)

---

## 🌟 Visão Geral

O **QuantAI MT5 & Crypto** une a precisão analítica de modelos estatísticos avançados à velocidade de execução do **MetaTrader 5** e da **Binance Futures**. 

O sistema oferece:
1. **Interface Web Intuitiva:** Menu lateral retrátil com visualização em tempo real de gráficos de velas (candlesticks), indicadores técnicos (Médias Móveis, Bandas de Bollinger, RSI, ATR), probabilidades calculadas pela IA por barra e painel de telemetria.
2. **Gestão de Risco Quantitativo Consolidada:** Medição contínua da exposição nocional em carteira, monitoramento de *Drawdown* intraday em relação ao *High Water Mark*, limites de perda diária global (*Circuit Breakers*) e ajuste de perfis de risco (VaR 95%).
3. **QuantAI Risk Copilot (Gemini 3.5):** Inteligência Artificial atuando como Chief Risk Officer (CRO) para orientar o operador sobre dimensionamento de lotes, critérios matemáticos de Kelly e proteção de capital.
4. **Gerador Dinâmico de Código Python:** Código modular com conector IPC para MT5, cliente assíncrono para Binance Futures, disparador de webhooks e integração com MetaApi Cloud para rodar 100% em servidores Linux sem Windows.

---

## ⚡ Principais Funcionalidades

### 1. Menu Lateral Intuitivo & Multi-Robôs
- Painel lateral unificado para seleção e gerenciamento de múltiplos robôs independentes.
- Status operacional em tempo real: `EM OPERAÇÃO`, `PAUSADO` ou `PARADO`.
- Botões de início rápido, pausa e **Zeragem de Emergência (Pânico)** acessíveis de qualquer tela.
- Atalho oficial para a tela de **Gerenciamento de API na Binance** para integração em minutos.

### 2. Monitor ao Vivo & Gráfico Candlestick
- Gráfico interativo com marcações visuais de compra e venda geradas pelo robô.
- Indicadores técnicos sobrepostos: Médias Exponenciais (EMA 9, EMA 21), Média Simples (SMA 50), Bandas de Bollinger, Índice de Força Relativa (RSI 14) e ATR.
- Painel de Posição Aberta no MT5 com cálculo dinâmico de PnL flutuante, preço de entrada, alvo (TP) e proteção (SL).
- Terminal de Logs com categorização colorida (`INFO`, `SUCCESS`, `WARNING`, `ERROR`).

### 3. Gestão de Risco Quantitativo & Exposição
- **Exposição Diária Total:** Capital alocado consolidado por classe de ativo (B3 Contratos Futuros, Criptoativos Binance e Forex).
- **Curva de Drawdown Intraday:** Gráfico de área responsivo comparando o recuo de capital ao teto diário de segurança.
- **Gráfico de Contribuição por Robô:** Barras comparativas de lucro líquido individual, taxa de acerto e número de trades executados.
- **Circuit Breaker:** Trava imediata de emergência para bloquear novas entradas em todos os robôs simultaneamente.

### 4. Webhooks de Saída (JSON POST Automático)
- Envio instantâneo de requisições HTTP POST para endpoints customizados:
  - 🎮 **Discord Embeds:** Mensagens ricas e coloridas com dados do trade (ativo, ação, preço, lotes, PnL e confiança da IA).
  - 📈 **TradingView / Ordem Externa:** Formato estruturado para automação de estratégias Pine Script.
  - 💬 **Slack & Teams:** Mensagens corporativas formatadas.
  - ⚡ **JSON Genérico:** Payload completo com metadados e telemetria.
- **Simulador de Webhook com 1 Clique:** Envie testes reais diretamente pela interface e receba o status HTTP, tempo de resposta em milissegundos e prévia do corpo de retorno.

### 5. Backtest Studio
- Motor de backtest estatístico local de alta fidelidade com parâmetros configuráveis:
  - Capital inicial, lotes operados, SL e TP em pontos, limiar de confiança, custos de corretagem/emolumentos e slippage.
- Métricas avançadas: *Sharpe Ratio*, *Profit Factor*, *Win Rate*, *Expectancy*, *Payoff Ratio*, Sequência de Vitórias/Derrotas e Drawdown Máximo.

### 6. Pipeline de Inteligência Artificial
- Suporte aos algoritmos:
  - **Random Forest Classifier** (Ensemble robusto contra overfitting)
  - **HistGradientBoosting** (Rápido, adaptativo e ideal para grandes séries temporais)
  - **Regressão Logística Regularizada (L2)**
- Engenharia de atributos técnicos com importância percentual de cada feature (RSI, Bollinger %B, Retorno Logarítmico, Spread de EMAs, ATR Normalizado, Z-Score de Volume, etc.).
- Re-treinamento e calibração de modelo sob demanda com até 5.000 barras M5.

---

## 🏗 Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    DASHBOARD WEB (React 19)                 │
│  - Menu Lateral / Multi-Robôs    - Monitor ao Vivo          │
│  - Gestão de Risco & Drawdown    - Webhooks HTTP Tab        │
│  - Backtest Studio               - Code Explorer            │
└──────────────┬──────────────────────────────┬───────────────┘
               │ (Proxy REST API / JSON)      │ (WebSockets)
┌──────────────▼──────────────────────────────▼───────────────┐
│               BACKEND NODE.JS + EXPRESS (server.ts)         │
│  - /api/chat: Google Gemini 3.5 Risk Copilot                │
│  - /api/webhook/test: Disparador de Testes (Sem CORS)       │
│  - Vite Middleware / Server Side Rendering                  │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
       (Exportação .ZIP)              (Gatilhos HTTP POST)
               │                              │
┌──────────────▼─────────────┐ ┌──────────────▼───────────────┐
│     PACOTE PYTHON MT5      │ │     SERVIÇOS EXTERNOS        │
│  - main.py (Loop Principal)│ │  - Discord (Webhooks)        │
│  - execution.py (MT5 IPC)  │ │  - TradingView Alerts        │
│  - api_binance.py (Crypto) │ │  - Telegram Bot API          │
│  - api_metaapi.py (Cloud)  │ │  - Slack / Webhook.site      │
│  - webhook_sender.py       │ └──────────────────────────────┘
└────────────────────────────┘
```

---

## 📋 Pré-requisitos

### Para a Plataforma Web & Servidor Local:
- **Node.js:** Versão 18.x ou 20.x+ recomendada
- **npm** ou **yarn** / **pnpm**
- Chave de API do **Google Gemini** (opcional, para o chat do Copilot de Risco)

### Para Executar os Robôs em Python:
- **Python:** Versão 3.10 ou superior
- **MetaTrader 5 Desktop:** Instalado com conta Demo ou Real ativa (XP, Genial, IC Markets, etc.) *(necessário apenas se for operar na B3 localmente)*
- **Ou Conta Binance:** Com chaves de API com permissão de futuros habilitadas *(se for operar criptomoedas)*

---

## 💻 Instalação e Uso da Plataforma Web

### 1. Clonar o repositório:
```bash
git clone https://github.com/seu-usuario/quantai-mt5-platform.git
cd quantai-mt5-platform
```

### 2. Instalar as dependências do projeto:
```bash
npm install
```

### 3. Configurar variáveis de ambiente:
Crie um arquivo `.env` na raiz do projeto (veja o modelo em `.env.example`):
```env
GEMINI_API_KEY=sua_chave_gemini_aqui
PORT=3000
```

### 4. Iniciar em modo de desenvolvimento:
```bash
npm run dev
```
Acesse a aplicação no seu navegador em: `http://localhost:3000`

### 5. Compilação para produção:
```bash
npm run build
npm start
```

---

## 🐍 Como Rodar o Robô em Python (MT5 & Binance)

Você pode exportar os scripts Python diretamente pela plataforma clicando em **"Baixar Scripts (.zip)"** no menu lateral ou acessando a aba **"Código Python & IDE"**.

### Passo a passo para execução local:

1. **Extraia o arquivo `.zip` baixado:**
   ```bash
   unzip quantai_win_bot.zip -d quantai_bot
   cd quantai_bot
   ```

2. **Crie e ative um ambiente virtual Python:**
   ```bash
   python -m venv venv
   # No Windows:
   venv\Scripts\activate
   # No Linux/Mac:
   source venv/bin/activate
   ```

3. **Instale os requisitos:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configuração de Parâmetros:**
   Abra o arquivo `config.py` e ajuste:
   - `SYMBOL`: Ativo a ser operado (ex: `'WIN$N'`, `'WDO$N'`, `'BTCUSDT'`).
   - `LOTS`: Quantidade de contratos ou lotes.
   - `STOP_LOSS_POINTS` e `TAKE_PROFIT_POINTS`: Alvos de risco e ganho.
   - `MAX_DAILY_LOSS`: Limite financeiro de perda diária.

5. **Operando no MetaTrader 5 (B3 / Forex):**
   - Abra o terminal do MetaTrader 5 e faça login na sua conta.
   - No MT5, vá em **Ferramentas > Opções > Expert Advisors** e marque:
     - ✅ **Permitir negociação automatizada**
     - ✅ **Permitir importação de DLLs**
   - Execute o robô:
     ```bash
     python main.py
     ```

6. **Operando na Binance Futures (Cripto 24/7):**
   - Configure suas chaves `BINANCE_API_KEY` e `BINANCE_SECRET_KEY` no arquivo `api_binance.py` ou via variáveis de ambiente.
   - Execute o bot de cripto:
     ```bash
     python api_binance.py
     ```

---

## 🔔 Configuração de Webhooks & Alertas

O robô pode notificar seus canais do **Discord**, acionar automações no **TradingView** ou alertar seu servidor via requisições HTTP POST em milissegundos.

### Como configurar:
1. No menu lateral, acesse **Configuração do Robô** > aba **Webhooks & Alertas HTTP**.
2. Ative a chave **Webhooks de Saída**.
3. No campo **URL de Destino**, cole o webhook gerado (ex: `https://discord.com/api/webhooks/...`).
4. Selecione o **Preset do Payload**:
   - `Discord Embed`: Cria cards visuais automáticos com cores para lucro e perda.
   - `TradingView`: Formato JSON padronizado com `passphrase` e detalhes de contrato.
   - `JSON Genérico`: Estrutura completa de telemetria.
5. Marque os gatilhos desejados:
   - ✅ Nova Ordem Executada
   - ✅ Encerramento de Posição
   - ✅ Take Profit Atingido
   - ✅ Stop Loss / Breakeven
   - ✅ Trava Diária / Circuit Breaker
6. Clique no botão **"Enviar Webhook de Teste"** para checar a conectividade instantaneamente!

---

## 📁 Estrutura do Projeto

```
quantai-mt5-platform/
├── server.ts                   # Servidor Express com rotas de API (Gemini e Webhooks)
├── vite.config.ts              # Configuração do Vite e Tailwind CSS v4
├── metadata.json               # Metadados e permissões da aplicação
├── package.json                # Dependências e scripts do projeto
├── src/
│   ├── App.tsx                 # Layout principal com Menu Lateral e roteamento
│   ├── types/
│   │   └── trading.ts          # Definições completas de tipos TypeScript (Bot, Trades, Webhooks)
│   ├── data/
│   │   ├── initialBots.ts      # Instâncias de robôs padrão (WIN, WDO, BTC, ETH)
│   │   ├── marketData.ts       # Especificações dos ativos (tick size, valor do ponto, alavancagem)
│   │   └── pythonFiles.ts      # Scripts Python modulares disponibilizados para download
│   ├── utils/
│   │   ├── quantEngine.ts      # Motor matemático de cálculo de features e backtesting
│   │   └── liveMarketApi.ts    # Conector de cotações em tempo real da Binance
│   └── components/
│       ├── Sidebar.tsx         # Menu Lateral com seletor de robôs e atalhos rápidos
│       ├── TopHeader.tsx       # Barra de status superior com pânico e breadcrumb
│       ├── LiveDashboard.tsx   # Painel operacional em tempo real e telemetria
│       ├── CandleChart.tsx     # Gráfico de velas com indicadores técnicos interativos
│       ├── RiskManagementSection.tsx # Painel de Drawdown, Exposição e Curvas de Risco
│       ├── GeminiRiskChatbot.tsx     # Copilot de Risco Quantitativo com IA Gemini
│       ├── BotConfigView.tsx         # Configurações do Robô em Abas
│       ├── WebhookConfigTab.tsx      # Aba especializada de configuração de Webhooks
│       ├── BacktestView.tsx          # Estúdio de simulação histórica e curvas de capital
│       ├── AIFeaturesView.tsx        # Pipeline de Machine Learning e importância de variáveis
│       ├── CodeExplorer.tsx          # IDE interna e exportador de pacotes .ZIP
│       └── MT5BridgeView.tsx         # Central de conexões (MetaApi, MT5 Local e Binance)
```

---

## 🔒 Configuração de Variáveis de Ambiente

Crie o arquivo `.env` na raiz do projeto com as chaves necessárias:

```env
# Chave da API do Google Gemini (para o Copilot de Risco QuantAI)
GEMINI_API_KEY="AIzaSy..."

# Porta de execução do servidor local
PORT=3000
```

---

## ⚠️ Aviso de Risco (Disclaimer)

> **Aviso Importante:** A negociação de ativos no mercado financeiro, incluindo contratos futuros na B3 (Mini Índice e Mini Dólar), pares de Criptomoedas na Binance e contratos de Forex, envolve risco substancial de perda de capital e pode não ser adequada a todos os investidores. 
> 
> O desempenho passado dos modelos de inteligência artificial ou resultados simulados em backtests não garantem lucros futuros. Certifique-se de testar exaustivamente seus robôs e estratégias em contas de simulação (**DEMO**) antes de alocar capital real. O desenvolvedor não se responsabiliza por quaisquer perdas financeiras decorrentes da utilização deste software.

---

## 📄 Licença

Distribuído sob a licença **MIT**. Consulte o arquivo `LICENSE` para mais informações.

Desenvolvido para traders quantitativos, engenheiros de dados e operadores de alta performance. 📈🚀
