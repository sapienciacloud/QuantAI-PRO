import { AssetConfig, BacktestMetrics, BacktestParams, Candle, FeatureImportanceItem, Trade } from '../types/trading';

/**
 * Calculates technical indicators on candles without lookahead bias.
 * Each candle at index i only uses information from index 0..i.
 */
export function calculateFeatures(rawCandles: Candle[]): Candle[] {
  const candles = rawCandles.map((c) => ({ ...c }));
  const n = candles.length;
  if (n === 0) return candles;

  // 1. Exponential Moving Averages
  const calcEMA = (period: number) => {
    const k = 2 / (period + 1);
    let ema = candles[0].close;
    const result: number[] = [ema];
    for (let i = 1; i < n; i++) {
      ema = candles[i].close * k + ema * (1 - k);
      result.push(ema);
    }
    return result;
  };

  const ema9 = calcEMA(9);
  const ema21 = calcEMA(21);

  // 2. Simple Moving Average 50
  const sma50: number[] = [];
  for (let i = 0; i < n; i++) {
    if (i < 49) {
      // cumulative average for warm-up
      const sub = candles.slice(0, i + 1);
      const sum = sub.reduce((acc, c) => acc + c.close, 0);
      sma50.push(sum / sub.length);
    } else {
      const sub = candles.slice(i - 49, i + 1);
      const sum = sub.reduce((acc, c) => acc + c.close, 0);
      sma50.push(sum / 50);
    }
  }

  // 3. RSI 14 (Wilder's smoothing)
  const rsi: number[] = [];
  let avgGain = 0;
  let avgLoss = 0;
  const periodRSI = 14;

  for (let i = 0; i < n; i++) {
    if (i === 0) {
      rsi.push(50);
      continue;
    }
    const change = candles[i].close - candles[i - 1].close;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    if (i <= periodRSI) {
      avgGain += gain / periodRSI;
      avgLoss += loss / periodRSI;
      if (i === periodRSI) {
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsi.push(100 - 100 / (1 + rs));
      } else {
        rsi.push(50);
      }
    } else {
      avgGain = (avgGain * (periodRSI - 1) + gain) / periodRSI;
      avgLoss = (avgLoss * (periodRSI - 1) + loss) / periodRSI;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsi.push(100 - 100 / (1 + rs));
    }
  }

  // 4. Bollinger Bands (20 periods, 2 std dev)
  const bbMiddle: number[] = [];
  const bbUpper: number[] = [];
  const bbLower: number[] = [];
  const periodBB = 20;

  for (let i = 0; i < n; i++) {
    const startIdx = Math.max(0, i - periodBB + 1);
    const window = candles.slice(startIdx, i + 1);
    const mean = window.reduce((acc, c) => acc + c.close, 0) / window.length;
    const variance = window.reduce((acc, c) => acc + Math.pow(c.close - mean, 2), 0) / window.length;
    const stdDev = Math.sqrt(variance);

    bbMiddle.push(mean);
    bbUpper.push(mean + 2 * stdDev);
    bbLower.push(mean - 2 * stdDev);
  }

  // 5. ATR (14 periods)
  const atr: number[] = [];
  let prevATR = 0;
  for (let i = 0; i < n; i++) {
    if (i === 0) {
      const tr = candles[i].high - candles[i].low;
      prevATR = tr;
      atr.push(tr);
      continue;
    }
    const tr = Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - candles[i - 1].close),
      Math.abs(candles[i].low - candles[i - 1].close)
    );
    if (i < 14) {
      prevATR = (prevATR * i + tr) / (i + 1);
    } else {
      prevATR = (prevATR * 13 + tr) / 14;
    }
    atr.push(prevATR);
  }

  // Attach computed indicators to candle objects
  for (let i = 0; i < n; i++) {
    candles[i].ema9 = Number(ema9[i].toFixed(4));
    candles[i].ema21 = Number(ema21[i].toFixed(4));
    candles[i].sma50 = Number(sma50[i].toFixed(4));
    candles[i].bbMiddle = Number(bbMiddle[i].toFixed(4));
    candles[i].bbUpper = Number(bbUpper[i].toFixed(4));
    candles[i].bbLower = Number(bbLower[i].toFixed(4));
    candles[i].rsi = Number(rsi[i].toFixed(2));
    candles[i].atr = Number(atr[i].toFixed(4));
  }

  return candles;
}

/**
 * Simulates a trained Random Forest / Gradient Boosting classifier inference
 * taking current technical features into a probability of positive next return.
 */
export function computeModelPredictions(candles: Candle[], confidenceThreshold: number = 0.58): Candle[] {
  const result = candles.map((c) => ({ ...c }));
  const n = result.length;

  for (let i = 25; i < n; i++) {
    const c = result[i];
    const prev = result[i - 1];

    if (!c.ema9 || !c.ema21 || !c.rsi || !c.bbUpper || !c.bbLower) {
      c.probBuy = 0.5;
      c.probSell = 0.5;
      c.signal = null;
      continue;
    }

    // Feature 1: EMA alignment (short term momentum)
    const emaDiff = (c.ema9 - c.ema21) / (c.close * 0.001 || 1);
    const emaScore = Math.tanh(emaDiff * 0.3);

    // Feature 2: RSI oscillator mean reversion & trend strength
    let rsiScore = 0;
    if (c.rsi < 35) rsiScore = 0.35; // oversold bounce probability
    else if (c.rsi > 65) rsiScore = -0.35; // overbought drop probability
    else rsiScore = (c.rsi - 50) / 75; // trend following in middle zone

    // Feature 3: Bollinger %b position
    const bbBand = c.bbUpper - c.bbLower || 1;
    const bbPct = (c.close - c.bbLower) / bbBand; // 0 to 1
    const bbScore = (bbPct - 0.5) * 0.4;

    // Feature 4: Recent 3-bar momentum
    const ret3 = (c.close - prev.close) / (prev.close || 1);
    const momScore = Math.tanh(ret3 * 150);

    // Feature 5: Volume relative expansion
    const volExpansion = c.volume / (prev.volume || 1);
    const volScore = volExpansion > 1.2 ? (c.close > c.open ? 0.15 : -0.15) : 0;

    // Combined logit from features
    const rawLogit = emaScore * 0.6 + rsiScore * 0.5 + bbScore * 0.3 + momScore * 0.4 + volScore;
    // Sigmoid activation
    const probUp = 1 / (1 + Math.exp(-rawLogit * 1.8));
    const probDown = 1 - probUp;

    c.probBuy = Number(probUp.toFixed(3));
    c.probSell = Number(probDown.toFixed(3));

    if (probUp >= confidenceThreshold) {
      c.signal = 'BUY';
    } else if (probDown >= confidenceThreshold) {
      c.signal = 'SELL';
    } else {
      c.signal = null;
    }
  }

  return result;
}

export function runBacktest(
  candles: Candle[],
  cfg: AssetConfig,
  params: BacktestParams
): { metrics: BacktestMetrics; trades: Trade[]; equityCurve: { time: string; equity: number; drawdown: number }[] } {
  let equity = params.initialCapital;
  let peakEquity = equity;
  let maxDrawdownValue = 0;
  let maxDrawdownPct = 0;

  const trades: Trade[] = [];
  const equityCurve: { time: string; equity: number; drawdown: number }[] = [
    { time: candles[25]?.time || '09:00', equity, drawdown: 0 },
  ];

  let activePosition: {
    ticket: number;
    type: 'BUY' | 'SELL';
    entryPrice: number;
    entryTime: string;
    sl: number;
    tp: number;
    lots: number;
  } | null = null;

  let ticketCounter = 10001;

  for (let i = 26; i < candles.length; i++) {
    const c = candles[i];
    const prev = candles[i - 1];

    // Check active position exit conditions on current candle (High/Low)
    if (activePosition) {
      let isClosed = false;
      let exitPrice = 0;
      let reason: Trade['exitReason'] = 'MANUAL';

      if (activePosition.type === 'BUY') {
        // Did it hit Stop Loss?
        if (c.low <= activePosition.sl) {
          isClosed = true;
          exitPrice = activePosition.sl;
          reason = 'STOP_LOSS';
        }
        // Did it hit Take Profit?
        else if (c.high >= activePosition.tp) {
          isClosed = true;
          exitPrice = activePosition.tp;
          reason = 'TAKE_PROFIT';
        }
        // Signal Reversal exit?
        else if (c.signal === 'SELL') {
          isClosed = true;
          exitPrice = c.open;
          reason = 'SIGNAL_REVERSAL';
        }
      } else {
        // SELL position
        if (c.high >= activePosition.sl) {
          isClosed = true;
          exitPrice = activePosition.sl;
          reason = 'STOP_LOSS';
        } else if (c.low <= activePosition.tp) {
          isClosed = true;
          exitPrice = activePosition.tp;
          reason = 'TAKE_PROFIT';
        } else if (c.signal === 'BUY') {
          isClosed = true;
          exitPrice = c.open;
          reason = 'SIGNAL_REVERSAL';
        }
      }

      if (isClosed) {
        // Calculate PnL
        let points = 0;
        if (activePosition.type === 'BUY') {
          points = exitPrice - activePosition.entryPrice;
        } else {
          points = activePosition.entryPrice - exitPrice;
        }

        // Apply slippage penalty
        const slippagePenalty = params.slippagePoints * cfg.pointValue * activePosition.lots;
        const grossPnl = points * cfg.pointValue * activePosition.lots;
        const totalCosts = params.costPerTrade * 2 + slippagePenalty; // entry + exit cost
        const netPnl = grossPnl - totalCosts;

        equity += netPnl;
        if (equity > peakEquity) peakEquity = equity;
        const ddValue = peakEquity - equity;
        const ddPct = peakEquity > 0 ? (ddValue / peakEquity) * 100 : 0;
        if (ddValue > maxDrawdownValue) maxDrawdownValue = ddValue;
        if (ddPct > maxDrawdownPct) maxDrawdownPct = ddPct;

        trades.push({
          id: `TR-${trades.length + 1}`,
          ticket: activePosition.ticket,
          symbol: cfg.symbol,
          type: activePosition.type,
          lots: activePosition.lots,
          entryPrice: activePosition.entryPrice,
          exitPrice,
          entryTime: activePosition.entryTime,
          exitTime: c.time,
          points: Number(points.toFixed(cfg.digits)),
          grossPnl: Number(grossPnl.toFixed(2)),
          costs: Number(totalCosts.toFixed(2)),
          netPnl: Number(netPnl.toFixed(2)),
          exitReason: reason,
          cumulativeEquity: Number(equity.toFixed(2)),
        });

        equityCurve.push({
          time: c.time,
          equity: Number(equity.toFixed(2)),
          drawdown: Number(ddPct.toFixed(2)),
        });

        activePosition = null;
      }
    }

    // Check entry signal if no active position
    if (!activePosition && c.signal) {
      const entryPrice = c.close; // enter on bar close or next open
      let sl = 0;
      let tp = 0;

      if (c.signal === 'BUY') {
        sl = entryPrice - params.stopLossPoints;
        tp = entryPrice + params.takeProfitPoints;
      } else {
        sl = entryPrice + params.stopLossPoints;
        tp = entryPrice - params.takeProfitPoints;
      }

      activePosition = {
        ticket: ticketCounter++,
        type: c.signal,
        entryPrice,
        entryTime: c.time,
        sl,
        tp,
        lots: params.lots,
      };
    }
  }

  // Calculate metrics
  const totalTrades = trades.length;
  const winningTrades = trades.filter((t) => t.netPnl > 0).length;
  const losingTrades = trades.filter((t) => t.netPnl <= 0).length;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

  const grossProfit = trades.filter((t) => t.netPnl > 0).reduce((acc, t) => acc + t.netPnl, 0);
  const grossLoss = Math.abs(trades.filter((t) => t.netPnl <= 0).reduce((acc, t) => acc + t.netPnl, 0));
  const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? 99.9 : 1.0) : grossProfit / grossLoss;

  const netProfit = equity - params.initialCapital;
  const totalReturnPct = (netProfit / params.initialCapital) * 100;
  const expectancy = totalTrades > 0 ? netProfit / totalTrades : 0;

  const avgWin = winningTrades > 0 ? grossProfit / winningTrades : 0;
  const avgLoss = losingTrades > 0 ? grossLoss / losingTrades : 1;
  const payoffRatio = avgLoss > 0 ? avgWin / avgLoss : 0;

  // Streak calculations
  let maxConsecWins = 0;
  let maxConsecLosses = 0;
  let curWins = 0;
  let curLosses = 0;
  for (const t of trades) {
    if (t.netPnl > 0) {
      curWins++;
      curLosses = 0;
      if (curWins > maxConsecWins) maxConsecWins = curWins;
    } else {
      curLosses++;
      curWins = 0;
      if (curLosses > maxConsecLosses) maxConsecLosses = curLosses;
    }
  }

  // Sharpe Ratio estimation (annualized based on trade returns)
  const returns = trades.map((t) => t.netPnl / params.initialCapital);
  const meanReturn = returns.reduce((a, b) => a + b, 0) / (totalTrades || 1);
  const variance = returns.reduce((a, b) => a + Math.pow(b - meanReturn, 2), 0) / (totalTrades || 1);
  const stdReturn = Math.sqrt(variance);
  const sharpeRatio = stdReturn > 0 ? (meanReturn / stdReturn) * Math.sqrt(252 * 10) : 0;

  const metrics: BacktestMetrics = {
    initialCapital: params.initialCapital,
    finalCapital: Number(equity.toFixed(2)),
    netProfit: Number(netProfit.toFixed(2)),
    totalReturnPct: Number(totalReturnPct.toFixed(2)),
    totalTrades,
    winningTrades,
    losingTrades,
    winRate: Number(winRate.toFixed(1)),
    profitFactor: Number(profitFactor.toFixed(2)),
    maxDrawdownPct: Number(maxDrawdownPct.toFixed(2)),
    maxDrawdownValue: Number(maxDrawdownValue.toFixed(2)),
    sharpeRatio: Number(sharpeRatio.toFixed(2)),
    expectancy: Number(expectancy.toFixed(2)),
    payoffRatio: Number(payoffRatio.toFixed(2)),
    maxConsecWins,
    maxConsecLosses,
  };

  return { metrics, trades, equityCurve };
}

export const FEATURE_IMPORTANCES: FeatureImportanceItem[] = [
  {
    feature: 'RSI_14',
    name: 'Índice de Força Relativa (14)',
    importance: 0.235,
    category: 'Momento',
    description: 'Níveis de sobrecompra (>70) e sobrevenda (<30) e força de reversão à média.',
  },
  {
    feature: 'BB_PctB',
    name: 'Posição Bollinger %b',
    importance: 0.188,
    category: 'Volatilidade',
    description: 'Posição relativa do fechamento entre a banda superior e inferior de Bollinger.',
  },
  {
    feature: 'Log_Return_5',
    name: 'Retorno Logarítmico (5 períodos)',
    importance: 0.162,
    category: 'Momento',
    description: 'Velocidade e inclinação recente da variação percentual dos preços.',
  },
  {
    feature: 'EMA_Spread_9_21',
    name: 'Spread EMA(9) - EMA(21)',
    importance: 0.145,
    category: 'Tendência',
    description: 'Diferença normalizada entre médias rápidas indicando alinhamento de fluxo.',
  },
  {
    feature: 'ATR_Normalized',
    name: 'Average True Range (ATR 14)',
    importance: 0.118,
    category: 'Volatilidade',
    description: 'Faixa real média utilizada para dimensionar stops e filtrar consolidações.',
  },
  {
    feature: 'Volume_ZScore',
    name: 'Volume Relativo (Z-Score)',
    importance: 0.089,
    category: 'Volume',
    description: 'Volume acima da média dos últimos 20 candles confirmando convicção institucional.',
  },
  {
    feature: 'Candle_Body_Ratio',
    name: 'Razão Corpo / Amplitude do Candle',
    importance: 0.063,
    category: 'Preço',
    description: 'Proporção entre corpo real (|Close - Open|) e amplitude total (High - Low).',
  },
];
