import React from 'react';
import type { FilterOptions } from '../types';
import { Search, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

interface SearchBarProps {
  filters: FilterOptions;
  onChange: (filters: FilterOptions) => void;
  availableYears: string[];
}

export const SearchBar: React.FC<SearchBarProps> = ({
  filters,
  onChange,
  availableYears,
}) => {
  const formats = ['all', 'IMAX', 'Dolby Cinema', '4DX', '3D', '2D'];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, searchQuery: e.target.value });
  };

  const handleFormatChange = (fmt: string) => {
    onChange({ ...filters, format: fmt });
  };

  const handleRatingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, minRating: parseFloat(e.target.value) });
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, year: e.target.value });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      ...filters,
      sortBy: e.target.value as FilterOptions['sortBy'],
    });
  };

  const resetFilters = () => {
    onChange({
      searchQuery: '',
      format: 'all',
      minRating: 0,
      year: 'all',
      sortBy: 'date-desc',
    });
  };

  const isFiltered =
    filters.searchQuery !== '' ||
    filters.format !== 'all' ||
    filters.minRating > 0 ||
    filters.year !== 'all';

  return (
    <div className="w-full space-y-3">
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search Input Box */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={handleSearchChange}
            placeholder="Search movie title, cinema, director, format..."
            className="w-full pl-10 pr-9 py-2.5 bg-[#121520] border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/50 transition-all"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onChange({ ...filters, searchQuery: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {/* Min Rating Dropdown */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-[#121520] border border-slate-800 rounded-xl text-xs text-slate-300">
            <span className="text-amber-400 font-bold">★</span>
            <select
              value={filters.minRating}
              onChange={handleRatingChange}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="0" className="bg-[#121520]">All Stars</option>
              <option value="4.5" className="bg-[#121520]">4.5+ Stars</option>
              <option value="4" className="bg-[#121520]">4.0+ Stars</option>
              <option value="3" className="bg-[#121520]">3.0+ Stars</option>
            </select>
          </div>

          {/* Year Filter */}
          {availableYears.length > 0 && (
            <div className="flex items-center gap-1 px-3 py-2 bg-[#121520] border border-slate-800 rounded-xl text-xs text-slate-300">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filters.year}
                onChange={handleYearChange}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-[#121520]">All Years</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={yr} className="bg-[#121520]">{yr}</option>
                ))}
              </select>
            </div>
          )}

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-[#121520] border border-slate-800 rounded-xl text-xs text-slate-300">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filters.sortBy}
              onChange={handleSortChange}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="date-desc" className="bg-[#121520]">Newest First</option>
              <option value="date-asc" className="bg-[#121520]">Oldest First</option>
              <option value="rating-desc" className="bg-[#121520]">Highest Rated</option>
              <option value="title-asc" className="bg-[#121520]">Title (A-Z)</option>
            </select>
          </div>

          {/* Reset Filters button */}
          {isFiltered && (
            <button
              onClick={resetFilters}
              className="px-2.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs text-amber-400 flex items-center gap-1 transition-colors whitespace-nowrap"
            >
              <X className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Format Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {formats.map((fmt) => {
          const isActive = filters.format === fmt;
          return (
            <button
              key={fmt}
              onClick={() => handleFormatChange(fmt)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                  : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {fmt === 'all' ? 'All Formats' : fmt}
            </button>
          );
        })}
      </div>
    </div>
  );
};
