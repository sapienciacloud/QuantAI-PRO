import { Candle } from '../types/trading';

export interface Binance24hTicker {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  bidPrice: string;
  askPrice: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
}

export interface LiveMarketSummary {
  source: 'BINANCE_REST' | 'MT5_BRIDGE' | 'SIMULATOR';
  symbol: string;
  lastPrice: number;
  high24h: number;
  low24h: number;
  change24hPct: number;
  volume24h: number;
  lastUpdate: string;
  spreadPoints?: number;
  isLive: boolean;
}

/**
 * Normalizes input symbol for Binance public API.
 * e.g.: 'BTCUSDT' -> 'BTCUSDT'
 *       'EURUSD'  -> 'EURUSDT' (Binance spot equivalent)
 */
export function normalizeBinanceSymbol(symbol: string): string | null {
  const upper = symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (upper === 'EURUSD') return 'EURUSDT';
  if (upper.endsWith('USDT') || upper.endsWith('BTC') || upper.endsWith('BUSD')) return upper;
  if (['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE'].includes(upper)) return `${upper}USDT`;
  return null;
}

/**
 * Fetches real, live candlestick data directly from Binance's public REST API.
 * No API key is required for public market data.
 */
export async function fetchBinanceLiveCandles(
  symbol: string = 'BTCUSDT',
  interval: string = '5m',
  limit: number = 85
): Promise<{ candles: Candle[]; error?: string; source: 'BINANCE_REST' | 'FALLBACK' }> {
  try {
    const binanceSymbol = normalizeBinanceSymbol(symbol);
    if (!binanceSymbol) {
      return {
        candles: [],
        error: `O ativo ${symbol} não é negociado diretamente na Binance Spot/Futuros. Para B3 (WIN/WDO), a conexão em tempo real é feita via terminal MetaTrader 5.`,
        source: 'FALLBACK',
      };
    }

    // Map timeframes to standard Binance intervals
    let binanceInterval = interval.toLowerCase();
    if (binanceInterval === 'm1') binanceInterval = '1m';
    else if (binanceInterval === 'm5') binanceInterval = '5m';
    else if (binanceInterval === 'm15') binanceInterval = '15m';
    else if (binanceInterval === 'm30') binanceInterval = '30m';
    else if (binanceInterval === 'h1') binanceInterval = '1h';
    else if (binanceInterval === 'h4') binanceInterval = '4h';
    else if (binanceInterval === 'd1') binanceInterval = '1d';

    // Use Binance public spot API with standard CORS support
    const url = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${binanceInterval}&limit=${limit}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} - Falha ao consultar Binance API (${response.statusText})`);
    }

    const rawData = await response.json();

    if (!Array.isArray(rawData) || rawData.length === 0) {
      throw new Error('Nenhum dado retornado pela API da Binance');
    }

    const candles: Candle[] = rawData.map((item: any) => {
      const openTime = Number(item[0]);
      const date = new Date(openTime);
      const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      return {
        time: timeStr,
        timestamp: openTime,
        open: parseFloat(item[1]),
        high: parseFloat(item[2]),
        low: parseFloat(item[3]),
        close: parseFloat(item[4]),
        volume: parseFloat(item[5]),
      };
    });

    return { candles, source: 'BINANCE_REST' };
  } catch (err: any) {
    console.warn(`[Binance API] Falha na busca ao vivo: ${err?.message || err}`);
    return { candles: [], error: err?.message || 'Erro de conexão com a API da Binance', source: 'FALLBACK' };
  }
}

/**
 * Fetches real 24h ticker summary (last price, high, low, volume, percent change).
 */
export async function fetchBinance24hTicker(symbol: string = 'BTCUSDT'): Promise<Binance24hTicker | null> {
  try {
    const binanceSymbol = normalizeBinanceSymbol(symbol);
    if (!binanceSymbol) return null;

    const url = `https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSymbol}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.json();
  } catch (e) {
    return null;
  }
}
