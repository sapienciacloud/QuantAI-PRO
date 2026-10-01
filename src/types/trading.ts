export interface Candle {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema9?: number;
  ema21?: number;
  sma50?: number;
  bbUpper?: number;
  bbLower?: number;
  bbMiddle?: number;
  rsi?: number;
  atr?: number;
  signal?: 'BUY' | 'SELL' | null;
  probBuy?: number;
  probSell?: number;
}

export type AssetKey = 'WIN' | 'WDO' | 'EURUSD' | 'PETR4' | 'BTCUSDT' | 'ETHUSDT' | 'SOLUSDT' | 'BNBUSDT' | 'XRPUSDT';

export interface AssetConfig {
  key: AssetKey;
  name: string;
  symbol: string;
  description: string;
  market: 'B3 Futuros' | 'Forex' | 'B3 Ações' | 'Binance Futuros' | 'Binance Spot';
  currency: 'BRL' | 'USD' | 'USDT';
  tickSize: number;
  pointValue: number; // Value in currency per 1 point or tick
  defaultSLPoints: number;
  defaultTPPoints: number;
  defaultLots: number;
  digits: number;
}

export interface Position {
  ticket: number;
  symbol: string;
  type: 'BUY' | 'SELL';
  lots: number;
  entryPrice: number;
  currentPrice: number;
  sl: number;
  tp: number;
  points: number;
  pnl: number;
  entryTime: string;
}

export interface Trade {
  id: string;
  ticket: number;
  symbol: string;
  type: 'BUY' | 'SELL';
  lots: number;
  entryPrice: number;
  exitPrice: number;
  entryTime: string;
  exitTime: string;
  points: number;
  grossPnl: number;
  costs: number;
  netPnl: number;
  exitReason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'SIGNAL_REVERSAL' | 'MANUAL';
  cumulativeEquity: number;
}

export interface BacktestParams {
  assetKey: AssetKey;
  initialCapital: number;
  lots: number;
  stopLossPoints: number;
  takeProfitPoints: number;
  confidenceThreshold: number; // e.g. 0.58 (58%)
  slippagePoints: number;
  costPerTrade: number; // broker + exchange fees
}

export interface BacktestMetrics {
  initialCapital: number;
  finalCapital: number;
  netProfit: number;
  totalReturnPct: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  profitFactor: number;
  maxDrawdownPct: number;
  maxDrawdownValue: number;
  sharpeRatio: number;
  expectancy: number; // average PnL per trade
  payoffRatio: number; // average win / average loss
  maxConsecWins: number;
  maxConsecLosses: number;
}

export interface FeatureImportanceItem {
  feature: string;
  name: string;
  importance: number;
  category: 'Tendência' | 'Momento' | 'Volatilidade' | 'Volume' | 'Preço';
  description: string;
}

export interface LogMessage {
  id: string;
  timestamp: string;
  level: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  category: 'MT5' | 'AI' | 'ORDER' | 'SYSTEM';
  message: string;
}

export type BotStatus = 'RUNNING' | 'PAUSED' | 'STOPPED';

export interface BotInstance {
  id: string;
  name: string;
  description: string;
  assetKey: AssetKey;
  symbol: string;
  timeframe: string;
  status: BotStatus;
  lots: number;
  stopLossPoints: number;
  takeProfitPoints: number;
  trailingStopPoints: number;
  confidenceThreshold: number;
  maxDailyLoss: number;
  dailyProfitGoal: number;
  startHour: string;
  endHour: string;
  closeAllHour: string;
  magicNumber: number;
  aiAlgorithm: 'RandomForest' | 'HistGradientBoosting' | 'LogisticRegression';
  estimators: number;
  maxDepth: number;
  activeFeatures: string[];
  lastTrained: string;
  account: {
    login: string;
    server: string;
    broker: string;
    type: 'DEMO' | 'REAL';
    connected: boolean;
    pingMs: number;
    balance: number;
    equity: number;
  };
  telegram: {
    enabled: boolean;
    botToken: string;
    chatId: string;
    notifyOnEntry: boolean;
    notifyOnExit: boolean;
    notifyOnDailyLimit: boolean;
  };
  webhooks?: {
    enabled: boolean;
    url: string;
    preset: 'generic' | 'discord' | 'tradingview' | 'slack';
    secretToken?: string;
    events: {
      onOrderOpen: boolean;
      onOrderClose: boolean;
      onTakeProfit: boolean;
      onStopLoss: boolean;
      onDailyLimit: boolean;
      onAISignal: boolean;
    };
    customPayloadTemplate?: string;
    history?: WebhookLogEntry[];
  };
  stats: {
    todayPnl: number;
    totalTradesToday: number;
    winRate: number;
    profitFactor: number;
    openPositionsCount: number;
  };
  customPythonFiles?: Record<string, string>;
}

export interface WebhookLogEntry {
  id: string;
  timestamp: string;
  event: string;
  url: string;
  status: 'SUCCESS' | 'ERROR';
  statusCode?: number;
  elapsedMs?: number;
  responsePreview?: string;
  payloadSummary?: string;
}


