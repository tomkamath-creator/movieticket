import React, { useRef } from 'react';
import type { ViewMode } from '../types';
import {
  Ticket as TicketIcon,
  Layers,
  LayoutGrid,
  List,
  Plus,
  Download,
  Upload,
  BarChart3,
} from 'lucide-react';

interface HeaderProps {
  currentView: ViewMode;
  onViewChange: (mode: ViewMode) => void;
  onOpenAddModal: () => void;
  onOpenStatsModal: () => void;
  onExportVault: () => void;
  onImportVault: (file: File) => void;
  totalTickets: number;
  averageRating: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  onOpenAddModal,
  onOpenStatsModal,
  onExportVault,
  onImportVault,
  totalTickets,
  averageRating,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportVault(file);
      e.target.value = '';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#090b10]/95 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 shadow-[0_0_20px_rgba(245,158,11,0.25)] border border-amber-300/30">
              <TicketIcon className="w-5 h-5 text-slate-950 fill-slate-950 -rotate-12 transform" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white font-sans">
                BucketPass
              </span>
              <p className="text-[11px] text-slate-400 font-medium">
                Personal Cinema Vault
              </p>
            </div>
          </div>

          {/* Three-Way View Mode Switcher */}
          <div className="flex items-center bg-[#131622] p-1 rounded-xl border border-slate-800/80">
            <button
              onClick={() => onViewChange('deck')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                currentView === 'deck'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span className="hidden md:inline">Deck</span>
            </button>

            <button
              onClick={() => onViewChange('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                currentView === 'grid'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden md:inline">Gallery</span>
            </button>

            <button
              onClick={() => onViewChange('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                currentView === 'list'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
              <span className="hidden md:inline">Log</span>
            </button>
          </div>

          {/* Actions: Stats, Backup, Add Ticket */}
          <div className="flex items-center gap-2">
            {totalTickets > 0 && (
              <button
                onClick={onOpenStatsModal}
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 transition-colors"
              >
                <BarChart3 className="w-4 h-4 text-amber-400" />
                <span>
                  <strong className="text-white">{totalTickets}</strong> Stubs
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-amber-400 font-semibold">{averageRating.toFixed(1)}★</span>
              </button>
            )}

            {/* Export Vault */}
            <button
              onClick={onExportVault}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Backup Vault"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Import Vault */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Restore Vault"
            >
              <Upload className="w-4 h-4" />
            </button>

            {/* Add Ticket Button */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all transform active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden sm:inline">Add Ticket</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
