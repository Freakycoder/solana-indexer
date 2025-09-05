import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { motion, useScroll, useTransform } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import useSearch from "@/hooks/useSearch";
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import TrendingCollections from '@/components/ui/TrendingCollections';
import NFTDetailModal from '@/components/ui/NFTDetailModal';

interface NFTSearchResult {
  mint_address: string;
  nft_name: string;
  score: number;
  image?: string;
  price?: number;
  collection?: string;
}

interface NFTDetailData {
  mint_address: string;
  owner: string;
  mint_authority: string;
  supply: number;
  decimal: number;
  is_initialized: boolean;
  freeze_authority?: string;
  metadata: {
    name?: string;
    symbol?: string;
    metadata_uri?: string;
    seller_fee_basis_points: number;
    update_authority?: string;
    primary_sale_happened: boolean;
    is_mutable: boolean;
  };
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
  const [selectedNFT, setSelectedNFT] = useState<NFTDetailData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingNFTDetails, setIsLoadingNFTDetails] = useState(false);
  
  const { scrollY } = useScroll();
  const headerBackground = useTransform(
    scrollY,
    [0, 100],
    ["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0.95)"]
  );

  // Transform search results for the dropdown (first 8 results)
  const dropdownResults: NFTSearchResult[] = searchResults.slice(0, 8);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isModalOpen]);

  // Fetch detailed NFT information
  const fetchNFTDetails = async (mintAddress: string): Promise<NFTDetailData | null> => {
    try {
      setIsLoadingNFTDetails(true);
      
      // Call your backend API to get detailed NFT info
      const response = await fetch(`http://localhost:3001/details/${mintAddress}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch NFT details: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Transform the response to match NFTDetailData interface
      const nftDetail: NFTDetailData = {
        mint_address: data.mint_address || mintAddress,
        owner: data.owner || '',
        mint_authority: data.mint_authority || '',
        supply: data.supply || 0,
        decimal: data.decimal || 0,
        is_initialized: data.is_initialized || false,
        freeze_authority: data.freeze_authority || undefined,
        metadata: {
          name: data.metadata?.name || undefined,
          symbol: data.metadata?.symbol || undefined,
          metadata_uri: data.metadata?.metadata_uri || undefined,
          seller_fee_basis_points: data.metadata?.seller_fee_basis_points || 0,
          update_authority: data.metadata?.update_authority || undefined,
          primary_sale_happened: data.metadata?.primary_sale_happened || false,
          is_mutable: data.metadata?.is_mutable || false,
        },
      };
      
      return nftDetail;
    } catch (error) {
      console.error('Error fetching NFT details:', error);
      return null;
    } finally {
      setIsLoadingNFTDetails(false);
    }
  };

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // Handle when user clicks on a search result in dropdown
  const handleSearchResultClick = async (result: NFTSearchResult) => {
    console.log('Selected NFT from search:', result);
    
    // Convert search result to basic detail data with default values
    const basicNFTData: NFTDetailData = {
      mint_address: result.mint_address,
      owner: '',
      mint_authority: '',
      supply: 1,
      decimal: 0,
      is_initialized: true,
      freeze_authority: undefined,
      metadata: {
        name: result.nft_name,
        symbol: undefined,
        metadata_uri: result.image,
        seller_fee_basis_points: 0,
        update_authority: undefined,
        primary_sale_happened: false,
        is_mutable: true,
      },
    };
    
    // Set basic data first to show modal quickly
    setSelectedNFT(basicNFTData);
    setIsModalOpen(true);
    
    // Then fetch detailed information in the background
    const detailedData = await fetchNFTDetails(result.mint_address);
    if (detailedData) {
      setSelectedNFT(detailedData);
    }
  };

  // Handle modal actions
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedNFT(null), 300); // Clear after animation
  };

  const handleFavoriteNFT = (mintAddress: string) => {
    console.log('Favorited NFT:', mintAddress);
    // Implement favorite functionality
  };

  const handleShareNFT = (mintAddress: string) => {
    console.log('Shared NFT:', mintAddress);
    // Implement share functionality
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

        {/* NFT Detail Modal */}
        <NFTDetailModal
          nft={selectedNFT}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onFavorite={handleFavoriteNFT}
          onShare={handleShareNFT}
        />

        {/* Loading overlay when fetching NFT details */}
        {isLoadingNFTDetails && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] flex items-center justify-center">
            <div className="bg-black/90 border border-green-500/30 rounded-xl p-6 flex items-center gap-3">
              <motion.div
                className="w-6 h-6 border-2 border-green-500/30 border-t-green-500 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <span className="text-white">Loading NFT details...</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}