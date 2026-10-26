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
  Film,
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
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#090b10]/90 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 shadow-[0_0_20px_rgba(245,158,11,0.35)] border border-amber-300/40">
              <TicketIcon className="w-6 h-6 text-slate-950 fill-slate-950 -rotate-12 transform" />
              <Film className="w-3.5 h-3.5 text-amber-200 absolute -bottom-1 -right-1" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-white font-sans bg-clip-text text-transparent bg-gradient-to-r from-white via-amber-100 to-amber-400">
                  BucketPass
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  Vault &amp; Diary
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Permanent 100% Free Personal Cinema Diary
              </p>
            </div>
          </div>

          {/* Three-Way View Mode Switcher */}
          <div className="flex items-center bg-[#131622] p-1 rounded-xl border border-slate-800/80 shadow-inner">
            <button
              onClick={() => onViewChange('deck')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                currentView === 'deck'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-[0_2px_10px_rgba(245,158,11,0.3)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
              title="Swipe Deck: Browse collectible cards one by one"
            >
              <Layers className="w-4 h-4" />
              <span className="hidden md:inline">Swipe Deck</span>
            </button>

            <button
              onClick={() => onViewChange('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                currentView === 'grid'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-[0_2px_10px_rgba(245,158,11,0.3)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
              title="Grid Gallery: Visual wall of ticket stubs"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden md:inline">Grid Gallery</span>
            </button>

            <button
              onClick={() => onViewChange('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                currentView === 'list'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-[0_2px_10px_rgba(245,158,11,0.3)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
              title="List View: Compact movie log"
            >
              <List className="w-4 h-4" />
              <span className="hidden md:inline">List View</span>
            </button>
          </div>

          {/* Action CTAs: Add Ticket, Stats, Backup */}
          <div className="flex items-center gap-2">
            {/* Quick Stats Pill */}
            <button
              onClick={onOpenStatsModal}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 transition-colors"
              title="View Cinema Statistics"
            >
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <span>
                <strong className="text-white">{totalTickets}</strong> Tickets
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-amber-400 font-semibold">{averageRating.toFixed(1)}★</span>
            </button>

            {/* Export Vault */}
            <button
              onClick={onExportVault}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Export Vault (JSON backup)"
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
              title="Import Vault backup"
            >
              <Upload className="w-4 h-4" />
            </button>

            {/* Add Ticket Button */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
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
