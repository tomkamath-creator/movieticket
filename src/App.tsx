import React, { useState, useEffect, useMemo } from 'react';
import type { Ticket, ViewMode, FilterOptions } from './types';
import {
  initDatabase,
  getTickets,
  saveTicket,
  updateTicket,
  deleteTicket,
  exportVault,
  importVault,
} from './db';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { DeckView } from './components/views/DeckView';
import { GridView } from './components/views/GridView';
import { ListView } from './components/views/ListView';
import { TicketInspectorModal } from './components/modals/TicketInspectorModal';
import { AddTicketModal } from './components/modals/AddTicketModal';
import { EditTicketModal } from './components/modals/EditTicketModal';
import { StatsModal } from './components/modals/StatsModal';
import { Film, ShieldCheck, HardDrive, Plus } from 'lucide-react';

export const App: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  // View Mode: 'deck' | 'grid' | 'list'
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('bucketpass_view_mode') as ViewMode) || 'deck';
  });

  // Filters & Search
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: '',
    format: 'all',
    minRating: 0,
    year: 'all',
    sortBy: 'date-desc',
  });

  // Modals state
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);

  // Initialize DB on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const loaded = await initDatabase();
        setTickets(loaded);
      } catch (err) {
        console.error('Failed to init IndexedDB:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Persist view mode preference
  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('bucketpass_view_mode', mode);
  };

  // Add Ticket
  const handleSaveTicket = async (newTicket: Ticket) => {
    await saveTicket(newTicket);
    setTickets((prev) => [newTicket, ...prev]);
  };

  // Update Ticket (e.g. from diary auto-save or edit modal)
  const handleUpdateTicket = async (id: string, updates: Partial<Ticket>) => {
    await updateTicket(id, updates);
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t))
    );
    if (selectedTicket && selectedTicket.id === id) {
      setSelectedTicket((prev) => (prev ? { ...prev, ...updates } : null));
    }
  };

  // Delete Ticket
  const handleDeleteTicket = async (id: string) => {
    await deleteTicket(id);
    setTickets((prev) => prev.filter((t) => t.id !== id));
    if (selectedTicket && selectedTicket.id === id) {
      setSelectedTicket(null);
    }
  };

  // Export Vault Backup
  const handleExportVault = async () => {
    const jsonStr = await exportVault();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bucketpass_vault_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import Vault Backup
  const handleImportVault = async (file: File) => {
    try {
      const text = await file.text();
      const res = await importVault(text);
      if (res.success) {
        const refreshed = await getTickets();
        setTickets(refreshed);
        alert(`Successfully imported ${res.count} tickets into your vault!`);
      } else {
        alert(`Failed to import vault: ${res.error}`);
      }
    } catch (err) {
      console.error('Import error:', err);
      alert('Error reading import file.');
    }
  };

  // Available Years
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    tickets.forEach((t) => {
      if (t.year) years.add(t.year);
      else if (t.dateWatched) years.add(t.dateWatched.split('-')[0]);
    });
    return Array.from(years).sort().reverse();
  }, [tickets]);

  // Filtered & Sorted Tickets
  const filteredTickets = useMemo(() => {
    let result = [...tickets];

    // Search query
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.cinema.toLowerCase().includes(q) ||
          (t.director && t.director.toLowerCase().includes(q)) ||
          t.format.toLowerCase().includes(q) ||
          (t.review && t.review.toLowerCase().includes(q)) ||
          (t.companions && t.companions.toLowerCase().includes(q))
      );
    }

    // Format filter
    if (filters.format !== 'all') {
      result = result.filter((t) => t.format === filters.format);
    }

    // Min Rating filter
    if (filters.minRating > 0) {
      result = result.filter((t) => t.rating >= filters.minRating);
    }

    // Year filter
    if (filters.year !== 'all') {
      result = result.filter((t) => {
        const tYear = t.year || t.dateWatched.split('-')[0];
        return tYear === filters.year;
      });
    }

    // Sorting
    result.sort((a, b) => {
      switch (filters.sortBy) {
        case 'date-desc':
          return (b.dateWatched || '').localeCompare(a.dateWatched || '');
        case 'date-asc':
          return (a.dateWatched || '').localeCompare(b.dateWatched || '');
        case 'rating-desc':
          return (b.rating || 0) - (a.rating || 0);
        case 'title-asc':
          return (a.title || '').localeCompare(b.title || '');
        default:
          return 0;
      }
    });

    return result;
  }, [tickets, filters]);

  // Stats calculation
  const averageRating = useMemo(() => {
    if (tickets.length === 0) return 0;
    return tickets.reduce((acc, t) => acc + (t.rating || 0), 0) / tickets.length;
  }, [tickets]);

  return (
    <div className="min-h-screen bg-[#08090d] text-slate-200 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Header with View Toggle & CTAs */}
      <Header
        currentView={viewMode}
        onViewChange={handleViewChange}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenStatsModal={() => setIsStatsModalOpen(true)}
        onExportVault={handleExportVault}
        onImportVault={handleImportVault}
        totalTickets={tickets.length}
        averageRating={averageRating}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Search & Filter Bar */}
        <SearchBar
          filters={filters}
          onChange={setFilters}
          availableYears={availableYears}
        />

        {/* Loading Spinner */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3">
            <Film className="w-10 h-10 text-amber-500 animate-spin" />
            <p className="text-sm font-semibold text-slate-400">Loading your cinema vault...</p>
          </div>
        ) : (
          <>
            {/* View Switching */}
            {viewMode === 'deck' && (
              <DeckView
                tickets={filteredTickets}
                onSelectTicket={(t) => setSelectedTicket(t)}
              />
            )}

            {viewMode === 'grid' && (
              <GridView
                tickets={filteredTickets}
                onSelectTicket={(t) => setSelectedTicket(t)}
              />
            )}

            {viewMode === 'list' && (
              <ListView
                tickets={filteredTickets}
                onSelectTicket={(t) => setSelectedTicket(t)}
              />
            )}
          </>
        )}
      </main>

      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-6 right-6 z-30 sm:hidden">
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.5)] active:scale-95"
          title="Add Movie Ticket"
        >
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </button>
      </div>

      {/* Sleek Cinema Dark Footer */}
      <footer className="w-full border-t border-slate-900 bg-[#06070a] py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">BucketPass</span>
            <span>·</span>
            <span>The 100% Free Personal Cinema Vault</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-slate-400">
              <HardDrive className="w-3.5 h-3.5 text-amber-400" />
              <span>Zero-cost local browser storage</span>
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% Private</span>
            </span>
          </div>
        </div>
      </footer>

      {/* ================= MODALS ================= */}

      {/* 1. Pop-Open Inspection & Cinema Diary Modal */}
      {selectedTicket && (
        <TicketInspectorModal
          ticket={selectedTicket}
          isOpen={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdateTicket={handleUpdateTicket}
          onDeleteTicket={handleDeleteTicket}
          onOpenEditModal={(t) => setEditingTicket(t)}
        />
      )}

      {/* 2. Add Ticket Wizard (OCR + Lookup) Modal */}
      <AddTicketModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSaveTicket={handleSaveTicket}
      />

      {/* 3. Edit Ticket Details Modal */}
      {editingTicket && (
        <EditTicketModal
          ticket={editingTicket}
          isOpen={!!editingTicket}
          onClose={() => setEditingTicket(null)}
          onSave={handleUpdateTicket}
        />
      )}

      {/* 4. Vault Statistics Modal */}
      <StatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        tickets={tickets}
      />
    </div>
  );
};

export default App;
