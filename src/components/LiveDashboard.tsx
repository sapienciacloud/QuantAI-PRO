import React, { useState } from 'react';
import { Play, Pause, SkipForward, RotateCcw, TrendingUp, TrendingDown, ShieldAlert, Cpu, ArrowUpRight, ArrowDownRight, CheckCircle2, Clock, X, BarChart2, RefreshCw, Zap, Layers, Activity, ChevronDown, ChevronUp, Radio, HelpCircle, Sparkles } from 'lucide-react';
import { AssetConfig, Candle, LogMessage, Position, BotInstance } from '../types/trading';
import { CandleChart } from './CandleChart';
import { RiskManagementSection } from './RiskManagementSection';
import { GeminiRiskChatbot } from './GeminiRiskChatbot';

interface LiveDashboardProps {
  candles: Candle[];
  config: AssetConfig;
  position: Position | null;
  logs: LogMessage[];
  isSimulating: boolean;
  simulationSpeed: number;
  onToggleSimulate: () => void;
  onStepSimulate: () => void;
  onResetSimulate: () => void;
  onChangeSpeed: (speed: number) => void;
  onClosePosition: () => void;
  onApplyTrailingStop: () => void;
  onClearLogs: () => void;
  confidenceThreshold: number;
  isLiveMarketMode?: boolean;
  onToggleLiveMarketMode?: () => void;
  onFetchLiveMarketData?: () => void;
  isLoadingLiveMarket?: boolean;
  lastLiveSyncTime?: string;
  ticker24h?: any;
  bots?: BotInstance[];
  activeBot?: BotInstance;
  onToggleBotStatus?: (botId: string) => void;
}

export const LiveDashboard: React.FC<LiveDashboardProps> = ({
  candles,
  config,
  position,
  logs,
  isSimulating,
  simulationSpeed,
  onToggleSimulate,
  onStepSimulate,
  onResetSimulate,
  onChangeSpeed,
  onClosePosition,
  onApplyTrailingStop,
  onClearLogs,
  confidenceThreshold,
  isLiveMarketMode = false,
  onToggleLiveMarketMode,
  onFetchLiveMarketData,
  isLoadingLiveMarket = false,
  lastLiveSyncTime,
  ticker24h,
  bots = [],
  activeBot,
  onToggleBotStatus,
}) => {
  const [showChartDetails, setShowChartDetails] = useState<boolean>(true);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);

  const currentCandle = candles[candles.length - 1];
  const probBuy = currentCandle?.probBuy ?? 0.5;
  const probSell = currentCandle?.probSell ?? 0.5;
  const currentSignal = currentCandle?.signal ?? null;

  const currencySymbol = config.currency === 'BRL' ? 'R$' : config.currency === 'USDT' ? 'USDT' : '$';

  return (
    <div className="space-y-6">
      {/* Top Telemetry / High-level Stat Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#0d131f] border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 font-medium">Ativo em Operação</div>
          <div className="text-lg font-bold text-white mt-1 flex items-center gap-2">
            <span>{config.symbol}</span>
            <span className="text-xs font-normal text-slate-500">({config.name})</span>
          </div>
          <div className="text-xs text-slate-400 mt-1 font-mono">
            Último: <span className="text-slate-200">{currentCandle?.close.toFixed(config.digits)}</span>
          </div>
        </div>

        <div className="bg-[#0d131f] border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 font-medium">Estado da Posição</div>
          <div className="text-lg font-bold mt-1">
            {position ? (
              <span className={`flex items-center gap-1.5 ${position.type === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {position.type === 'BUY' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                {position.type === 'BUY' ? 'COMPRADO' : 'VENDIDO'} ({position.lots} {config.market.includes('Futuros') ? 'mini' : 'lots'})
              </span>
            ) : (
              <span className="text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Sem Posição (Livre)
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-mono">
            {position ? (
              <span>Entrada: {position.entryPrice.toFixed(config.digits)}</span>
            ) : (
              <span>Pronto para novo sinal</span>
            )}
          </div>
        </div>

        <div className="bg-[#0d131f] border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 font-medium">Resultado Aberto (PnL)</div>
          <div className="text-lg font-bold mt-1 font-mono tabular-nums">
            {position ? (
              <span className={position.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {position.pnl >= 0 ? '+' : ''}{currencySymbol} {position.pnl.toFixed(2)}
              </span>
            ) : (
              <span className="text-slate-500">{currencySymbol} 0.00</span>
            )}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-mono">
            {position ? (
              <span>{position.points >= 0 ? '+' : ''}{position.points.toFixed(config.digits)} pts</span>
            ) : (
              <span>Aguardando trade</span>
            )}
          </div>
        </div>

        <div className="bg-[#0d131f] border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 font-medium">Sinal Predito pela IA</div>
          <div className="text-lg font-bold mt-1 flex items-center gap-2">
            {currentSignal === 'BUY' ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <TrendingUp className="w-5 h-5" /> COMPRA ({(probBuy * 100).toFixed(0)}%)
              </span>
            ) : currentSignal === 'SELL' ? (
              <span className="text-rose-400 flex items-center gap-1">
                <TrendingDown className="w-5 h-5" /> VENDA ({(probSell * 100).toFixed(0)}%)
              </span>
            ) : (
              <span className="text-slate-400 flex items-center gap-1">
                <Clock className="w-4 h-4 text-slate-500" /> NEUTRO (P &lt; {confidenceThreshold * 100}%)
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Limiar de disparo: <span className="font-mono text-slate-300">{(confidenceThreshold * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* Feed & Simulator Control Bar */}
      <div className="bg-[#0d131f] border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Data Mode Segmented Control (Live vs Simulator) */}
          {onToggleLiveMarketMode && (
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
              <button
                onClick={onToggleLiveMarketMode}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                  isLiveMarketMode
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isLiveMarketMode ? 'bg-white animate-pulse' : 'bg-slate-500'}`} />
                Cotações Ao Vivo (API)
              </button>
              <button
                onClick={onToggleLiveMarketMode}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  !isLiveMarketMode
                    ? 'bg-slate-800 text-slate-100 shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Simulador Bar-a-Bar
              </button>
            </div>
          )}

          {/* Button to fetch current real-time chart data */}
          {onFetchLiveMarketData && (
            <button
              onClick={onFetchLiveMarketData}
              disabled={isLoadingLiveMarket}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <span className={isLoadingLiveMarket ? 'animate-spin inline-block' : ''}>⚡</span>
              {isLoadingLiveMarket ? 'Consultando Binance...' : 'Buscar Dados Atuais do Gráfico'}
            </button>
          )}

          {!isLiveMarketMode && (
            <>
              <button
                onClick={onToggleSimulate}
                className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all ${
                  isSimulating
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isSimulating ? 'Pausar Simulação' : 'Iniciar Simulação MT5'}
              </button>

              <button
                onClick={onStepSimulate}
                disabled={isSimulating}
                className="px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-50 flex items-center gap-1.5 transition-colors"
              >
                <SkipForward className="w-3.5 h-3.5" />
                +1 Candle M5
              </button>

              <button
                onClick={onResetSimulate}
                className="px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reiniciar
              </button>
            </>
          )}
        </div>

        {/* Speed Controls or Auto-refresh notification */}
        {!isLiveMarketMode ? (
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-500 px-2 text-[11px]">Velocidade:</span>
            {[1, 5, 20].map((spd) => (
              <button
                key={spd}
                onClick={() => onChangeSpeed(spd)}
                className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors ${
                  simulationSpeed === spd
                    ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        ) : (
          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Atualização contínua via API Binance (REST + WebSocket)</span>
          </div>
        )}
      </div>

      {/* Main Candlestick Chart with Live Feed Support */}
      <CandleChart
        candles={candles}
        config={config}
        isLiveFeed={isLiveMarketMode}
        lastSyncTime={lastLiveSyncTime}
        onRefreshLive={onFetchLiveMarketData}
        isLoadingLive={isLoadingLiveMarket}
        ticker24h={ticker24h}
      />

      {/* Current Chart Information & Live Telemetry Inspector */}
      <div className="bg-[#0d131f] border border-slate-800 rounded-xl overflow-hidden shadow-md">
        <div className="px-5 py-4 bg-slate-900/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">
                  Informações Atuais do Gráfico & Telemetria em Tempo Real
                </h3>
                {isLiveMarketMode ? (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    CONEXÃO AO VIVO ATIVA
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700">
                    MODO SIMULADOR MT5
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Dados instantâneos do candle atual ({config.symbol}), indicadores técnicos e probabilidade gerada pela IA.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onFetchLiveMarketData && (
              <button
                onClick={onFetchLiveMarketData}
                disabled={isLoadingLiveMarket}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLiveMarket ? 'animate-spin' : ''}`} />
                <span>{isLoadingLiveMarket ? 'Atualizando Cotações...' : 'Buscar Dados Atuais Agora'}</span>
              </button>
            )}

            <button
              onClick={() => setShowChartDetails(!showChartDetails)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title={showChartDetails ? 'Ocultar detalhes' : 'Exibir detalhes'}
            >
              {showChartDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {showChartDetails && (
          <div className="p-5 space-y-5">
            {/* 4 Cards Grid with Real-time Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Cotação e OHLCV */}
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Cotação & Candle Atual</span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                    {currentCandle?.time || '00:00'}
                  </span>
                </div>

                <div className="pt-1">
                  <div className="text-2xl font-bold font-mono tracking-tight text-white flex items-baseline gap-2">
                    <span>{currentCandle ? currentCandle.close.toFixed(config.digits) : '---'}</span>
                    <span className="text-xs font-normal text-slate-400">{config.currency}</span>
                  </div>
                  {ticker24h && (
                    <div className="text-xs font-mono mt-1 flex items-center gap-1.5">
                      <span className={parseFloat(ticker24h.priceChangePercent) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {parseFloat(ticker24h.priceChangePercent) >= 0 ? '+' : ''}{parseFloat(ticker24h.priceChangePercent).toFixed(2)}% (24h)
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800/80 space-y-1 text-xs font-mono text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Abertura (Open):</span>
                    <span>{currentCandle?.open.toFixed(config.digits)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Máxima (High):</span>
                    <span className="text-emerald-400">{currentCandle?.high.toFixed(config.digits)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mínima (Low):</span>
                    <span className="text-rose-400">{currentCandle?.low.toFixed(config.digits)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Volume:</span>
                    <span>{currentCandle?.volume.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Médias e Tendência */}
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Médias & Tendência</span>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                    M5
                  </span>
                </div>

                <div className="space-y-1.5 pt-1 text-xs font-mono">
                  <div className="flex justify-between items-center">
                    <span className="text-cyan-400 font-medium">EMA 9 (Rápida):</span>
                    <span className="text-slate-200">{currentCandle?.ema9 ? currentCandle.ema9.toFixed(config.digits) : '---'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-amber-400 font-medium">EMA 21 (Média):</span>
                    <span className="text-slate-200">{currentCandle?.ema21 ? currentCandle.ema21.toFixed(config.digits) : '---'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-purple-400 font-medium">SMA 50 (Macro):</span>
                    <span className="text-slate-200">{currentCandle?.sma50 ? currentCandle.sma50.toFixed(config.digits) : '---'}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 text-xs">
                  <div className="text-[11px] text-slate-400">Alinhamento de Médias:</div>
                  <div className="mt-1 font-semibold">
                    {currentCandle?.ema9 && currentCandle?.ema21 && currentCandle.ema9 > currentCandle.ema21 ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-mono text-xs">
                        <TrendingUp className="w-3.5 h-3.5" /> EMA 9 &gt; EMA 21 (Tendência de Alta)
                      </span>
                    ) : (
                      <span className="text-rose-400 flex items-center gap-1 font-mono text-xs">
                        <TrendingDown className="w-3.5 h-3.5" /> EMA 9 &lt; EMA 21 (Tendência de Baixa)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card 3: Volatilidade & RSI */}
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Volatilidade & RSI</span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                    Wilder 14
                  </span>
                </div>

                <div className="space-y-2 pt-1 text-xs font-mono">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">RSI (14 períodos):</span>
                    <span className={`font-bold ${
                      (currentCandle?.rsi ?? 50) > 70 ? 'text-rose-400' : (currentCandle?.rsi ?? 50) < 30 ? 'text-emerald-400' : 'text-slate-200'
                    }`}>
                      {currentCandle?.rsi ? currentCandle.rsi.toFixed(1) : '---'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">ATR (14 barras):</span>
                    <span className="text-slate-200">{currentCandle?.atr ? currentCandle.atr.toFixed(config.digits) : '---'} pts</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Bollinger Superior:</span>
                    <span className="text-slate-300">{currentCandle?.bbUpper ? currentCandle.bbUpper.toFixed(config.digits) : '---'}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Bollinger Inferior:</span>
                    <span className="text-slate-300">{currentCandle?.bbLower ? currentCandle.bbLower.toFixed(config.digits) : '---'}</span>
                  </div>
                </div>

                <div className="pt-1.5 text-[11px] text-slate-400">
                  Condição RSI:{' '}
                  <span className="font-semibold text-slate-300">
                    {(currentCandle?.rsi ?? 50) > 70 ? 'Sobrecomprado (>70)' : (currentCandle?.rsi ?? 50) < 30 ? 'Sobrevendido (<30)' : 'Zona Neutra (30-70)'}
                  </span>
                </div>
              </div>

              {/* Card 4: Decisão da Inteligência Artificial */}
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Predição da IA</span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    Random Forest
                  </span>
                </div>

                <div className="space-y-2 pt-1 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] font-mono mb-1">
                      <span className="text-emerald-400 font-medium">P(Compra / Alta):</span>
                      <span className="font-bold text-emerald-400">{(probBuy * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(probBuy * 100, 100)}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-mono mb-1">
                      <span className="text-rose-400 font-medium">P(Venda / Baixa):</span>
                      <span className="font-bold text-rose-400">{(probSell * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-rose-500 h-full rounded-full" style={{ width: `${Math.min(probSell * 100, 100)}%` }} />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Sinal Emitido:</span>
                    <span className="font-bold font-mono">
                      {currentSignal === 'BUY' ? (
                        <span className="text-emerald-400">ORDEM COMPRA</span>
                      ) : currentSignal === 'SELL' ? (
                        <span className="text-rose-400">ORDEM VENDA</span>
                      ) : (
                        <span className="text-slate-400">NEUTRO (FILTRO)</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Explanatory footer explaining how live chart data is gathered */}
            <div className="bg-slate-900/30 rounded-lg p-3 border border-slate-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span>
                  <strong>Fonte de Dados em Tempo Real:</strong>{' '}
                  {isLiveMarketMode
                    ? 'Conexão direta com a API Pública REST da Binance (/api/v3/klines) com atualização a cada 10s.'
                    : 'Terminal MetaTrader 5 via script Python (MetaTrader5.copy_rates_from_pos) ou simulação tick-a-tick.'}
                </span>
              </div>
              {lastLiveSyncTime && (
                <div className="font-mono text-[11px] text-slate-500 shrink-0">
                  Última sincronização: <span className="text-slate-300">{lastLiveSyncTime}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Risk Management Section with Real-Time Exposure, Drawdown & Equity Contribution */}
      <RiskManagementSection
        bots={bots}
        activeBot={activeBot || (bots[0] as BotInstance)}
        position={position}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        onToggleBotStatus={onToggleBotStatus}
      />

      {/* Lower Dashboard Columns: Position & AI Gauge & MT5 Terminal Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Active Position & AI Probabilities (1 col) */}
        <div className="space-y-6">
          {/* Active Position Card */}
          <div className="bg-[#0d131f] border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Posição Aberta no MT5
              </span>
              {position && (
                <span className="text-xs font-mono text-slate-400">
                  Ticket #{position.ticket}
                </span>
              )}
            </div>

            {position ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Tipo de Ordem:</span>
                  <span className={`font-bold font-mono ${position.type === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {position.type === 'BUY' ? 'COMPRA (BUY)' : 'VENDA (SELL)'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Volume:</span>
                  <span className="font-mono text-slate-200">{position.lots} contrato(s)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Preço de Entrada:</span>
                  <span className="font-mono text-slate-200">{position.entryPrice.toFixed(config.digits)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Preço Atual:</span>
                  <span className="font-mono text-slate-200">{position.currentPrice.toFixed(config.digits)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Stop Loss (SL):</span>
                  <span className="font-mono text-rose-400">{position.sl.toFixed(config.digits)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Take Profit (TP):</span>
                  <span className="font-mono text-emerald-400">{position.tp.toFixed(config.digits)}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-sm font-semibold">
                  <span className="text-slate-300">Lucro Líquido:</span>
                  <span className={`font-mono ${position.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {position.pnl >= 0 ? '+' : ''}{currencySymbol} {position.pnl.toFixed(2)} ({position.points >= 0 ? '+' : ''}{position.points.toFixed(config.digits)} pts)
                  </span>
                </div>

                <div className="pt-3 flex gap-2">
                  <button
                    onClick={onClosePosition}
                    className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-600/40 transition-colors"
                  >
                    Encerrar a Mercado
                  </button>
                  <button
                    onClick={onApplyTrailingStop}
                    className="py-2 px-3 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                    title="Ajusta o Stop Loss para o ponto de entrada (Breakeven)"
                  >
                    Breakeven
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500 space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-slate-600 stroke-[1.5]" />
                <p>Nenhuma posição aberta no momento.</p>
                <p className="text-[11px] text-slate-600">
                  O bot monitora o fechamento dos candles para avaliar sinais com a IA.
                </p>
              </div>
            )}
          </div>

          {/* AI Decision & Confidence Gauge */}
          <div className="bg-[#0d131f] border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-emerald-400" />
                Motor de Inferência (IA)
              </span>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Random Forest
              </span>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-emerald-400 font-medium">Probabilidade de Alta (P_Buy)</span>
                  <span className="font-mono text-emerald-400 font-bold">{(probBuy * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(probBuy * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-rose-400 font-medium">Probabilidade de Baixa (P_Sell)</span>
                  <span className="font-mono text-rose-400 font-bold">{(probSell * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(probSell * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Feature Values Snapshot */}
              <div className="bg-slate-900/80 rounded-lg p-3 border border-slate-800 space-y-2 text-xs font-mono">
                <div className="text-[11px] font-sans text-slate-400 font-semibold mb-1">
                  Atributos Extraídos no Candle Atual:
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>RSI (14):</span>
                  <span className={currentCandle?.rsi && currentCandle.rsi > 70 ? 'text-rose-400' : currentCandle?.rsi && currentCandle.rsi < 30 ? 'text-emerald-400' : 'text-slate-200'}>
                    {currentCandle?.rsi?.toFixed(1) ?? 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>ATR (14):</span>
                  <span className="text-slate-200">{currentCandle?.atr?.toFixed(config.digits) ?? 'N/A'}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>EMA 9 - EMA 21:</span>
                  <span className={(currentCandle?.ema9 ?? 0) >= (currentCandle?.ema21 ?? 0) ? 'text-emerald-400' : 'text-rose-400'}>
                    {((currentCandle?.ema9 ?? 0) - (currentCandle?.ema21 ?? 0)).toFixed(config.digits)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: MT5 Terminal Execution Logs (2 cols) */}
        <div className="lg:col-span-2 bg-[#0d131f] border border-slate-800 rounded-xl p-5 flex flex-col h-[520px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Terminal MT5 & Logs de Execução
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <button
              onClick={onClearLogs}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Limpar Logs
            </button>
          </div>

          {/* Logs Viewport */}
          <div className="flex-1 overflow-y-auto mt-3 space-y-1.5 font-mono text-xs pr-1">
            {logs.length === 0 ? (
              <div className="text-slate-500 py-12 text-center text-xs">
                Nenhum log registrado ainda.
              </div>
            ) : (
              logs.map((log) => {
                let badgeColor = 'bg-slate-800 text-slate-300 border-slate-700';
                if (log.level === 'SUCCESS') badgeColor = 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60';
                if (log.level === 'WARNING') badgeColor = 'bg-amber-950/60 text-amber-300 border-amber-800/60';
                if (log.level === 'ERROR') badgeColor = 'bg-rose-950/60 text-rose-300 border-rose-800/60';

                return (
                  <div
                    key={log.id}
                    className="p-2 rounded bg-slate-900/60 border border-slate-800/70 hover:bg-slate-900 transition-colors flex items-start gap-2.5"
                  >
                    <span className="text-[11px] text-slate-500 shrink-0">{log.timestamp}</span>
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${badgeColor} shrink-0`}>
                      {log.category}
                    </span>
                    <span className="text-slate-200 break-words flex-1">{log.message}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Floating Gemini Risk Copilot Trigger Button */}
      <button
        onClick={() => setIsCopilotOpen(true)}
        className="fixed bottom-6 right-6 z-40 px-4 py-3 rounded-full bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold shadow-xl shadow-emerald-950/50 border border-emerald-400/40 flex items-center gap-2.5 transition-all hover:scale-105 active:scale-95 group cursor-pointer"
        title="Abrir Copilot de Risco Quantitativo com Inteligência Artificial Gemini"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
        </span>
        <Sparkles className="w-4 h-4 text-emerald-100 group-hover:rotate-12 transition-transform" />
        <span className="text-xs tracking-wide">Copilot de Risco (Gemini)</span>
      </button>

      {/* Gemini Multi-turn Chatbot Modal Drawer */}
      <GeminiRiskChatbot
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        bots={bots}
        activeBot={activeBot || (bots[0] as BotInstance)}
        totalDailyExposure={38450}
        currentDrawdownPct={1.42}
        portfolioPnl={575.50}
      />
    </div>
  );
};
