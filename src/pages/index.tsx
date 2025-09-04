import React, { useState } from 'react';
import Head from 'next/head';
import { motion, useScroll, useTransform } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import useSearch from "@/hooks/useSearch";
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import TrendingCollections from '@/components/ui/TrendingCollections';

interface NFTSearchResult {
  mint_address: string;
  nft_name: string;
  score: number;
  image?: string;
  price?: number;
  collection?: string;
}

export default function Home() {
  // Search functionality using custom hook
  const {
    query,
    setQuery: setSearchQuery,
    results: searchResults,
    isSearching
  } = useSearch();

  // UI state
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  const { scrollY } = useScroll();
  const headerBackground = useTransform(
    scrollY,
    [0, 100],
    ["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0.95)"]
  );

  // Transform search results for the dropdown (first 8 results)
  const dropdownResults: NFTSearchResult[] = searchResults.slice(0, 8);

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // Handle when user clicks on a search result in dropdown
  const handleSearchResultClick = (result: NFTSearchResult) => {
    console.log('Navigate to NFT:', result);
    // Here you could navigate to the NFT detail page
    // router.push(`/nft/${result.mint_address}`);
    
    // Or set the selected NFT in state to highlight it in the grid
    // setSelectedNFT(result.mint_address);
    
    // Or scroll to the NFT in the current results if it exists
    const element = document.getElementById(result.mint_address);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
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
        
        {/* Header with SearchDropdown */}
        <Header 
          headerBackground={headerBackground}
          query={query}
          isSearching={isSearching}
          isSearchFocused={isSearchFocused}
          searchResults={dropdownResults}
          onSearchChange={handleSearchChange}
          onSearchFocus={() => setIsSearchFocused(true)}
          onSearchBlur={() => setIsSearchFocused(false)}
          onClearSearch={handleClearSearch}
          onSearchResultClick={handleSearchResultClick}
        />

        {/* Main Content */}
        <main className="pt-16">
          {/* Show Trending Collections when no search query */}
          {!query.trim() && (
            <TrendingCollections />
          )}

        </main>

        {/* Footer */}
        <Footer />
      </div>
    </>
  );
}