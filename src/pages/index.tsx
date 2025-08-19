import React, { useState } from 'react';
import Head from 'next/head';
import { motion, useScroll, useTransform } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import useSearch from "@/hooks/useSearch";
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import TrendingCollections from '@/components/ui/TrendingCollections';
import SearchFilters from '@/components/ui/SearchFilters';
import NFTGrid from '@/components/ui/NFTGrid';
import { ViewMode, SortOption } from '@/types';

export default function Home() {
  // Search functionality using custom hook
  const {
    query,
    setQuery: setSearchQuery,
    results: searchResults,
    isSearching,
    error: searchError,
    totalResults,
    hasMore,
    loadMore,
    clearError
  } = useSearch({
    debounceMs: 400,
    minQueryLength: 0,
    pageSize: 20
  });

  // UI state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  
  const { scrollY } = useScroll();
  const headerBackground = useTransform(
    scrollY,
    [0, 100],
    ["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0.95)"]
  );

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    clearError();
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <>
      <Head>
        <title>Solana NFT Marketplace - Discover, Trade, Collect</title>
        <meta name="description" content="The premier Solana NFT marketplace with real-time search and discovery" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-black text-white overflow-x-hidden">
        {/* Animated background grid */}
        <div className="fixed inset-0 bg-[linear-gradient(rgba(34,197,94,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.03)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        
        {/* Header */}
        <Header 
          headerBackground={headerBackground}
          query={query}
          isSearching={isSearching}
          isSearchFocused={isSearchFocused}
          onSearchChange={handleSearchChange}
          onSearchFocus={() => setIsSearchFocused(true)}
          onSearchBlur={() => setIsSearchFocused(false)}
          onClearSearch={handleClearSearch}
        />

        {/* Main Content */}
        <main className="pt-16">
          {/* Trending Collections Section */}
          <TrendingCollections />

          {/* Filters and Controls */}
          <SearchFilters
            viewMode={viewMode}
            sortBy={sortBy}
            resultsCount={totalResults > 0 ? totalResults : searchResults.length}
            onViewModeChange={setViewMode}
            onSortChange={setSortBy}
          />

          {/* NFT Grid */}
          <NFTGrid
            searchResults={searchResults}
            isSearching={isSearching}
            searchError={searchError}
            viewMode={viewMode}
            hasMore={hasMore}
            hoveredCard={hoveredCard}
            onHoverStart={setHoveredCard}
            onHoverEnd={() => setHoveredCard(null)}
            onClearError={clearError}
            onClearSearch={handleClearSearch}
            onLoadMore={loadMore}
          />
        </main>

        {/* Footer */}
        <Footer />

        {/* Floating Action Button */}
        <motion.button
          className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg z-40"
          whileHover={{ scale: 1.1, rotate: 10 }}
          whileTap={{ scale: 0.9 }}
          animate={{
            y: [0, -4, 0],
            boxShadow: [
              "0 4px 20px rgba(34, 197, 94, 0.3)",
              "0 8px 25px rgba(34, 197, 94, 0.4)",
              "0 4px 20px rgba(34, 197, 94, 0.3)"
            ]
          }}
          transition={{
            y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
            boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <TrendingUp className="w-6 h-6 text-black" />
        </motion.button>
      </div>
    </>
  );
}