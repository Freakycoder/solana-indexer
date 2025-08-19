import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, AlertCircle, X, TrendingUp, Loader2 } from 'lucide-react';
import NFTCard from './NFTCard';
import { NFTResult, ViewMode } from '@/types';

interface NFTGridProps {
  searchResults: NFTResult[];
  isSearching: boolean;
  searchError: string | null;
  viewMode: ViewMode;
  hasMore: boolean;
  hoveredCard: string | null;
  onHoverStart: (address: string) => void;
  onHoverEnd: () => void;
  onClearError: () => void;
  onClearSearch: () => void;
  onLoadMore: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

export default function NFTGrid({
  searchResults,
  isSearching,
  searchError,
  viewMode,
  hasMore,
  hoveredCard,
  onHoverStart,
  onHoverEnd,
  onClearError,
  onClearSearch,
  onLoadMore
}: NFTGridProps) {
  return (
    <motion.section 
      className="py-12 px-4 sm:px-6 lg:px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1 }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Error State */}
        <AnimatePresence>
          {searchError && (
            <motion.div
              className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-red-400 font-medium">Search Error</p>
                <p className="text-red-300 text-sm">{searchError}</p>
              </div>
              <motion.button
                onClick={onClearError}
                className="text-red-400 hover:text-red-300 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-4 h-4" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {isSearching ? (
            <motion.div
              key="loading"
              className="flex items-center justify-center py-20"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <div className="text-center">
                <motion.div
                  className="w-16 h-16 border-4 border-green-500/30 border-t-green-500 rounded-full mx-auto mb-4"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <motion.p 
                  className="text-gray-400 text-lg"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  Searching the blockchain...
                </motion.p>
              </div>
            </motion.div>
          ) : searchResults.length === 0 ? (
            <motion.div
              key="no-results"
              className="text-center py-20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <motion.div
                className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-500/10 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              >
                <Search className="w-12 h-12 text-green-400" />
              </motion.div>
              <h3 className="text-2xl font-bold text-white mb-4">No NFTs Found</h3>
              <p className="text-gray-400 text-lg max-w-md mx-auto">
                Try adjusting your search query or explore our trending collections
              </p>
              <motion.button
                className="mt-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 px-6 py-3 rounded-xl font-semibold text-black transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClearSearch}
              >
                Clear Search
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                  : 'grid-cols-1'
              }`}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              layout
            >
              <AnimatePresence mode="popLayout">
                {searchResults.map((nft, index) => (
                  <motion.div
                    key={nft.mint_address}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ 
                      duration: 0.4, 
                      delay: index * 0.05,
                      type: "spring",
                      stiffness: 200
                    }}
                  >
                    <NFTCard
                      nft={nft}
                      index={index}
                      hoveredCard={hoveredCard}
                      onHoverStart={onHoverStart}
                      onHoverEnd={onHoverEnd}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Load More Button */}
        {!isSearching && searchResults.length > 0 && hasMore && (
          <motion.div 
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
          >
            <motion.button
              className="bg-black/50 border-2 border-green-500/30 hover:border-green-500 hover:bg-green-500/10 px-8 py-4 rounded-xl font-semibold text-white transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={onLoadMore}
              disabled={isSearching}
            >
              <span className="flex items-center gap-2">
                {isSearching ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Load More NFTs
                    <motion.div
                      animate={{ y: [0, -2, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <TrendingUp className="w-5 h-5 group-hover:text-green-400 transition-colors" />
                    </motion.div>
                  </>
                )}
              </span>
            </motion.button>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}