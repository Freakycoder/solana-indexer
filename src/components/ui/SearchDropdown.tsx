import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2 } from 'lucide-react';

interface NFTSearchResult {
  mint_address: string;
  nft_name: string;
  score: number;
}

interface SearchDropdownProps {
  query: string;
  results: NFTSearchResult[];
  isSearching: boolean;
  isVisible: boolean;
  onResultClick: (result: NFTSearchResult) => void;
  onClose: () => void;
}

const SearchDropdown: React.FC<SearchDropdownProps> = React.memo(({
  query,
  results,
  isSearching,
  isVisible,
  onResultClick,
  onClose
}) => {
  const hasResults = results.length > 0;
  const shouldShow = isVisible && query.length > 0;

  if (!shouldShow) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="absolute top-full left-0 right-0 mt-1 bg-black/95 backdrop-blur-xl border border-green-500/30 rounded-xl shadow-2xl z-50 overflow-hidden"
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -5, scale: 0.95 }}
        transition={{ duration: 0.15 }}
      >
        {/* Loading state */}
        {isSearching && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-4 h-4 text-green-400 animate-spin mr-2" />
            <span className="text-gray-400 text-sm">Searching...</span>
          </div>
        )}

        {/* No results */}
        {!isSearching && query.length > 0 && !hasResults && (
          <div className="flex items-center justify-center py-4">
            <Search className="w-4 h-4 text-gray-500 mr-2" />
            <span className="text-gray-400 text-sm">No results found</span>
          </div>
        )}

        {/* Results list - only show 5 results max */}
        {!isSearching && hasResults && (
          <div className="max-h-80 overflow-y-auto">
            {results.slice(0, 5).map((result, index) => (
              <motion.div
                key={result.mint_address}
                className="px-4 py-3 hover:bg-green-500/10 cursor-pointer border-b border-green-500/10 last:border-b-0 transition-colors duration-150"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                onClick={() => onResultClick(result)}
              >
                {/* NFT Name */}
                <div className="text-white font-medium text-sm truncate mb-1">
                  {result.nft_name}
                </div>
                
                {/* Mint Address */}
                <div className="text-gray-400 text-xs font-mono truncate">
                  {result.mint_address}
                </div>
              </motion.div>
            ))}
            
            {/* Show more indicator if there are more results */}
            {results.length > 5 && (
              <div className="px-4 py-2 text-center border-t border-green-500/20">
                <span className="text-green-400 text-xs">
                  +{results.length - 5} more results
                </span>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
});

SearchDropdown.displayName = 'SearchDropdown';

export default SearchDropdown;