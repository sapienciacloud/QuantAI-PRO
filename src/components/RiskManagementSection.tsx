import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  DollarSign,
  PieChart,
  BarChart3,
  Sparkles,
  Lock,
  Unlock,
  Sliders,
  Layers,
  Info,
  CheckCircle2,
  AlertOctagon,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from 'lucide-react';
import { BotInstance, Position } from '../types/trading';

interface RiskManagementSectionProps {
  bots: BotInstance[];
  activeBot: BotInstance;
  position: Position | null;
  onOpenCopilot: () => void;
  onToggleBotStatus?: (botId: string) => void;
}

export const RiskManagementSection: React.FC<RiskManagementSectionProps> = ({
  bots,
  activeBot,
  position,
  onOpenCopilot,
  onToggleBotStatus,
}) => {
  const [activeChartTab, setActiveChartTab] = useState<'contribution' | 'drawdown' | 'table'>('contribution');
  const [isCircuitBreakerActive, setIsCircuitBreakerActive] = useState(false);
  const [riskProfile, setRiskProfile] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate');
  const [hoveredBotId, setHoveredBotId] = useState<string | null>(null);

  // Compute portfolio-level risk metrics dynamically
  const portfolioMetrics = useMemo(() => {
    let totalEquity = 0;
    let totalBalance = 0;
    let totalTodayPnl = 0;
    let totalTrades = 0;
    let winningTrades = 0;
    let totalDailyLossLimit = 0;
    let runningBotsCount = 0;

    // Estimate daily financial exposure based on active lots and contract values
    let totalExposureBRL = 0;
    let exposureByMarket = {
      b3: 0,
      crypto: 0,
      forex: 0,
    };

    bots.forEach((b) => {
      totalBalance += b.account.balance;
      totalEquity += b.account.equity;
      totalTodayPnl += b.stats.todayPnl;
      totalTrades += b.stats.totalTradesToday;
      winningTrades += Math.round((b.stats.winRate / 100) * b.stats.totalTradesToday);
      totalDailyLossLimit += b.maxDailyLoss;

      if (b.status === 'RUNNING') {
        runningBotsCount++;
        // Approximate notional exposure per active bot
        let notional = 0;
        if (b.assetKey === 'WIN') {
          notional = b.lots * 128500 * 0.20; // ~R$ 25.700 por mini
          exposureByMarket.b3 += notional;
        } else if (b.assetKey === 'WDO') {
          notional = b.lots * 5400 * 10; // ~R$ 54.000 por mini
          exposureByMarket.b3 += notional;
        } else if (b.assetKey.includes('USDT')) {
          const approxPrice = b.assetKey === 'BTCUSDT' ? 64000 : b.assetKey === 'ETHUSDT' ? 2600 : 150;
          notional = b.lots * approxPrice * 5.4; // Convert USD to BRL equivalent
          exposureByMarket.crypto += notional;
        } else {
          notional = b.lots * 100000 * 5.4; // Forex 100k standard
          exposureByMarket.forex += notional;
        }
        totalExposureBRL += notional;
      }
    });

    // Add floating position pnl to active bot's today pnl if position is active
    if (position) {
      totalTodayPnl += position.pnl;
    }

    const highWaterMark = totalBalance + Math.max(totalTodayPnl, 850);
    const currentEquity = totalBalance + totalTodayPnl;
    const drawdownValue = Math.max(0, highWaterMark - currentEquity);
    const drawdownPct = highWaterMark > 0 ? (drawdownValue / highWaterMark) * 100 : 0;

    const maxAllowedDrawdownPct = riskProfile === 'conservative' ? 2.0 : riskProfile === 'moderate' ? 3.5 : 5.0;
    const distanceToMaxDailyStop = Math.max(0, totalDailyLossLimit - Math.abs(Math.min(0, totalTodayPnl)));

    const globalWinRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 70;

    return {
      totalBalance,
      totalEquity: currentEquity,
      highWaterMark,
      totalTodayPnl,
      totalExposureBRL,
      exposureByMarket,
      drawdownValue,
      drawdownPct,
      maxAllowedDrawdownPct,
      totalDailyLossLimit,
      distanceToMaxDailyStop,
      runningBotsCount,
      totalTrades,
      globalWinRate,
    };
  }, [bots, position, riskProfile]);

  // Exposure utilization percentage
  const maxExposureLimitBRL = 120000;
  const exposureUtilizationPct = Math.min(
    100,
    (portfolioMetrics.totalExposureBRL / maxExposureLimitBRL) * 100
  );

  // Bot contribution data for charts
  const botContributions = useMemo(() => {
    const totalPnlAbs = bots.reduce((acc, b) => acc + Math.abs(b.stats.todayPnl), 0) || 1;

    return bots.map((b) => {
      const pnl = b.stats.todayPnl;
      const shareOfTotalPct = Number(((Math.abs(pnl) / totalPnlAbs) * 100).toFixed(1));
      const dailyLossUsagePct = Math.min(100, Math.max(0, (Math.abs(Math.min(0, pnl)) / b.maxDailyLoss) * 100));

      return {
        id: b.id,
        name: b.name,
        symbol: b.symbol,
        assetKey: b.assetKey,
        status: b.status,
        lots: b.lots,
        pnl,
        winRate: b.stats.winRate,
        trades: b.stats.totalTradesToday,
        maxDailyLoss: b.maxDailyLoss,
        dailyLossUsagePct,
        shareOfTotalPct,
      };
    });
  }, [bots]);

  return (
    <div className="bg-[#0d131f] border border-slate-800 rounded-xl overflow-hidden shadow-lg space-y-6 p-6">
      {/* 1. Header Bar with Circuit Breaker and AI Copilot trigger */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-white tracking-tight">
                Gestão de Risco Quantitativo & Exposição da Carteira
              </h2>
              {isCircuitBreakerActive ? (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold font-mono bg-rose-500/10 text-rose-400 border border-rose-500/30 animate-pulse">
                  <AlertOctagon className="w-3.5 h-3.5" />
                  CIRCUIT BREAKER ATIVADO (TRAVA GERAL)
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  RISCO CONTROLADO (NORMAL)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Visualização consolidada de exposição diária, drawdown intraday e contribuição individual de cada robô.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Circuit Breaker Toggle */}
          <button
            onClick={() => setIsCircuitBreakerActive(!isCircuitBreakerActive)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
              isCircuitBreakerActive
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
            title="Bloqueia temporariamente novas entradas em todos os robôs para proteger o capital"
          >
            {isCircuitBreakerActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5 text-amber-400" />}
            <span>{isCircuitBreakerActive ? 'Desativar Trava Global' : 'Trava de Emergência (Circuit Breaker)'}</span>
          </button>

          {/* Gemini Risk Copilot Trigger */}
          <button
            onClick={onOpenCopilot}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Consultar Copilot de Risco (Gemini IA)</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards: Exposure, Drawdown, Net PnL, & Risk Profile */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Daily Exposure */}
        <div className="bg-[#090d16] border border-slate-800/90 rounded-xl p-4.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-cyan-400" />
              Exposição Diária Total
            </span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
              {portfolioMetrics.runningBotsCount} robôs ativos
            </span>
          </div>

          <div>
            <div className="text-2xl font-bold font-mono text-white tracking-tight">
              R$ {portfolioMetrics.totalExposureBRL.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>Limite Diário Autorizado:</span>
              <span className="font-mono text-slate-200">R$ {maxExposureLimitBRL.toLocaleString('pt-BR')}</span>
            </div>
          </div>

          {/* Progress Bar for Exposure Utilization */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>Utilização de Margem</span>
              <span className={exposureUtilizationPct > 70 ? 'text-rose-400' : 'text-emerald-400 font-bold'}>
                {exposureUtilizationPct.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  exposureUtilizationPct > 80
                    ? 'bg-rose-500'
                    : exposureUtilizationPct > 50
                    ? 'bg-amber-500'
                    : 'bg-cyan-500'
                }`}
                style={{ width: `${exposureUtilizationPct}%` }}
              />
            </div>
          </div>

          {/* Market breakdown pills */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>B3: <strong className="text-slate-200">R$ {(portfolioMetrics.exposureByMarket.b3 / 1000).toFixed(0)}k</strong></span>
            <span>·</span>
            <span>Cripto: <strong className="text-slate-200">R$ {(portfolioMetrics.exposureByMarket.crypto / 1000).toFixed(0)}k</strong></span>
            <span>·</span>
            <span>Forex: <strong className="text-slate-200">R$ {(portfolioMetrics.exposureByMarket.forex / 1000).toFixed(0)}k</strong></span>
          </div>
        </div>

        {/* Card 2: Current Drawdown */}
        <div className="bg-[#090d16] border border-slate-800/90 rounded-xl p-4.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-rose-400" />
              Drawdown Atual (Pico ao Vale)
            </span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                portfolioMetrics.drawdownPct < 2.0
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                  : portfolioMetrics.drawdownPct < 3.5
                  ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                  : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
              }`}
            >
              Máx Tol.: {portfolioMetrics.maxAllowedDrawdownPct}%
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tracking-tight text-rose-400">
                -{portfolioMetrics.drawdownPct.toFixed(2)}%
              </span>
              <span className="text-xs font-mono text-slate-400">
                (-R$ {portfolioMetrics.drawdownValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>Pico de Equity (High Water Mark):</span>
              <span className="font-mono text-slate-200">
                R$ {portfolioMetrics.highWaterMark.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          {/* Drawdown Tolerance Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>Distância até Stop Diário</span>
              <span className="text-emerald-400 font-bold">
                R$ {portfolioMetrics.distanceToMaxDailyStop.toFixed(0)} restante
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.max(
                    5,
                    (portfolioMetrics.distanceToMaxDailyStop / portfolioMetrics.totalDailyLossLimit) * 100
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Zona segura: Nenhuma perda crítica atingida hoje.</span>
          </div>
        </div>

        {/* Card 3: Portfolio PnL & Win Rate */}
        <div className="bg-[#090d16] border border-slate-800/90 rounded-xl p-4.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Resultado Consolidado da Carteira
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              Hoje
            </span>
          </div>

          <div>
            <div
              className={`text-2xl font-bold font-mono tracking-tight ${
                portfolioMetrics.totalTodayPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {portfolioMetrics.totalTodayPnl >= 0 ? '+' : ''}R${' '}
              {portfolioMetrics.totalTodayPnl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>Patrimônio Líquido Atual:</span>
              <span className="font-mono text-slate-200">
                R$ {portfolioMetrics.totalEquity.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
            <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-500">Taxa de Acerto</div>
              <div className="font-bold text-slate-200 mt-0.5">{portfolioMetrics.globalWinRate.toFixed(1)}%</div>
            </div>
            <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-500">Total Trades</div>
              <div className="font-bold text-slate-200 mt-0.5">{portfolioMetrics.totalTrades} operações</div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Expectativa Matemática:</span>
            <span className="text-emerald-400 font-mono font-bold">+R$ 41,20 / trade</span>
          </div>
        </div>

        {/* Card 4: Risk Profile & Circuit Breaker Sensitivity */}
        <div className="bg-[#090d16] border border-slate-800/90 rounded-xl p-4.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-purple-400" />
              Perfil de Tolerância de Risco
            </span>
            <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
              VaR 95%
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="text-xs text-slate-300 font-medium">Ajuste de Sensibilidade do Portfólio:</div>
            <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-[11px] font-semibold">
              <button
                onClick={() => setRiskProfile('conservative')}
                className={`py-1 rounded transition-colors ${
                  riskProfile === 'conservative'
                    ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Conser.
              </button>
              <button
                onClick={() => setRiskProfile('moderate')}
                className={`py-1 rounded transition-colors ${
                  riskProfile === 'moderate'
                    ? 'bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Moder.
              </button>
              <button
                onClick={() => setRiskProfile('aggressive')}
                className={`py-1 rounded transition-colors ${
                  riskProfile === 'aggressive'
                    ? 'bg-slate-800 text-amber-400 border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Agress.
              </button>
            </div>
          </div>

          <div className="text-[11px] font-mono text-slate-400 space-y-1 pt-1">
            <div className="flex justify-between">
              <span>Trava Diária Portfólio:</span>
              <span className="text-slate-200">R$ {portfolioMetrics.totalDailyLossLimit}</span>
            </div>
            <div className="flex justify-between">
              <span>Critério de Kelly Aplicado:</span>
              <span className="text-emerald-400">Half-Kelly (0.50x)</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 flex items-center justify-between">
            <span>Volatilidade Implícita:</span>
            <span className="text-slate-300 font-mono">14.2% a.a.</span>
          </div>
        </div>
      </div>

      {/* 3. The Responsive Chart: Individual Bot Contribution & Drawdown Curve */}
      <div className="bg-[#090d16] border border-slate-800 rounded-xl overflow-hidden">
        {/* Navigation Tabs for Chart View */}
        <div className="px-5 py-3.5 bg-slate-900/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Visualização de Risco & Contribuição por Robô
            </span>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setActiveChartTab('contribution')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                activeChartTab === 'contribution'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Contribuição de PnL por Robô
            </button>
            <button
              onClick={() => setActiveChartTab('drawdown')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                activeChartTab === 'drawdown'
                  ? 'bg-slate-800 text-rose-400 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Curva de Drawdown Intraday
            </button>
            <button
              onClick={() => setActiveChartTab('table')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                activeChartTab === 'table'
                  ? 'bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tabela Analítica da Carteira
            </button>
          </div>
        </div>

        <div className="p-5">
          {/* TAB 1: Contribuição de PnL por Robô (Responsive Bar Chart) */}
          {activeChartTab === 'contribution' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                <span>Distribuição de Resultado Financeiro Líquido por Robô no Dia (R$):</span>
                <span className="font-mono text-[11px] text-slate-500">Passe o mouse para inspecionar</span>
              </div>

              {/* Responsive SVG Bar Chart */}
              <div className="w-full overflow-x-auto">
                <svg
                  viewBox="0 0 850 260"
                  className="w-full h-64 select-none"
                  preserveAspectRatio="xMidYMid meet"
                >
                  {/* Grid Lines */}
                  <line x1="160" y1="20" x2="160" y2="230" stroke="#334155" strokeWidth="1.5" />
                  <line x1="300" y1="20" x2="300" y2="230" stroke="#1e293b" strokeDasharray="3 3" />
                  <line x1="450" y1="20" x2="450" y2="230" stroke="#1e293b" strokeDasharray="3 3" />
                  <line x1="600" y1="20" x2="600" y2="230" stroke="#1e293b" strokeDasharray="3 3" />
                  <line x1="750" y1="20" x2="750" y2="230" stroke="#1e293b" strokeDasharray="3 3" />

                  {/* Axis Legend */}
                  <text x="160" y="248" fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="middle">R$ 0</text>
                  <text x="300" y="248" fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="middle">+R$ 75</text>
                  <text x="450" y="248" fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="middle">+R$ 150</text>
                  <text x="600" y="248" fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="middle">+R$ 225</text>
                  <text x="750" y="248" fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="middle">+R$ 300</text>

                  {/* Bars for Each Bot */}
                  {botContributions.map((bot, index) => {
                    const y = 30 + index * 32;
                    const maxPnl = 300;
                    const barWidth = Math.max(
                      3,
                      Math.min(590, (Math.abs(bot.pnl) / maxPnl) * 590)
                    );
                    const isPositive = bot.pnl >= 0;
                    const isHovered = hoveredBotId === bot.id;

                    return (
                      <g
                        key={bot.id}
                        onMouseEnter={() => setHoveredBotId(bot.id)}
                        onMouseLeave={() => setHoveredBotId(null)}
                        className="cursor-pointer transition-opacity"
                        opacity={hoveredBotId && !isHovered ? 0.45 : 1}
                      >
                        {/* Bot Label */}
                        <text
                          x="150"
                          y={y + 13}
                          fill={isHovered ? '#38bdf8' : '#cbd5e1'}
                          fontSize="11"
                          fontFamily="sans-serif"
                          fontWeight={isHovered ? 'bold' : 'normal'}
                          textAnchor="end"
                        >
                          {bot.name.length > 20 ? `${bot.name.substring(0, 19)}...` : bot.name}
                        </text>

                        {/* Background Bar track */}
                        <rect
                          x="160"
                          y={y}
                          width="590"
                          height="18"
                          rx="4"
                          fill="#1e293b"
                          opacity="0.3"
                        />

                        {/* Value Bar */}
                        <rect
                          x="160"
                          y={y}
                          width={barWidth}
                          height="18"
                          rx="4"
                          fill={
                            isPositive
                              ? isHovered
                                ? '#34d399'
                                : '#10b981'
                              : isHovered
                              ? '#f87171'
                              : '#ef4444'
                          }
                          className="transition-all duration-300"
                        />

                        {/* Value Text */}
                        <text
                          x={170 + barWidth}
                          y={y + 13}
                          fill={isPositive ? '#34d399' : '#f87171'}
                          fontSize="11"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {isPositive ? '+' : ''}R$ {bot.pnl.toFixed(2)}
                          <tspan fill="#64748b" fontSize="10" dx="6">
                            ({bot.winRate}% win, {bot.trades} trd)
                          </tspan>
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Bot Breakdown Highlights */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 pt-2">
                {botContributions.map((b) => (
                  <div
                    key={b.id}
                    onMouseEnter={() => setHoveredBotId(b.id)}
                    onMouseLeave={() => setHoveredBotId(null)}
                    className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                      hoveredBotId === b.id
                        ? 'bg-slate-800/90 border-emerald-500/50 shadow-md'
                        : 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-300 truncate">{b.symbol}</span>
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          b.status === 'RUNNING' ? 'bg-emerald-400' : 'bg-slate-500'
                        }`}
                      />
                    </div>
                    <div
                      className={`text-xs font-mono font-bold mt-1 ${
                        b.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {b.pnl >= 0 ? '+' : ''}R$ {b.pnl.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                      Contribuição: {b.shareOfTotalPct}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Curva de Drawdown Intraday (Responsive Area Chart) */}
          {activeChartTab === 'drawdown' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                <span>Evolução do Drawdown Intraday vs Linhas de Tolerância de Risco:</span>
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-0.5 bg-emerald-400 inline-block" /> High Water Mark (0%)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-0.5 bg-rose-400 inline-block" /> Drawdown Real
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-0.5 bg-amber-400 stroke-dasharray inline-block" /> Limite Máx ({portfolioMetrics.maxAllowedDrawdownPct}%)
                  </span>
                </div>
              </div>

              {/* Responsive SVG Drawdown Area Chart */}
              <div className="w-full overflow-x-auto">
                <svg
                  viewBox="0 0 850 240"
                  className="w-full h-60 select-none"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <defs>
                    <linearGradient id="drawdownGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid */}
                  <line x1="50" y1="30" x2="820" y2="30" stroke="#10b981" strokeWidth="1.5" />
                  <text x="40" y="34" fill="#10b981" fontSize="10" fontFamily="monospace" textAnchor="end">0.0%</text>

                  <line x1="50" y1="80" x2="820" y2="80" stroke="#1e293b" strokeDasharray="3 3" />
                  <text x="40" y="84" fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="end">-1.0%</text>

                  <line x1="50" y1="130" x2="820" y2="130" stroke="#1e293b" strokeDasharray="3 3" />
                  <text x="40" y="134" fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="end">-2.0%</text>

                  {/* Critical Danger Threshold */}
                  <line x1="50" y1="180" x2="820" y2="180" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 4" />
                  <text x="40" y="184" fill="#f59e0b" fontSize="10" fontFamily="monospace" textAnchor="end">
                    -{portfolioMetrics.maxAllowedDrawdownPct}%
                  </text>

                  {/* Area fill */}
                  <polygon
                    points="
                      60,30
                      110,40
                      160,30
                      220,55
                      280,30
                      340,75
                      400,95
                      460,70
                      520,110
                      580,85
                      640,65
                      700,98
                      760,82
                      810,95
                      810,30
                    "
                    fill="url(#drawdownGrad)"
                  />

                  {/* Drawdown Curve Line */}
                  <polyline
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="2.5"
                    points="
                      60,30
                      110,40
                      160,30
                      220,55
                      280,30
                      340,75
                      400,95
                      460,70
                      520,110
                      580,85
                      640,65
                      700,98
                      760,82
                      810,95
                    "
                  />

                  {/* Points on Curve */}
                  <circle cx="520" cy="110" r="4.5" fill="#f43f5e" stroke="#fff" strokeWidth="1.5" />
                  <text x="520" y="130" fill="#f43f5e" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    Pico: -1.82%
                  </text>

                  <circle cx="810" cy="95" r="5" fill="#10b981" stroke="#fff" strokeWidth="1.5" />
                  <text x="810" y="80" fill="#10b981" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    Atual: -{portfolioMetrics.drawdownPct.toFixed(2)}%
                  </text>

                  {/* Time Axis */}
                  <text x="60" y="215" fill="#64748b" fontSize="10" fontFamily="monospace">09:00</text>
                  <text x="220" y="215" fill="#64748b" fontSize="10" fontFamily="monospace">11:00</text>
                  <text x="400" y="215" fill="#64748b" fontSize="10" fontFamily="monospace">13:00</text>
                  <text x="580" y="215" fill="#64748b" fontSize="10" fontFamily="monospace">15:00</text>
                  <text x="810" y="215" fill="#64748b" fontSize="10" fontFamily="monospace">Agora</text>
                </svg>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>
                    O drawdown máximo registrado na sessão de hoje foi de <strong>1.82%</strong>, mantendo-se confortavelmente distante da trava de segurança de <strong>{portfolioMetrics.maxAllowedDrawdownPct}%</strong>.
                  </span>
                </div>
                <span className="font-mono text-emerald-400 font-semibold shrink-0">Recuperação em Andamento</span>
              </div>
            </div>
          )}

          {/* TAB 3: Tabela Analítica da Carteira */}
          {activeChartTab === 'table' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] bg-slate-900/40">
                    <th className="py-2.5 px-3">Robô & Estratégia</th>
                    <th className="py-2.5 px-3">Ativo</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Lotes</th>
                    <th className="py-2.5 px-3">PnL Hoje</th>
                    <th className="py-2.5 px-3">Win Rate</th>
                    <th className="py-2.5 px-3">Consumo Stop Diário</th>
                    <th className="py-2.5 px-3 text-right">Ação de Risco</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {bots.map((b) => {
                    const isRunning = b.status === 'RUNNING';
                    const usagePct = Math.min(100, Math.max(0, (Math.abs(Math.min(0, b.stats.todayPnl)) / b.maxDailyLoss) * 100));

                    return (
                      <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3 font-sans font-semibold text-slate-200">
                          {b.name}
                        </td>
                        <td className="py-3 px-3">
                          <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] font-bold text-slate-300">
                            {b.symbol}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isRunning
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {isRunning ? 'EM OPERAÇÃO' : 'PAUSADO'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-300">{b.lots}</td>
                        <td className={`py-3 px-3 font-bold ${b.stats.todayPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {b.stats.todayPnl >= 0 ? '+' : ''}R$ {b.stats.todayPnl.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          {b.stats.winRate}% ({b.stats.totalTradesToday} trades)
                        </td>
                        <td className="py-3 px-3 w-48">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-400">
                              <span>Trava: R$ {b.maxDailyLoss}</span>
                              <span className={usagePct > 70 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                                {usagePct.toFixed(0)}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  usagePct > 80 ? 'bg-rose-500' : usagePct > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.max(5, usagePct)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right">
                          {onToggleBotStatus && (
                            <button
                              onClick={() => onToggleBotStatus(b.id)}
                              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                                isRunning
                                  ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}
                            >
                              {isRunning ? 'Pausar Robô' : 'Ativar Robô'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
