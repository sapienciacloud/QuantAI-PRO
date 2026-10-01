import React from 'react';
import { Download, Activity, BarChart3, Brain, FileCode, Sliders, Server, Plus, Play, Pause, AlertOctagon } from 'lucide-react';
import { BotInstance } from '../types/trading';

export type PlatformTab = 'live' | 'config' | 'backtest' | 'ai' | 'code' | 'bridge';

interface NavbarProps {
  activeTab: PlatformTab;
  setActiveTab: (tab: PlatformTab) => void;
  bots: BotInstance[];
  activeBot: BotInstance;
  onSelectBot: (botId: string) => void;
  onCreateBot: () => void;
  onToggleBotStatus: () => void;
  onEmergencyCloseAll: () => void;
  onDownloadZip: () => void;
  isSimulating: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  bots,
  activeBot,
  onSelectBot,
  onCreateBot,
  onToggleBotStatus,
  onEmergencyCloseAll,
  onDownloadZip,
  isSimulating,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0a0e17]/95 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Zone 1: Single text element wordmark + Active Bot Selector */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-sm shrink-0">
            Q5
          </div>

          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-white hidden sm:inline">
              QuantAI
            </span>

            {/* Bot Selector Dropdown */}
            <div className="relative">
              <select
                value={activeBot.id}
                onChange={(e) => {
                  if (e.target.value === '__new__') {
                    onCreateBot();
                  } else {
                    onSelectBot(e.target.value);
                  }
                }}
                className="bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-100 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer max-w-[200px] truncate"
              >
                {bots.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.symbol})
                  </option>
                ))}
                <option value="__new__">+ Criar Novo Robô...</option>
              </select>
            </div>

            {/* Bot Status Indicator */}
            <button
              onClick={onToggleBotStatus}
              title={activeBot.status === 'RUNNING' ? 'Clique para pausar o robô' : 'Clique para iniciar o robô'}
              className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all ${
                activeBot.status === 'RUNNING'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                  : activeBot.status === 'PAUSED'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${activeBot.status === 'RUNNING' ? 'bg-emerald-400 animate-pulse' : activeBot.status === 'PAUSED' ? 'bg-amber-400' : 'bg-slate-400'}`} />
              <span className="hidden md:inline">{activeBot.status === 'RUNNING' ? 'Em Execução' : activeBot.status === 'PAUSED' ? 'Pausado' : 'Parado'}</span>
            </button>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800 overflow-x-auto select-none">
          <button
            onClick={() => setActiveTab('live')}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'live'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Painel ao Vivo</span>
            <span className="lg:hidden">Ao Vivo</span>
            {isSimulating && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'config'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Modificar Robô</span>
            <span className="lg:hidden">Config</span>
          </button>

          <button
            onClick={() => setActiveTab('backtest')}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'backtest'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Backtesting</span>
            <span className="lg:hidden">Backtest</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'ai'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Pipeline de IA</span>
            <span className="lg:hidden">IA</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'code'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Editor Python</span>
            <span className="lg:hidden">Código</span>
          </button>

          <button
            onClick={() => setActiveTab('bridge')}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'bridge'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Ponte MT5</span>
            <span className="lg:hidden">MT5</span>
          </button>
        </nav>

        {/* Zone 3: Primary Actions (Emergency Close & Export ZIP) */}
        <div className="flex items-center gap-2">
          {/* Emergency Panic Button */}
          <button
            onClick={onEmergencyCloseAll}
            className="px-2.5 py-1.5 text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 rounded-lg transition-colors flex items-center gap-1.5"
            title="Fecha imediatamente todas as posições a mercado e cancela ordens"
          >
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden xl:inline">Fechar Tudo (Pânico)</span>
          </button>

          {/* Quick ZIP Export */}
          <button
            onClick={onDownloadZip}
            className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm shadow-emerald-950 shrink-0"
            title="Baixar projeto Python deste robô (.zip)"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Baixar (.zip)</span>
          </button>
        </div>
      </div>
    </header>
  );
};
