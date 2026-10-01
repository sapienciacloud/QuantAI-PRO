import React, { useState, useMemo } from 'react';
import { Candle, AssetConfig } from '../types/trading';

interface CandleChartProps {
  candles: Candle[];
  config: AssetConfig;
  height?: number;
  isLiveFeed?: boolean;
  lastSyncTime?: string;
  onRefreshLive?: () => void;
  isLoadingLive?: boolean;
  ticker24h?: {
    priceChangePercent?: string;
    highPrice?: string;
    lowPrice?: string;
    volume?: string;
  } | null;
}

export const CandleChart: React.FC<CandleChartProps> = ({
  candles,
  config,
  height = 480,
  isLiveFeed = false,
  lastSyncTime,
  onRefreshLive,
  isLoadingLive = false,
  ticker24h,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [showEMA9, setShowEMA9] = useState(true);
  const [showEMA21, setShowEMA21] = useState(true);
  const [showSMA50, setShowSMA50] = useState(true);
  const [showBB, setShowBB] = useState(true);
  const [showRSI, setShowRSI] = useState(true);

  // We display the last 60-80 candles for crisp readability
  const visibleCandles = useMemo(() => {
    return candles.slice(-70);
  }, [candles]);

  const n = visibleCandles.length;

  // Chart dimensions & layout
  const chartWidth = 900;
  const paddingRight = 65;
  const paddingLeft = 10;
  const paddingTop = 20;
  
  const rsiHeight = showRSI ? 85 : 0;
  const volumeHeight = 55;
  const priceHeight = height - paddingTop - rsiHeight - volumeHeight - 40;

  // Price range calculation
  const { minPrice, maxPrice, maxVolume } = useMemo(() => {
    if (n === 0) return { minPrice: 0, maxPrice: 1, maxVolume: 1 };
    let min = Infinity;
    let max = -Infinity;
    let maxVol = 0;

    for (const c of visibleCandles) {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
      if (showBB && c.bbLower && c.bbLower < min) min = c.bbLower;
      if (showBB && c.bbUpper && c.bbUpper > max) max = c.bbUpper;
      if (c.volume > maxVol) maxVol = c.volume;
    }

    const margin = (max - min) * 0.05 || 1;
    return {
      minPrice: min - margin,
      maxPrice: max + margin,
      maxVolume: maxVol || 1,
    };
  }, [visibleCandles, n, showBB]);

  // Scaling helpers
  const priceToY = (price: number) => {
    return paddingTop + priceHeight - ((price - minPrice) / (maxPrice - minPrice)) * priceHeight;
  };

  const volumeToY = (vol: number) => {
    const volBase = paddingTop + priceHeight + 15;
    return volBase + volumeHeight - (vol / maxVolume) * volumeHeight;
  };

  const rsiToY = (val: number) => {
    const rsiBase = paddingTop + priceHeight + volumeHeight + 25;
    return rsiBase + rsiHeight - (val / 100) * rsiHeight;
  };

  const candleSpacing = (chartWidth - paddingLeft - paddingRight) / Math.max(n, 1);
  const candleBodyWidth = Math.max(candleSpacing * 0.65, 3);

  const getX = (idx: number) => {
    return paddingLeft + idx * candleSpacing + candleSpacing / 2;
  };

  // Generate grid price levels
  const priceGridLevels = useMemo(() => {
    const count = 5;
    const step = (maxPrice - minPrice) / count;
    return Array.from({ length: count + 1 }, (_, i) => minPrice + i * step);
  }, [minPrice, maxPrice]);

  // Path generators for indicators
  const ema9Path = useMemo(() => {
    if (!showEMA9) return '';
    return visibleCandles
      .map((c, i) => (c.ema9 ? `${i === 0 ? 'M' : 'L'} ${getX(i)} ${priceToY(c.ema9)}` : ''))
      .filter(Boolean)
      .join(' ');
  }, [visibleCandles, showEMA9, minPrice, maxPrice]);

  const ema21Path = useMemo(() => {
    if (!showEMA21) return '';
    return visibleCandles
      .map((c, i) => (c.ema21 ? `${i === 0 ? 'M' : 'L'} ${getX(i)} ${priceToY(c.ema21)}` : ''))
      .filter(Boolean)
      .join(' ');
  }, [visibleCandles, showEMA21, minPrice, maxPrice]);

  const sma50Path = useMemo(() => {
    if (!showSMA50) return '';
    return visibleCandles
      .map((c, i) => (c.sma50 ? `${i === 0 ? 'M' : 'L'} ${getX(i)} ${priceToY(c.sma50)}` : ''))
      .filter(Boolean)
      .join(' ');
  }, [visibleCandles, showSMA50, minPrice, maxPrice]);

  const bbAreaPath = useMemo(() => {
    if (!showBB) return '';
    const upperPoints: string[] = [];
    const lowerPoints: string[] = [];

    visibleCandles.forEach((c, i) => {
      if (c.bbUpper && c.bbLower) {
        upperPoints.push(`${i === 0 ? 'M' : 'L'} ${getX(i)} ${priceToY(c.bbUpper)}`);
        lowerPoints.unshift(`L ${getX(i)} ${priceToY(c.bbLower)}`);
      }
    });

    if (upperPoints.length === 0) return '';
    return `${upperPoints.join(' ')} ${lowerPoints.join(' ')} Z`;
  }, [visibleCandles, showBB, minPrice, maxPrice]);

  const rsiPath = useMemo(() => {
    if (!showRSI) return '';
    return visibleCandles
      .map((c, i) => (c.rsi !== undefined ? `${i === 0 ? 'M' : 'L'} ${getX(i)} ${rsiToY(c.rsi)}` : ''))
      .filter(Boolean)
      .join(' ');
  }, [visibleCandles, showRSI]);

  const activeCandle = hoverIndex !== null && visibleCandles[hoverIndex]
    ? visibleCandles[hoverIndex]
    : visibleCandles[visibleCandles.length - 1];

  return (
    <div className="w-full bg-[#0d131f] border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      {/* Chart Top Header & Indicator Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#0a0e17] border-b border-slate-800 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white tracking-wide">{config.symbol}</span>
            <span className="text-slate-500 font-mono">M5</span>

            {/* Live Feed Status Tag */}
            {isLiveFeed ? (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                AO VIVO (Binance API)
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700">
                Histórico Simulado
              </span>
            )}

            {lastSyncTime && (
              <span className="text-[11px] text-slate-500 hidden xl:inline">
                Sincronizado: {lastSyncTime}
              </span>
            )}
          </div>

          {activeCandle && (
            <div className="hidden sm:flex items-center gap-3 font-mono text-slate-300">
              <span>O: <span className="text-slate-100">{activeCandle.open.toFixed(config.digits)}</span></span>
              <span>H: <span className="text-emerald-400">{activeCandle.high.toFixed(config.digits)}</span></span>
              <span>L: <span className="text-rose-400">{activeCandle.low.toFixed(config.digits)}</span></span>
              <span>C: <span className={activeCandle.close >= activeCandle.open ? 'text-emerald-400' : 'text-rose-400'}>
                {activeCandle.close.toFixed(config.digits)}
              </span></span>
              <span>Vol: <span className="text-slate-400">{activeCandle.volume.toLocaleString()}</span></span>
            </div>
          )}
        </div>

        {/* Indicator Toggles & Manual Refresh */}
        <div className="flex items-center gap-2">
          {onRefreshLive && (
            <button
              onClick={onRefreshLive}
              disabled={isLoadingLive}
              title="Buscar cotações e candles atuais em tempo real"
              className="px-2.5 py-1 rounded text-[11px] font-medium transition-colors bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 disabled:opacity-50"
            >
              <span className={isLoadingLive ? 'animate-spin inline-block' : ''}>🔄</span>
              <span className="hidden sm:inline">{isLoadingLive ? 'Buscando...' : 'Atualizar'}</span>
            </button>
          )}

          <button
            onClick={() => setShowEMA9(!showEMA9)}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
              showEMA9 ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            EMA 9
          </button>
          <button
            onClick={() => setShowEMA21(!showEMA21)}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
              showEMA21 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            EMA 21
          </button>
          <button
            onClick={() => setShowSMA50(!showSMA50)}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
              showSMA50 ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40' : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            SMA 50
          </button>
          <button
            onClick={() => setShowBB(!showBB)}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
              showBB ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            BB (20,2)
          </button>
          <button
            onClick={() => setShowRSI(!showRSI)}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
              showRSI ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            RSI (14)
          </button>
        </div>
      </div>

      {/* 24h Ticker Strip for live data */}
      {ticker24h && (
        <div className="px-4 py-1.5 bg-[#090d14] border-b border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-4">
            <span>
              Var 24h:{' '}
              <strong className={Number(ticker24h.priceChangePercent) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {Number(ticker24h.priceChangePercent) >= 0 ? '+' : ''}{Number(ticker24h.priceChangePercent).toFixed(2)}%
              </strong>
            </span>
            {ticker24h.highPrice && (
              <span>Máx 24h: <strong className="text-slate-200">${Number(ticker24h.highPrice).toLocaleString()}</strong></span>
            )}
            {ticker24h.lowPrice && (
              <span>Mín 24h: <strong className="text-slate-200">${Number(ticker24h.lowPrice).toLocaleString()}</strong></span>
            )}
          </div>
          {ticker24h.volume && (
            <div className="text-slate-500">
              Volume 24h: <span className="text-slate-300 font-semibold">{Number(ticker24h.volume).toLocaleString()} {config.symbol.replace('USDT', '')}</span>
            </div>
          )}
        </div>
      )}

      {/* SVG Canvas Area */}
      <div className="relative w-full overflow-x-auto select-none">
        <svg
          viewBox={`0 0 ${chartWidth} ${height}`}
          className="w-full h-auto cursor-crosshair block"
          onMouseLeave={() => setHoverIndex(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = ((e.clientX - rect.left) / rect.width) * chartWidth;
            const idx = Math.floor((relX - paddingLeft) / candleSpacing);
            if (idx >= 0 && idx < n) {
              setHoverIndex(idx);
            }
          }}
        >
          <defs>
            <linearGradient id="bbGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.04" />
            </linearGradient>
          </defs>

          {/* Background grid lines */}
          {priceGridLevels.map((lvl, i) => {
            const y = priceToY(lvl);
            return (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - paddingRight}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={chartWidth - paddingRight + 6}
                  y={y + 3}
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="JetBrains Mono"
                  textAnchor="start"
                >
                  {lvl.toFixed(config.digits)}
                </text>
              </g>
            );
          })}

          {/* Bollinger Band Shaded Area */}
          {showBB && bbAreaPath && (
            <path d={bbAreaPath} fill="url(#bbGradient)" stroke="#3b82f6" strokeWidth="0.8" strokeOpacity="0.4" />
          )}

          {/* Indicator Lines */}
          {showSMA50 && sma50Path && (
            <path d={sma50Path} fill="none" stroke="#a855f7" strokeWidth="1.2" strokeOpacity="0.8" />
          )}
          {showEMA21 && ema21Path && (
            <path d={ema21Path} fill="none" stroke="#f59e0b" strokeWidth="1.3" />
          )}
          {showEMA9 && ema9Path && (
            <path d={ema9Path} fill="none" stroke="#06b6d4" strokeWidth="1.5" />
          )}

          {/* Candlesticks & AI Signals */}
          {visibleCandles.map((c, i) => {
            const x = getX(i);
            const isBullish = c.close >= c.open;
            const candleColor = isBullish ? '#10b981' : '#f43f5e';

            const yHigh = priceToY(c.high);
            const yLow = priceToY(c.low);
            const yOpen = priceToY(c.open);
            const yClose = priceToY(c.close);

            const bodyTop = Math.min(yOpen, yClose);
            const bodyHeight = Math.max(Math.abs(yClose - yOpen), 1.5);

            return (
              <g key={i}>
                {/* Wick */}
                <line
                  x1={x}
                  y1={yHigh}
                  x2={x}
                  y2={yLow}
                  stroke={candleColor}
                  strokeWidth="1"
                />

                {/* Body */}
                <rect
                  x={x - candleBodyWidth / 2}
                  y={bodyTop}
                  width={candleBodyWidth}
                  height={bodyHeight}
                  fill={candleColor}
                  rx="1"
                />

                {/* AI Signal Markers */}
                {c.signal === 'BUY' && (
                  <g transform={`translate(${x}, ${yLow + 14})`}>
                    <polygon points="0,-7 -5,2 5,2" fill="#10b981" />
                    <text
                      y="12"
                      fill="#10b981"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="JetBrains Mono"
                      textAnchor="middle"
                    >
                      COMPRA
                    </text>
                  </g>
                )}

                {c.signal === 'SELL' && (
                  <g transform={`translate(${x}, ${yHigh - 14})`}>
                    <polygon points="0,7 -5,-2 5,-2" fill="#f43f5e" />
                    <text
                      y="-7"
                      fill="#f43f5e"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="JetBrains Mono"
                      textAnchor="middle"
                    >
                      VENDA
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Volume Sub-chart */}
          <g>
            <line
              x1={paddingLeft}
              y1={paddingTop + priceHeight + 10}
              x2={chartWidth - paddingRight}
              y2={paddingTop + priceHeight + 10}
              stroke="#1e293b"
              strokeWidth="1"
            />
            <text
              x={paddingLeft}
              y={paddingTop + priceHeight + 22}
              fill="#64748b"
              fontSize="9"
              fontFamily="JetBrains Mono"
            >
              VOL
            </text>

            {visibleCandles.map((c, i) => {
              const x = getX(i);
              const y = volumeToY(c.volume);
              const base = paddingTop + priceHeight + 15 + volumeHeight;
              const barHeight = Math.max(base - y, 1);
              const color = c.close >= c.open ? '#10b98155' : '#f43f5e55';

              return (
                <rect
                  key={`vol-${i}`}
                  x={x - candleBodyWidth / 2}
                  y={y}
                  width={candleBodyWidth}
                  height={barHeight}
                  fill={color}
                  rx="0.5"
                />
              );
            })}
          </g>

          {/* RSI Sub-chart */}
          {showRSI && (
            <g>
              <line
                x1={paddingLeft}
                y1={paddingTop + priceHeight + volumeHeight + 20}
                x2={chartWidth - paddingRight}
                y2={paddingTop + priceHeight + volumeHeight + 20}
                stroke="#1e293b"
                strokeWidth="1"
              />
              
              {/* RSI 70 line */}
              <line
                x1={paddingLeft}
                y1={rsiToY(70)}
                x2={chartWidth - paddingRight}
                y2={rsiToY(70)}
                stroke="#f43f5e"
                strokeDasharray="2 3"
                strokeWidth="0.8"
                strokeOpacity="0.5"
              />
              <text
                x={chartWidth - paddingRight + 6}
                y={rsiToY(70) + 3}
                fill="#f43f5e"
                fontSize="9"
                fontFamily="JetBrains Mono"
              >
                70
              </text>

              {/* RSI 30 line */}
              <line
                x1={paddingLeft}
                y1={rsiToY(30)}
                x2={chartWidth - paddingRight}
                y2={rsiToY(30)}
                stroke="#10b981"
                strokeDasharray="2 3"
                strokeWidth="0.8"
                strokeOpacity="0.5"
              />
              <text
                x={chartWidth - paddingRight + 6}
                y={rsiToY(30) + 3}
                fill="#10b981"
                fontSize="9"
                fontFamily="JetBrains Mono"
              >
                30
              </text>

              <text
                x={paddingLeft}
                y={paddingTop + priceHeight + volumeHeight + 35}
                fill="#64748b"
                fontSize="9"
                fontFamily="JetBrains Mono"
              >
                RSI(14)
              </text>

              {rsiPath && (
                <path d={rsiPath} fill="none" stroke="#10b981" strokeWidth="1.2" />
              )}
            </g>
          )}

          {/* Hover Crosshair */}
          {hoverIndex !== null && visibleCandles[hoverIndex] && (
            <g>
              <line
                x1={getX(hoverIndex)}
                y1={paddingTop}
                x2={getX(hoverIndex)}
                y2={height - 20}
                stroke="#94a3b8"
                strokeDasharray="2 2"
                strokeWidth="1"
                strokeOpacity="0.7"
              />
              <line
                x1={paddingLeft}
                y1={priceToY(visibleCandles[hoverIndex].close)}
                x2={chartWidth - paddingRight}
                y2={priceToY(visibleCandles[hoverIndex].close)}
                stroke="#94a3b8"
                strokeDasharray="2 2"
                strokeWidth="1"
                strokeOpacity="0.7"
              />
              {/* Floating time label */}
              <text
                x={getX(hoverIndex)}
                y={height - 5}
                fill="#cbd5e1"
                fontSize="10"
                fontFamily="JetBrains Mono"
                textAnchor="middle"
              >
                {visibleCandles[hoverIndex].time}
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
