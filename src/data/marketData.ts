import { AssetConfig, AssetKey, Candle } from '../types/trading';

export const ASSETS_CONFIG: Record<AssetKey, AssetConfig> = {
  WIN: {
    key: 'WIN',
    name: 'Mini Índice B3',
    symbol: 'WIN$N',
    description: 'Contrato Futuro de Mini Ibovespa',
    market: 'B3 Futuros',
    currency: 'BRL',
    tickSize: 5,
    pointValue: 0.20, // R$ 0,20 por ponto
    defaultSLPoints: 150,
    defaultTPPoints: 300,
    defaultLots: 1,
    digits: 0,
  },
  WDO: {
    key: 'WDO',
    name: 'Mini Dólar B3',
    symbol: 'WDO$N',
    description: 'Contrato Futuro de Mini Dólar Comercial',
    market: 'B3 Futuros',
    currency: 'BRL',
    tickSize: 0.5,
    pointValue: 10.00, // R$ 10,00 por ponto (R$ 5,00 por meio ponto)
    defaultSLPoints: 4.5,
    defaultTPPoints: 9.0,
    defaultLots: 1,
    digits: 1,
  },
  EURUSD: {
    key: 'EURUSD',
    name: 'EUR / USD',
    symbol: 'EURUSD',
    description: 'Euro vs Dólar Americano (Forex Spot)',
    market: 'Forex',
    currency: 'USD',
    tickSize: 0.00001,
    pointValue: 100000, // $10 por pip (0.0001) para 1 lote padrão
    defaultSLPoints: 0.0020, // 20 pips
    defaultTPPoints: 0.0040, // 40 pips
    defaultLots: 0.1, // 0.10 lote
    digits: 5,
  },
  PETR4: {
    key: 'PETR4',
    name: 'Petrobras PN',
    symbol: 'PETR4',
    description: 'Ações Preferenciais Petrobras B3',
    market: 'B3 Ações',
    currency: 'BRL',
    tickSize: 0.01,
    pointValue: 100, // 100 ações por lote
    defaultSLPoints: 0.40,
    defaultTPPoints: 0.85,
    defaultLots: 100,
    digits: 2,
  },
  BTCUSDT: {
    key: 'BTCUSDT',
    name: 'Bitcoin / USDT',
    symbol: 'BTCUSDT',
    description: 'Bitcoin vs Tether USD (Binance USD-M Futures)',
    market: 'Binance Futuros',
    currency: 'USDT',
    tickSize: 0.1,
    pointValue: 1.0, // $1 por ponto por contrato cheio
    defaultSLPoints: 450.0, // $450 de stop
    defaultTPPoints: 900.0, // $900 de take profit
    defaultLots: 0.05, // 0.05 BTC
    digits: 1,
  },
  ETHUSDT: {
    key: 'ETHUSDT',
    name: 'Ethereum / USDT',
    symbol: 'ETHUSDT',
    description: 'Ethereum vs Tether USD (Binance USD-M Futures)',
    market: 'Binance Futuros',
    currency: 'USDT',
    tickSize: 0.01,
    pointValue: 1.0,
    defaultSLPoints: 30.0, // $30 de stop
    defaultTPPoints: 60.0, // $60 de take profit
    defaultLots: 0.5, // 0.5 ETH
    digits: 2,
  },
  SOLUSDT: {
    key: 'SOLUSDT',
    name: 'Solana / USDT',
    symbol: 'SOLUSDT',
    description: 'Solana vs Tether USD (Binance USD-M Futures)',
    market: 'Binance Futuros',
    currency: 'USDT',
    tickSize: 0.01,
    pointValue: 1.0,
    defaultSLPoints: 3.5, // $3.50 de stop
    defaultTPPoints: 7.0, // $7.00 de take profit
    defaultLots: 5.0, // 5 SOL
    digits: 2,
  },
  BNBUSDT: {
    key: 'BNBUSDT',
    name: 'BNB / USDT',
    symbol: 'BNBUSDT',
    description: 'Binance Coin vs Tether USD (Binance USD-M Futures)',
    market: 'Binance Futuros',
    currency: 'USDT',
    tickSize: 0.01,
    pointValue: 1.0,
    defaultSLPoints: 8.0,
    defaultTPPoints: 16.0,
    defaultLots: 1.0,
    digits: 2,
  },
  XRPUSDT: {
    key: 'XRPUSDT',
    name: 'Ripple / USDT',
    symbol: 'XRPUSDT',
    description: 'XRP vs Tether USD (Binance USD-M Futures)',
    market: 'Binance Futuros',
    currency: 'USDT',
    tickSize: 0.0001,
    pointValue: 1.0,
    defaultSLPoints: 0.0150,
    defaultTPPoints: 0.0300,
    defaultLots: 500, // 500 XRP
    digits: 4,
  },
};

// Deterministic Pseudo-random number generator for reproducible realistic price series
class PRNG {
  private seed: number;
  constructor(seed: number = 42) {
    this.seed = seed;
  }
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
  normal(): number {
    // Box-Muller transform
    const u1 = Math.max(1e-6, this.next());
    const u2 = this.next();
    return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  }
}

export function generateHistoricalCandles(assetKey: AssetKey, count: number = 320): Candle[] {
  const cfg = ASSETS_CONFIG[assetKey] || ASSETS_CONFIG.WIN;
  const seedMap: Record<string, number> = {
    WIN: 101,
    WDO: 202,
    EURUSD: 303,
    PETR4: 404,
    BTCUSDT: 505,
    ETHUSDT: 606,
    SOLUSDT: 707,
    BNBUSDT: 808,
    XRPUSDT: 909,
  };
  const prng = new PRNG(seedMap[assetKey] || 42);

  let basePrice = 128200;
  let volatility = 95;

  if (assetKey === 'WIN') {
    basePrice = 128200;
    volatility = 95;
  } else if (assetKey === 'WDO') {
    basePrice = 5410.0;
    volatility = 3.8;
  } else if (assetKey === 'EURUSD') {
    basePrice = 1.08450;
    volatility = 0.00065;
  } else if (assetKey === 'PETR4') {
    basePrice = 38.20;
    volatility = 0.22;
  } else if (assetKey === 'BTCUSDT') {
    basePrice = 64850.0;
    volatility = 380.0;
  } else if (assetKey === 'ETHUSDT') {
    basePrice = 2640.0;
    volatility = 18.5;
  } else if (assetKey === 'SOLUSDT') {
    basePrice = 154.20;
    volatility = 2.4;
  } else if (assetKey === 'BNBUSDT') {
    basePrice = 588.50;
    volatility = 5.8;
  } else if (assetKey === 'XRPUSDT') {
    basePrice = 0.5840;
    volatility = 0.0085;
  }

  const candles: Candle[] = [];
  const startTime = new Date(2026, 8, 20, 9, 0, 0); // Recent date

  let currentPrice = basePrice;
  let trend = 0.15; // slight initial upward drift

  for (let i = 0; i < count; i++) {
    // Regime shifts every 30-50 candles
    if (i % 35 === 0) {
      trend = (prng.next() - 0.48) * 0.4;
    }

    const candleTime = new Date(startTime.getTime() + i * 5 * 60 * 1000);
    // skip night hours simulation (format as HH:mm)
    const timeStr = candleTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const open = currentPrice;
    const shock = prng.normal() * volatility + trend * volatility;
    let close = open + shock;

    // Bounds on high and low
    const wick1 = Math.abs(prng.normal() * volatility * 0.6);
    const wick2 = Math.abs(prng.normal() * volatility * 0.6);
    const high = Math.max(open, close) + wick1;
    const low = Math.min(open, close) - wick2;

    // Volume calculation
    let baseVol = 4500;
    if (assetKey === 'BTCUSDT') baseVol = 850;
    else if (assetKey === 'ETHUSDT') baseVol = 3400;
    else if (assetKey === 'SOLUSDT') baseVol = 18000;
    else if (assetKey === 'XRPUSDT') baseVol = 120000;
    else if (assetKey === 'WIN') baseVol = 4500;
    else if (assetKey === 'WDO') baseVol = 3200;
    else if (assetKey === 'EURUSD') baseVol = 12000;

    const volMultiplier = 0.5 + Math.abs(shock / volatility) * 1.5 + prng.next() * 0.6;
    const volume = Math.round(baseVol * volMultiplier);

    // Format numbers according to tick size
    const roundToTick = (val: number) => {
      const mult = 1 / cfg.tickSize;
      return Math.round(val * mult) / mult;
    };

    const roundedOpen = Number(roundToTick(open).toFixed(cfg.digits));
    const roundedHigh = Number(roundToTick(high).toFixed(cfg.digits));
    const roundedLow = Number(roundToTick(low).toFixed(cfg.digits));
    const roundedClose = Number(roundToTick(close).toFixed(cfg.digits));

    candles.push({
      time: timeStr,
      timestamp: candleTime.getTime(),
      open: roundedOpen,
      high: Math.max(roundedHigh, roundedOpen, roundedClose),
      low: Math.min(roundedLow, roundedOpen, roundedClose),
      close: roundedClose,
      volume,
    });

    currentPrice = roundedClose;
  }

  return candles;
}
