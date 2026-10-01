import React, { useState, useEffect } from 'react';
import { Copy, Check, Download, FileCode, Terminal, FolderArchive, Edit3, Eye, RotateCcw, Save, CheckCircle2 } from 'lucide-react';
import { PYTHON_PROJECT_FILES, PythonFileItem } from '../data/pythonFiles';
import { BotInstance } from '../types/trading';

interface CodeExplorerProps {
  bot: BotInstance;
  onDownloadZip: () => void;
  customFiles: Record<string, string>;
  onSaveCustomFile: (filename: string, content: string) => void;
  onResetCustomFiles: () => void;
}

export function generateDynamicConfigPy(bot: BotInstance): string {
  return `"""
Módulo de Configuração Gerado Automaticamente pela Plataforma QuantAI MT5
Robô: ${bot.name} (ID: ${bot.id})
Símbolo: ${bot.symbol} (${bot.assetKey})
Timeframe: ${bot.timeframe}
"""
import os
import MetaTrader5 as mt5

# ==========================================
# 1. PARÂMETROS DE CONEXÃO COM O METATRADER 5
# ==========================================
MT5_LOGIN = ${bot.account.login ? `${bot.account.login}` : 'None'}
MT5_PASSWORD = os.getenv("MT5_PASSWORD", "") or None
MT5_SERVER = "${bot.account.server}"
MT5_PATH = os.getenv("MT5_PATH", "") or None

# ==========================================
# 2. DEFINIÇÃO DO ATIVO E TIMEFRAME
# ==========================================
SYMBOL = "${bot.symbol}"
TIMEFRAME = mt5.TIMEFRAME_${bot.timeframe}
TIMEFRAME_SECONDS = ${bot.timeframe === 'M1' ? 60 : bot.timeframe === 'M5' ? 300 : bot.timeframe === 'M15' ? 900 : 3600}

HISTORICAL_BARS_TRAIN = 5000
HISTORICAL_BARS_INFERENCE = 120

# ==========================================
# 3. GESTÃO DE RISCO E EXECUÇÃO DE ORDENS
# ==========================================
MAGIC_NUMBER = ${bot.magicNumber}
SLIPPAGE = 5

RISK_PROFILES = {
    "${bot.assetKey}": {
        "LOTS": ${bot.lots},
        "STOP_LOSS_POINTS": ${bot.stopLossPoints},
        "TAKE_PROFIT_POINTS": ${bot.takeProfitPoints},
        "TRAILING_STOP_POINTS": ${bot.trailingStopPoints},
    },
    "DEFAULT": {
        "LOTS": ${bot.lots},
        "STOP_LOSS_POINTS": ${bot.stopLossPoints},
        "TAKE_PROFIT_POINTS": ${bot.takeProfitPoints},
        "TRAILING_STOP_POINTS": ${bot.trailingStopPoints},
    }
}

# ==========================================
# 4. GESTÃO DIÁRIA DE CAPITAL (CIRCUIT BREAKER)
# ==========================================
MAX_DAILY_LOSS = ${bot.maxDailyLoss}.0
DAILY_PROFIT_GOAL = ${bot.dailyProfitGoal}.0

START_HOUR = "${bot.startHour}"
END_HOUR = "${bot.endHour}"
CLOSE_ALL_HOUR = "${bot.closeAllHour}"

# ==========================================
# 5. PARÂMETROS DO MODELO DE MACHINE LEARNING
# ==========================================
AI_ALGORITHM = "${bot.aiAlgorithm}"
CONFIDENCE_THRESHOLD = ${bot.confidenceThreshold}
MODEL_PATH = "model_${bot.id}.joblib"
`;
}

export const CodeExplorer: React.FC<CodeExplorerProps> = ({
  bot,
  onDownloadZip,
  customFiles,
  onSaveCustomFile,
  onResetCustomFiles,
}) => {
  const [selectedFilename, setSelectedFilename] = useState<string>('config.py');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editContent, setEditContent] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<boolean>(false);

  // Get current file content (custom if exists, or dynamically generated for config.py, or base)
  const getFileContent = (filename: string): string => {
    if (customFiles[filename]) {
      return customFiles[filename];
    }
    if (filename === 'config.py') {
      return generateDynamicConfigPy(bot);
    }
    const found = PYTHON_PROJECT_FILES.find((f) => f.filename === filename);
    return found ? found.content : '';
  };

  const currentContent = getFileContent(selectedFilename);

  useEffect(() => {
    setEditContent(currentContent);
  }, [selectedFilename, currentContent]);

  const handleCopy = () => {
    navigator.clipboard.writeText(isEditing ? editContent : currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveCode = () => {
    onSaveCustomFile(selectedFilename, editContent);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  const activeMeta = PYTHON_PROJECT_FILES.find((f) => f.filename === selectedFilename) || {
    filename: selectedFilename,
    title: selectedFilename,
    description: 'Arquivo de código Python',
  };

  const lineCount = (isEditing ? editContent : currentContent).split('\n').length;
  const isCustomized = Boolean(customFiles[selectedFilename]);

  return (
    <div className="space-y-6">
      {/* Header with Quick Actions */}
      <div className="bg-[#0d131f] border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FileCode className="w-5 h-5 text-emerald-400" />
            Editor & Explorador de Código Python: {bot.name}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Altere o código Python diretamente na plataforma ou baixe o pacote pronto para executar
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {saveToast && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
              <CheckCircle2 className="w-4 h-4" /> Código do robô salvo!
            </div>
          )}

          {/* Toggle View / Edit */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border flex items-center gap-1.5 transition-colors ${
              isEditing
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            {isEditing ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
            {isEditing ? 'Modo Visualização' : 'Modo Edição'}
          </button>

          {isEditing && (
            <button
              onClick={handleSaveCode}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-colors"
            >
              <Save className="w-3.5 h-3.5" /> Salvar Código
            </button>
          )}

          {isCustomized && (
            <button
              onClick={onResetCustomFiles}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 flex items-center gap-1"
              title="Restaurar código original"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Restaurar
            </button>
          )}

          <button
            onClick={handleCopy}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copiado!' : 'Copiar'}
          </button>

          <button
            onClick={onDownloadZip}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 transition-colors shadow-sm"
          >
            <FolderArchive className="w-3.5 h-3.5" />
            Baixar (.zip)
          </button>
        </div>
      </div>

      {/* Main Code Editor / Browser */}
      <div className="bg-[#0d131f] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        {/* File Tabs Bar */}
        <div className="flex items-center gap-1 bg-[#0a0e17] px-3 pt-2.5 border-b border-slate-800 overflow-x-auto select-none">
          {PYTHON_PROJECT_FILES.map((file) => {
            const isSelected = selectedFilename === file.filename;
            const fileModified = Boolean(customFiles[file.filename]);

            return (
              <button
                key={file.filename}
                onClick={() => {
                  setSelectedFilename(file.filename);
                  setCopied(false);
                }}
                className={`px-3 py-2 text-xs font-mono font-medium rounded-t-lg transition-colors border-t border-l border-r flex items-center gap-2 shrink-0 ${
                  isSelected
                    ? 'bg-[#0d131f] text-emerald-400 border-slate-800 border-b-transparent shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/60'
                }`}
              >
                <FileCode className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                {file.filename}
                {fileModified && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Modificado" />}
              </button>
            );
          })}
        </div>

        {/* File Meta Information */}
        <div className="px-5 py-2.5 bg-slate-900/40 border-b border-slate-800/80 flex items-center justify-between text-xs">
          <div>
            <span className="font-semibold text-slate-200">{activeMeta.title}</span>
            <span className="text-slate-500 ml-2 font-normal hidden sm:inline">· {activeMeta.description}</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
            {isCustomized && <span className="text-amber-400">(Código Personalizado)</span>}
            <span>{lineCount} linhas</span>
          </div>
        </div>

        {/* Code Content or Textarea Editor */}
        {isEditing ? (
          <div className="p-4 bg-[#080c14]">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full h-[540px] bg-transparent text-emerald-300 font-mono text-xs focus:outline-none resize-none leading-relaxed"
              spellCheck={false}
            />
          </div>
        ) : (
          <div className="p-4 overflow-x-auto font-mono text-xs bg-[#0b0f17] max-h-[580px] overflow-y-auto leading-relaxed">
            <table className="w-full border-collapse">
              <tbody>
                {currentContent.split('\n').map((line, index) => (
                  <tr key={index} className="hover:bg-slate-800/30">
                    <td className="text-right pr-4 text-slate-600 select-none w-10 text-[11px] align-top">
                      {index + 1}
                    </td>
                    <td className="text-slate-200 whitespace-pre align-top">
                      {renderHighlightedCode(line)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Terminal Quickstart Guide */}
      <div className="bg-[#0d131f] border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-xs font-semibold text-slate-300 uppercase tracking-wider">
          <Terminal className="w-4 h-4 text-emerald-400" />
          Como Executar os Arquivos no MetaTrader 5
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs">
          <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800 space-y-2">
            <div className="text-slate-200 font-semibold flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[11px] font-mono text-emerald-400">1</span>
              Instalar Dependências
            </div>
            <pre className="p-2 bg-[#090d14] rounded border border-slate-800 text-[11px] font-mono text-emerald-300 select-all overflow-x-auto">
              pip install -r requirements.txt
            </pre>
          </div>

          <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800 space-y-2">
            <div className="text-slate-200 font-semibold flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[11px] font-mono text-emerald-400">2</span>
              Validar no Backtest
            </div>
            <pre className="p-2 bg-[#090d14] rounded border border-slate-800 text-[11px] font-mono text-emerald-300 select-all overflow-x-auto">
              python backtest.py
            </pre>
          </div>

          <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800 space-y-2">
            <div className="text-slate-200 font-semibold flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[11px] font-mono text-emerald-400">3</span>
              Iniciar o Robô
            </div>
            <pre className="p-2 bg-[#090d14] rounded border border-slate-800 text-[11px] font-mono text-emerald-300 select-all overflow-x-auto">
              python main_bot.py
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

function renderHighlightedCode(line: string) {
  const trimmed = line.trim();
  if (trimmed.startsWith('#')) {
    return <span className="text-slate-500 italic">{line}</span>;
  }
  if (trimmed.startsWith('"""') || trimmed.startsWith("'''")) {
    return <span className="text-emerald-500/80 italic">{line}</span>;
  }
  if (line.includes('def ') || line.includes('class ')) {
    return <span className="text-cyan-300 font-semibold">{line}</span>;
  }
  if (line.includes('import ') || line.includes('from ')) {
    return <span className="text-purple-300">{line}</span>;
  }
  if (line.includes('return ') || line.includes('if ') || line.includes('elif ') || line.includes('else:')) {
    return <span className="text-amber-200">{line}</span>;
  }
  return <span>{line}</span>;
}
