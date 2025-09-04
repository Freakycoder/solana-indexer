import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Zap, ExternalLink } from 'lucide-react';

interface NFTSearchResult {
  mint_address: string;
  nft_name: string;
  score: number;
  image?: string;
  price?: number;
  collection?: string;
}

interface SearchDropdownProps {
  query: string;
  results: NFTSearchResult[];
  isSearching: boolean;
  isVisible: boolean;
  onResultClick: (result: NFTSearchResult) => void;
  onClose: () => void;
}

const dropdownVariants = {
  hidden: {
    opacity: 0,
    y: -10,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: "easeOut" as const,
      staggerChildren: 0.03,
    }
  },
  exit: {
    opacity: 0,
    y: -5,
    scale: 0.95,
    transition: {
      duration: 0.15,
      ease: "easeIn" as const
    }
  }
};

const itemVariants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.2,
      ease: "easeOut" as const
    }
  }
};

const SearchDropdown: React.FC<SearchDropdownProps> = ({
  query,
  results,
  isSearching,
  isVisible,
  onResultClick,
  onClose
}) => {
  const hasResults = results.length > 0;
  const shouldShow = isVisible && (hasResults || isSearching || query.length > 0);


  return (
    <AnimatePresence>
      {shouldShow && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Dropdown container */}
          <motion.div
            className="absolute top-full left-0 right-0 mt-2 bg-black/95 backdrop-blur-xl border border-green-500/30 rounded-xl shadow-2xl shadow-green-500/10 z-50 max-h-96 overflow-hidden"
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Loading state */}
            {isSearching && (
              <motion.div
                className="flex items-center justify-center py-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    className="w-5 h-5 border-2 border-green-500/30 border-t-green-500 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <span className="text-gray-400 text-sm">Searching the blockchain...</span>
                </div>
              </motion.div>
            )}

            {/* No results state */}
            {!isSearching && query.length > 0 && !hasResults && (
              <motion.div
                className="flex flex-col items-center justify-center py-8 px-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Search className="w-8 h-8 text-gray-500 mb-2" />
                <span className="text-gray-400 text-sm text-center">
                  No NFTs found for "{query}"
                </span>
                <span className="text-gray-500 text-xs text-center mt-1">
                  Try a different search term or collection name
                </span>
              </motion.div>
            )}

            {/* Search results */}
            {!isSearching && hasResults && (
              <motion.div
                className="max-h-80 overflow-y-auto scrollbar-hide"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {/* Results header */}
                <motion.div 
                  className="sticky top-0 bg-black/90 backdrop-blur-sm border-b border-green-500/20 px-4 py-3 flex items-center justify-between"
                  variants={itemVariants}
                >
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300 text-sm font-medium">
                      {results.length} NFT{results.length !== 1 ? 's' : ''} found
                    </span>
                  </div>
                  <span className="text-gray-500 text-xs">
                    Ordered by relevance
                  </span>
                </motion.div>

                {/* Results list */}
                <div className="py-2">
                  {results.slice(0, 8).map((result) => (
                    <motion.div
                      key={result.mint_address}
                      variants={itemVariants}
                      className="group px-4 py-3 hover:bg-green-500/10 cursor-pointer transition-all duration-200 border-b border-green-500/5 last:border-b-0"
                      whileHover={{ backgroundColor: "rgba(34, 197, 94, 0.1)" }}
                      onClick={() => onResultClick(result)}
                    >
                      <div className="flex items-center gap-3">
                        {/* NFT Image */}
                        <div className="relative flex-shrink-0">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-800/50 border border-green-500/20 group-hover:border-green-500/50 transition-all duration-200">
                            {result.image ? (
                              <img 
                                src={result.image} 
                                alt={result.nft_name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Zap className="w-6 h-6 text-green-400/50" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* NFT Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col">
                            <h4 className="text-white font-bold text-base group-hover:text-green-400 transition-colors duration-200 truncate">
                              {result.nft_name}
                            </h4>
                            <span className="text-gray-500 text-sm mt-1 truncate">
                              {result.mint_address}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Show more results footer */}
                {results.length > 8 && (
                  <motion.div
                    className="sticky bottom-0 bg-black/90 backdrop-blur-sm border-t border-green-500/20 px-4 py-3"
                    variants={itemVariants}
                  >
                    <button 
                      onClick={onClose}
                      className="w-full text-green-400 hover:text-green-300 text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      <span>View all {results.length} results</span>
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Empty state for very short queries */}
            {!isSearching && query.length > 0 && query.length < 2 && (
              <motion.div
                className="flex items-center justify-center py-6 px-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <span className="text-gray-500 text-sm text-center">
                  Type at least 2 characters to search
                </span>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SearchDropdown;