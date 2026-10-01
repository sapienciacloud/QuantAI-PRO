import React from 'react';
import {
  Activity,
  Sliders,
  BarChart3,
  Brain,
  FileCode,
  Server,
  Plus,
  Play,
  Pause,
  AlertOctagon,
  Download,
  ExternalLink,
  Zap,
  CheckCircle2,
  ChevronDown,
  X,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { BotInstance } from '../types/trading';
import { PlatformTab } from './Navbar';

interface SidebarProps {
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
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
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
  isOpenMobile,
  onCloseMobile,
}) => {
  const isRunning = activeBot.status === 'RUNNING';
  const isPaused = activeBot.status === 'PAUSED';

  const navItems = [
    {
      id: 'live' as PlatformTab,
      label: 'Monitor ao Vivo',
      sublabel: 'Gráficos, PnL & Gestão de Risco',
      icon: Activity,
      badge: isSimulating ? 'Simulação Ativa' : isRunning ? 'Ao Vivo' : undefined,
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      id: 'config' as PlatformTab,
      label: 'Configuração do Robô',
      sublabel: 'Lotes, SL/TP, Horários & Trava',
      icon: Sliders,
    },
    {
      id: 'backtest' as PlatformTab,
      label: 'Backtest Studio',
      sublabel: 'Curva de Equity, Drawdown & Trades',
      icon: BarChart3,
    },
    {
      id: 'ai' as PlatformTab,
      label: 'Pipeline de IA',
      sublabel: 'Random Forest, Features & Calibração',
      icon: Brain,
    },
    {
      id: 'code' as PlatformTab,
      label: 'Código Python & IDE',
      sublabel: 'Scripts MT5 & Gerador Dinâmico',
      icon: FileCode,
    },
    {
      id: 'bridge' as PlatformTab,
      label: 'Conexões & APIs',
      sublabel: 'Binance Futures, MT5 & MetaApi',
      icon: Server,
      badge: activeBot.assetKey.includes('USDT') ? 'Binance API' : 'MT5 Local',
      badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 md:z-30 h-screen w-72 bg-[#090d16] border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out shrink-0 select-none ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* 1. Brand Logo Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-mono font-extrabold text-base shadow-lg shadow-emerald-950/40 shrink-0">
              Q5
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-white text-base tracking-tight">QuantAI</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Robôs MT5 & Binance Futures</p>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Active Bot Selector Card (Intuitive & Accessible) */}
        <div className="p-3.5 mx-3.5 mt-3.5 bg-[#0d1322] border border-slate-800/90 rounded-xl space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span className="uppercase tracking-wider text-[10px]">Robô Selecionado:</span>
            <span
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                isRunning
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : isPaused
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : isPaused ? 'bg-amber-400' : 'bg-slate-500'}`} />
              {isRunning ? 'EM OPERAÇÃO' : isPaused ? 'PAUSADO' : 'PARADO'}
            </span>
          </div>

          {/* Bot Select Dropdown */}
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
              className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-100 text-xs font-semibold rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer truncate appearance-none"
            >
              {bots.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.symbol})
                </option>
              ))}
              <option value="__new__">+ Criar Novo Robô...</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>

          {/* Quick Bot Actions (Play/Pause & Panic Close) */}
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              onClick={onToggleBotStatus}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isRunning
                  ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
              }`}
            >
              {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isRunning ? 'Pausar' : 'Iniciar'}</span>
            </button>

            <button
              onClick={onEmergencyCloseAll}
              className="py-1.5 px-2 rounded-lg text-xs font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center justify-center gap-1 transition-colors cursor-pointer"
              title="Zeragem de emergência: liquida posições e pausa o robô imediatamente"
            >
              <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
              <span>Zerar Tudo</span>
            </button>
          </div>
        </div>

        {/* 3. Primary Navigation Menu (Menu Lateral) */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1">
          <div className="px-2 pb-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Menu Principal
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full p-2.5 rounded-xl text-left transition-all flex items-start gap-3 group cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-600/15 via-emerald-600/10 to-transparent border-l-3 border-emerald-500 text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-900 text-slate-400 group-hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-xs font-semibold truncate ${isActive ? 'text-white font-bold' : ''}`}>
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border shrink-0 ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{item.sublabel}</p>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* 4. Quick Shortcuts Section */}
          <div className="pt-4 border-t border-slate-800/80 space-y-2">
            <div className="px-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Atalhos & Conexões
            </div>

            {/* Direct Shortcut to Binance Futures API Management */}
            <a
              href="https://www.binance.com/pt-BR/my/settings/api-management"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-500/5 hover:from-amber-500/20 hover:to-amber-500/10 border border-amber-500/30 text-amber-300 transition-all flex items-center justify-between group shadow-xs cursor-pointer"
              title="Abre a tela de Gerenciamento de API na Binance para criar ou editar chaves"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1 rounded bg-amber-500/20 text-amber-400 shrink-0">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <span className="text-xs font-bold block truncate">Conectar API Binance</span>
                  <span className="text-[10px] text-slate-400 block truncate">Gerenciar Chaves API</span>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-amber-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </a>

            {/* Download Python Zip Button */}
            <button
              onClick={onDownloadZip}
              className="w-full p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all flex items-center justify-between group cursor-pointer"
              title="Baixar pacote completo de scripts Python prontos para rodar no MT5"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1 rounded bg-slate-800 text-slate-400 group-hover:text-emerald-400 transition-colors">
                  <Download className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <span className="text-xs font-semibold block">Baixar Scripts (.zip)</span>
                  <span className="text-[10px] text-slate-500 block">Arquivos do Robô Python</span>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* 5. Bottom Account / Connectivity Status Card */}
        <div className="p-3.5 m-3.5 bg-[#0d1322]/90 border border-slate-800/80 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400 truncate">{activeBot.account.broker}</span>
            <span className="flex items-center gap-1 text-emerald-400 font-bold shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {activeBot.account.pingMs} ms
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60 font-mono">
            <span className="text-slate-500">Saldo:</span>
            <span className="font-bold text-slate-200">
              {activeBot.assetKey.includes('USDT') ? '$' : 'R$'}{' '}
              {activeBot.account.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="text-[10px] text-slate-500 flex items-center justify-between pt-0.5">
            <span>Terminal: {activeBot.account.type}</span>
            <span className="text-slate-400 font-mono">v2.4 QuantAI</span>
          </div>
        </div>
      </aside>
    </>
  );
};
