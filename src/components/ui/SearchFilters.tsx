import React from 'react';
import { motion } from 'framer-motion';
import { Filter, ChevronDown, Grid, List } from 'lucide-react';
import { ViewMode, SortOption } from '@/types';

interface SearchFiltersProps {
  viewMode: ViewMode;
  sortBy: SortOption;
  resultsCount: number;
  onViewModeChange: (mode: ViewMode) => void;
  onSortChange: (sort: SortOption) => void;
}

export default function SearchFilters({
  viewMode,
  sortBy,
  resultsCount,
  onViewModeChange,
  onSortChange
}: SearchFiltersProps) {
  return (
    <motion.section 
      className="sticky top-16 z-30 bg-black/95 backdrop-blur-xl border-b border-green-500/20 py-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Filter Dropdown */}
            <motion.div className="relative">
              <motion.button
                className="flex items-center gap-2 bg-black/50 border border-green-500/30 rounded-xl px-4 py-2 text-gray-300 hover:text-white hover:border-green-500/60 transition-all duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Filter className="w-4 h-4" />
                <span>All Categories</span>
                <ChevronDown className="w-4 h-4" />
              </motion.button>
            </motion.div>

            {/* Sort Dropdown */}
            <motion.div className="relative">
              <motion.select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value as SortOption)}
                className="bg-black/50 border border-green-500/30 rounded-xl px-4 py-2 text-gray-300 hover:border-green-500/60 transition-all duration-300 cursor-pointer focus:outline-none focus:border-green-500"
                whileHover={{ scale: 1.02 }}
              >
                <option value="relevance">Sort by Relevance</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="recent">Recently Listed</option>
                <option value="volume">Volume</option>
              </motion.select>
            </motion.div>

            {/* Results Count */}
            <motion.div 
              className="text-gray-400 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key={resultsCount}
            >
              {resultsCount > 0 ? `${resultsCount} results found` : 'No results'}
            </motion.div>
          </div>

          {/* View Toggle */}
          <motion.div 
            className="flex items-center gap-2 bg-black/50 border border-green-500/30 rounded-xl p-1"
            layout
          >
            <motion.button
              onClick={() => onViewModeChange('grid')}
              className={`p-2 rounded-lg transition-all duration-300 ${
                viewMode === 'grid' 
                  ? 'bg-green-500 text-black' 
                  : 'text-gray-400 hover:text-white'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              layout
            >
              <Grid className="w-4 h-4" />
            </motion.button>
            <motion.button
              onClick={() => onViewModeChange('list')}
              className={`p-2 rounded-lg transition-all duration-300 ${
                viewMode === 'list' 
                  ? 'bg-green-500 text-black' 
                  : 'text-gray-400 hover:text-white'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              layout
            >
              <List className="w-4 h-4" />
            </motion.button>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}