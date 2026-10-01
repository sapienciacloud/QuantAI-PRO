import React, { useState, useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight, Download, Filter, RefreshCw, DollarSign, Percent, TrendingUp, ShieldAlert, Award, BarChart2 } from 'lucide-react';
import { AssetConfig, BacktestMetrics, BacktestParams, Trade } from '../types/trading';

interface BacktestViewProps {
  metrics: BacktestMetrics;
  trades: Trade[];
  equityCurve: { time: string; equity: number; drawdown: number }[];
  params: BacktestParams;
  config: AssetConfig;
  onUpdateParams: (newParams: BacktestParams) => void;
  onRunBacktest: () => void;
}

export const BacktestView: React.FC<BacktestViewProps> = ({
  metrics,
  trades,
  equityCurve,
  params,
  config,
  onUpdateParams,
  onRunBacktest,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'WINNERS' | 'LOSERS' | 'BUY' | 'SELL'>('ALL');
  const currencySymbol = config.currency === 'BRL' ? 'R$' : config.currency === 'USDT' ? 'USDT' : '$';

  // Filtered trades
  const filteredTrades = useMemo(() => {
    return trades.filter((t) => {
      if (filterType === 'WINNERS') return t.netPnl > 0;
      if (filterType === 'LOSERS') return t.netPnl <= 0;
      if (filterType === 'BUY') return t.type === 'BUY';
      if (filterType === 'SELL') return t.type === 'SELL';
      return true;
    });
  }, [trades, filterType]);

  // SVG Equity Curve Calculation
  const svgWidth = 850;
  const svgHeight = 240;
  const padding = { top: 20, right: 30, bottom: 30, left: 60 };

  const { minEq, maxEq, equityPath, ddPath } = useMemo(() => {
    if (equityCurve.length === 0) return { minEq: 0, maxEq: 1, equityPath: '', ddPath: '' };

    let min = Infinity;
    let max = -Infinity;
    let maxDD = 0;

    for (const pt of equityCurve) {
      if (pt.equity < min) min = pt.equity;
      if (pt.equity > max) max = pt.equity;
      if (pt.drawdown > maxDD) maxDD = pt.drawdown;
    }

    const margin = (max - min) * 0.08 || 10;
    const finalMin = min - margin;
    const finalMax = max + margin;

    const plotW = svgWidth - padding.left - padding.right;
    const plotH = svgHeight - padding.top - padding.bottom;

    const points = equityCurve.map((pt, i) => {
      const x = padding.left + (i / Math.max(equityCurve.length - 1, 1)) * plotW;
      const y = padding.top + plotH - ((pt.equity - finalMin) / (finalMax - finalMin)) * plotH;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    });

    const ddPoints = equityCurve.map((pt, i) => {
      const x = padding.left + (i / Math.max(equityCurve.length - 1, 1)) * plotW;
      // Drawdown scale from 0% at bottom to maxDD at top
      const y = svgHeight - padding.bottom - (pt.drawdown / (maxDD || 1)) * 40;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    });

    return {
      minEq: finalMin,
      maxEq: finalMax,
      equityPath: points.join(' '),
      ddPath: ddPoints.join(' '),
    };
  }, [equityCurve]);

  // Export trades to CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Ticket', 'Simbolo', 'Tipo', 'Lotes', 'Entrada', 'Saida', 'Hora_Entrada', 'Hora_Saida', 'Pontos', 'Lucro_Liquido', 'Motivo_Saida'];
    const rows = trades.map((t) => [
      t.id,
      t.ticket,
      t.symbol,
      t.type,
      t.lots,
      t.entryPrice,
      t.exitPrice,
      t.entryTime,
      t.exitTime,
      t.points,
      t.netPnl,
      t.exitReason,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `backtest_${config.symbol}_trades.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Parameter Control Panel */}
      <div className="bg-[#0d131f] border border-slate-800 rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white">Parâmetros do Backtest Quantitativo</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulação de eventos com dados históricos em candles M5 do ativo {config.symbol}
            </p>
          </div>
          <button
            onClick={onRunBacktest}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Recalcular Backtest
          </button>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-4">
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Capital Inicial ({currencySymbol})
            </label>
            <input
              type="number"
              value={params.initialCapital}
              onChange={(e) => onUpdateParams({ ...params, initialCapital: Number(e.target.value) || 1000 })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Volume / Lotes
            </label>
            <input
              type="number"
              step={config.market === 'Forex' ? '0.01' : '1'}
              value={params.lots}
              onChange={(e) => onUpdateParams({ ...params, lots: Number(e.target.value) || 1 })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Stop Loss ({config.market === 'Forex' ? 'pips' : 'pontos'})
            </label>
            <input
              type="number"
              step={config.tickSize}
              value={params.stopLossPoints}
              onChange={(e) => onUpdateParams({ ...params, stopLossPoints: Number(e.target.value) || 10 })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Take Profit ({config.market === 'Forex' ? 'pips' : 'pontos'})
            </label>
            <input
              type="number"
              step={config.tickSize}
              value={params.takeProfitPoints}
              onChange={(e) => onUpdateParams({ ...params, takeProfitPoints: Number(e.target.value) || 20 })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Filtro IA (Confiança &gt;= {Math.round(params.confidenceThreshold * 100)}%)
            </label>
            <input
              type="range"
              min="0.51"
              max="0.75"
              step="0.01"
              value={params.confidenceThreshold}
              onChange={(e) => onUpdateParams({ ...params, confidenceThreshold: Number(e.target.value) })}
              className="w-full mt-2 accent-emerald-500 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Custo por Trade ({currencySymbol})
            </label>
            <input
              type="number"
              step="0.05"
              value={params.costPerTrade}
              onChange={(e) => onUpdateParams({ ...params, costPerTrade: Number(e.target.value) || 0 })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Metrics Scorecards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-[#0d131f] border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 font-medium">Lucro Líquido</div>
          <div className={`text-lg font-bold mt-1 font-mono tabular-nums ${metrics.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {metrics.netProfit >= 0 ? '+' : ''}{currencySymbol} {metrics.netProfit.toFixed(2)}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-mono">
            Retorno: {metrics.totalReturnPct >= 0 ? '+' : ''}{metrics.totalReturnPct.toFixed(1)}%
          </div>
        </div>

        <div className="bg-[#0d131f] border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 font-medium">Taxa de Acerto (Win Rate)</div>
          <div className="text-lg font-bold text-white mt-1 font-mono tabular-nums">
            {metrics.winRate.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {metrics.winningTrades} vitórias / {metrics.losingTrades} derrotas
          </div>
        </div>

        <div className="bg-[#0d131f] border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 font-medium">Fator de Lucro (PF)</div>
          <div className={`text-lg font-bold mt-1 font-mono tabular-nums ${metrics.profitFactor >= 1.5 ? 'text-emerald-400' : metrics.profitFactor >= 1.0 ? 'text-amber-400' : 'text-rose-400'}`}>
            {metrics.profitFactor.toFixed(2)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Payoff: {metrics.payoffRatio.toFixed(2)}x
          </div>
        </div>

        <div className="bg-[#0d131f] border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 font-medium">Drawdown Máximo</div>
          <div className="text-lg font-bold text-rose-400 mt-1 font-mono tabular-nums">
            {metrics.maxDrawdownPct.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-400 mt-1 font-mono">
            {currencySymbol} {metrics.maxDrawdownValue.toFixed(2)}
          </div>
        </div>

        <div className="bg-[#0d131f] border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 font-medium">Sharpe Ratio</div>
          <div className="text-lg font-bold text-white mt-1 font-mono tabular-nums">
            {metrics.sharpeRatio.toFixed(2)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Expectativa: {currencySymbol} {metrics.expectancy.toFixed(2)}
          </div>
        </div>

        <div className="bg-[#0d131f] border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 font-medium">Total de Trades</div>
          <div className="text-lg font-bold text-white mt-1 font-mono tabular-nums">
            {metrics.totalTrades}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Max Wins: {metrics.maxConsecWins} | Loss: {metrics.maxConsecLosses}
          </div>
        </div>
      </div>

      {/* Equity Curve & Underwater Drawdown Chart */}
      <div className="bg-[#0d131f] border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Curva de Capital (Equity Curve) & Drawdown
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Evolução do saldo da conta ao longo das operações simuladas
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-0.5 bg-emerald-400 inline-block" /> Saldo Líquido
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2.5 h-0.5 bg-rose-400 inline-block" /> Drawdown
            </span>
          </div>
        </div>

        <div className="mt-4 w-full overflow-x-auto">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto block select-none">
            <defs>
              <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid horizontal lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const y = padding.top + (svgHeight - padding.top - padding.bottom) * pct;
              const val = maxEq - (maxEq - minEq) * pct;
              return (
                <g key={i}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={svgWidth - padding.right}
                    y2={y}
                    stroke="#1e293b"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 3}
                    fill="#64748b"
                    fontSize="10"
                    fontFamily="JetBrains Mono"
                    textAnchor="end"
                  >
                    {val.toFixed(0)}
                  </text>
                </g>
              );
            })}

            {/* Drawdown Area */}
            {ddPath && (
              <path
                d={ddPath}
                fill="none"
                stroke="#f43f5e"
                strokeWidth="1"
                strokeOpacity="0.6"
              />
            )}

            {/* Equity Curve Line */}
            {equityPath && (
              <path
                d={equityPath}
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>
        </div>
      </div>

      {/* Trades History Table */}
      <div className="bg-[#0d131f] border border-slate-800 rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Histórico Detalhado de Trades ({filteredTrades.length})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter buttons */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
              {(['ALL', 'WINNERS', 'LOSERS', 'BUY', 'SELL'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setFilterType(mode)}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                    filterType === mode
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {mode === 'ALL' && 'Todos'}
                  {mode === 'WINNERS' && 'Vencedores'}
                  {mode === 'LOSERS' && 'Perdedores'}
                  {mode === 'BUY' && 'Compras'}
                  {mode === 'SELL' && 'Vendas'}
                </button>
              ))}
            </div>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Table Viewport */}
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                <th className="py-2.5 px-3">Ticket</th>
                <th className="py-2.5 px-3">Tipo</th>
                <th className="py-2.5 px-3">Entrada</th>
                <th className="py-2.5 px-3">Saída</th>
                <th className="py-2.5 px-3">Horário</th>
                <th className="py-2.5 px-3 text-right">Pontos</th>
                <th className="py-2.5 px-3 text-right">Resultado</th>
                <th className="py-2.5 px-3 text-center">Motivo Saída</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTrades.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                    Nenhum trade encontrado para o filtro selecionado.
                  </td>
                </tr>
              ) : (
                filteredTrades.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-2 px-3 text-slate-400">#{t.ticket}</td>
                    <td className="py-2 px-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        t.type === 'BUY'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-300">{t.entryPrice.toFixed(config.digits)}</td>
                    <td className="py-2 px-3 text-slate-300">{t.exitPrice.toFixed(config.digits)}</td>
                    <td className="py-2 px-3 text-slate-400 text-[11px]">{t.entryTime} → {t.exitTime}</td>
                    <td className={`py-2 px-3 text-right ${t.points >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {t.points >= 0 ? '+' : ''}{t.points.toFixed(config.digits)}
                    </td>
                    <td className={`py-2 px-3 text-right font-bold ${t.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {t.netPnl >= 0 ? '+' : ''}{currencySymbol} {t.netPnl.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                        {t.exitReason === 'TAKE_PROFIT' ? 'Take Profit' : t.exitReason === 'STOP_LOSS' ? 'Stop Loss' : 'Reversão'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
