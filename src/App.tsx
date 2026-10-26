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
import { Film, Plus, Ticket as TicketIcon } from 'lucide-react';

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
        console.error('Failed to init database:', err);
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
        alert(`Successfully imported ${res.count} tickets into your vault.`);
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
        {tickets.length > 0 && (
          <SearchBar
            filters={filters}
            onChange={setFilters}
            availableYears={availableYears}
          />
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3">
            <Film className="w-8 h-8 text-amber-500 animate-spin" />
            <p className="text-xs font-semibold text-slate-400">Loading vault...</p>
          </div>
        ) : tickets.length === 0 ? (
          /* Clean, pristine empty vault screen */
          <div className="py-20 max-w-lg mx-auto text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-[#121520] border border-amber-500/25 flex items-center justify-center mx-auto text-amber-400 shadow-2xl">
              <TicketIcon className="w-10 h-10 -rotate-12 transform" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Your Vault is Empty</h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Add your tickets from BookMyShow, PVR INOX, AMC, or Fandango to build your personal cinema archive.
              </p>
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all transform active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Your First Ticket</span>
            </button>
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
      {tickets.length > 0 && (
        <div className="fixed bottom-6 right-6 z-30 sm:hidden">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-13 h-13 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-2xl active:scale-95"
            title="Add Movie Ticket"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* Clean Luxury Footer */}
      <footer className="w-full border-t border-slate-900 bg-[#06070a] py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <span className="font-bold text-slate-400">BucketPass</span>
          <span className="text-slate-500 text-[11px]">Personal Cinema Vault &amp; Diary</span>
        </div>
      </footer>

      {/* Modals */}
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

      <AddTicketModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSaveTicket={handleSaveTicket}
      />

      {editingTicket && (
        <EditTicketModal
          ticket={editingTicket}
          isOpen={!!editingTicket}
          onClose={() => setEditingTicket(null)}
          onSave={handleUpdateTicket}
        />
      )}

      <StatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        tickets={tickets}
      />
    </div>
  );
};

export default App;
