import React from 'react';
import {
  Menu,
  Activity,
  Sliders,
  BarChart3,
  Brain,
  FileCode,
  Server,
  AlertOctagon,
  Download,
  Zap,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { BotInstance } from '../types/trading';
import { PlatformTab } from './Navbar';

interface TopHeaderProps {
  activeTab: PlatformTab;
  activeBot: BotInstance;
  onOpenMobile: () => void;
  onEmergencyCloseAll: () => void;
  onDownloadZip: () => void;
  isSimulating: boolean;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeTab,
  activeBot,
  onOpenMobile,
  onEmergencyCloseAll,
  onDownloadZip,
  isSimulating,
}) => {
  const tabTitles: Record<PlatformTab, { title: string; subtitle: string; icon: any }> = {
    live: {
      title: 'Monitor ao Vivo & Telemetria',
      subtitle: 'Gráfico em tempo real, posições abertas e gestão de risco quantitativo',
      icon: Activity,
    },
    config: {
      title: 'Configurações do Robô',
      subtitle: 'Parâmetros de execução, stop loss, take profit, metas diárias e horários',
      icon: Sliders,
    },
    backtest: {
      title: 'Backtest Studio',
      subtitle: 'Validação histórica estatística, curva de equity e métricas de performance',
      icon: BarChart3,
    },
    ai: {
      title: 'Pipeline de Inteligência Artificial',
      subtitle: 'Engenharia de features, importância de atributos e calibração de modelos',
      icon: Brain,
    },
    code: {
      title: 'Código Python & IDE',
      subtitle: 'Scripts modulares para MetaTrader 5 e conector Binance prontos para execução',
      icon: FileCode,
    },
    bridge: {
      title: 'Conexões & APIs Online',
      subtitle: 'Conexão com a API da Binance Futures, MetaApi Cloud e terminais MT5',
      icon: Server,
    },
  };

  const currentTabInfo = tabTitles[activeTab] || tabTitles.live;
  const TabIcon = currentTabInfo.icon;
  const isRunning = activeBot.status === 'RUNNING';

  return (
    <header className="sticky top-0 z-20 bg-[#0a0e17]/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3 flex items-center justify-between gap-4">
      {/* Left: Mobile Menu Trigger + Section Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white md:hidden transition-colors"
          title="Abrir Menu Lateral"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-emerald-400 hidden sm:flex items-center justify-center shrink-0">
            <TabIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                {currentTabInfo.title}
              </h1>
              {activeTab === 'live' && isSimulating && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  SIMULAÇÃO ATIVA
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 hidden sm:block truncate max-w-md">
              {currentTabInfo.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Right: Active Bot Context Badge & Emergency Panic Action */}
      <div className="flex items-center gap-2.5">
        {/* Active Bot Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono">
          <span className="text-slate-400">Robô:</span>
          <span className="font-bold text-slate-200">{activeBot.name}</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-emerald-400 font-bold">
            {activeBot.symbol}
          </span>
        </div>

        {/* Binance Quick Link if crypto asset */}
        {activeBot.assetKey.includes('USDT') && (
          <a
            href="https://www.binance.com/pt-BR/my/settings/api-management"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors shadow-xs"
            title="Abrir Gerenciamento de API na Binance em nova aba"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">API Binance</span>
            <ExternalLink className="w-3 h-3 text-amber-400" />
          </a>
        )}

        {/* Download Zip Shortcut */}
        <button
          onClick={onDownloadZip}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
          title="Baixar arquivos Python do robô"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Baixar Código</span>
        </button>

        {/* Emergency Panic Stop */}
        <button
          onClick={onEmergencyCloseAll}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600/15 hover:bg-rose-600/25 text-rose-300 border border-rose-600/30 flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Zerar todas as posições abertas imediatamente"
        >
          <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
          <span className="hidden sm:inline">Zeragem Pânico</span>
          <span className="sm:hidden">Pânico</span>
        </button>
      </div>
    </header>
  );
};
