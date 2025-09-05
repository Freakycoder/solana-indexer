// src/components/ui/NFTDetailModal.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { 
  X, 
  Zap, 
  ExternalLink, 
  Copy, 
  BarChart3, 
  Activity,
  Star,
  Wallet,
  Eye,
  TrendingUp,
  User,
  Globe,
  Image as ImageIcon,
  FileText,
  Gem
} from 'lucide-react';
import axios from 'axios';

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

interface NFTJsonMetadata {
  description?: string;
  image?: string;
  rarity?: string;
}

interface NFTDetailModalProps {
  nft: NFTDetailData | null;
  isOpen: boolean;
  onClose: () => void;
  onFavorite?: (mintAddress: string) => void;
  onShare?: (mintAddress: string) => void;
}

const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 100
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30
    }
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 50,
    transition: {
      duration: 0.2
    }
  }
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

const NFTDetailModal: React.FC<NFTDetailModalProps> = ({
  nft,
  isOpen,
  onClose
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [jsonMetadata, setJsonMetadata] = useState<NFTJsonMetadata | null>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');

  // Reset states when NFT changes
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    setCopied(false);
    setJsonMetadata(null);
    setIsLoadingMetadata(false);
    setImageUrl('');
  }, [nft?.mint_address]);

  // Fetch JSON metadata when NFT changes
  useEffect(() => {
    const fetchJsonMetadata = async () => {
      if (!nft?.metadata.metadata_uri || !isOpen) return;
      
      setIsLoadingMetadata(true);
      
      try {
        const response = await axios.get(nft.metadata.metadata_uri);
        
        const jsonResponse = await response.data;
        console.log('Fetched JSON metadata:', jsonResponse);
        
        const metadata: NFTJsonMetadata = {
          description: jsonResponse.description,
          image: jsonResponse.image,
          rarity: jsonResponse.attributes?.rarity
        };
        
        console.log('Parsed metadata:', metadata);
        setJsonMetadata(metadata);
        
        // Set image URL immediately after fetching metadata
        if (metadata.image) {
          setImageUrl(metadata.image);
          console.log('Setting image URL:', metadata.image);
        }
        
      } catch (error) {
        console.error('Error fetching JSON metadata:', error);
        setImageError(true);
      } finally {
        setIsLoadingMetadata(false);
      }
    };

    fetchJsonMetadata();
  }, [nft?.metadata.metadata_uri, isOpen]);

  const handleCopyAddress = async () => {
    if (nft?.mint_address) {
      try {
        await navigator.clipboard.writeText(nft.mint_address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy address:', error);
      }
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  const handleImageLoad = () => {
    console.log('Image loaded successfully');
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('Image failed to load:', e.currentTarget.src);
    setImageError(true);
    setImageLoaded(true);
  };

  if (!nft) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            className="relative w-full max-w-6xl bg-black/95 backdrop-blur-xl border border-green-500/30 rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-green-500/20">
              <div className="flex-1 min-w-0">
                {nft.metadata.symbol && (
                  <p className="text-green-400 text-sm mt-1">{nft.metadata.symbol}</p>
                )}
              </div>
              
              <div className="flex items-center gap-3 ml-4">
                <motion.button
                  className="p-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              {/* Left Side - Image and Description */}
              <div className="lg:w-1/2 p-6 space-y-6 bg-gradient-to-br from-green-500/5 to-transparent">
                {/* Image Container */}
                <div className="relative w-full aspect-square max-w-sm mx-auto">
                  <motion.div
                    className="relative w-full h-full rounded-2xl overflow-hidden bg-gray-900/50 border border-green-500/20"
                    layout
                  >
                    {imageUrl && !imageError ? (
                      <>
                        <img
                          src={imageUrl}
                          className={`w-full h-full object-cover transition-all duration-500 ${
                            imageLoaded ? 'opacity-100' : 'opacity-0'
                          }`}
                          onLoad={handleImageLoad}
                          onError={handleImageError}
                          crossOrigin="anonymous"
                        />
                        
                        {!imageLoaded && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <motion.div
                              className="w-12 h-12 border-3 border-green-500/30 border-t-green-500 rounded-full"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                          </div>
                        )}

                        {/* Rarity Badge - Top Left */}
                        {jsonMetadata?.rarity && imageLoaded && (
                          <motion.div
                            className="absolute top-3 left-3 px-3 py-1.5 rounded-xl bg-purple-500/90 backdrop-blur-sm border border-purple-500/50 shadow-lg"
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                          >
                            <div className="flex items-center gap-1.5">
                              <Gem className="w-3 h-3 text-purple-200" />
                              <span className="text-purple-100 font-semibold text-xs uppercase tracking-wider">
                                {jsonMetadata.rarity}
                              </span>
                            </div>
                          </motion.div>
                        )}

                        {/* Image overlay effects */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"
                          whileHover={{ opacity: 1 }}
                        />
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200 }}
                          >
                            {isLoadingMetadata ? (
                              <motion.div
                                className="w-12 h-12 border-3 border-green-500/30 border-t-green-500 rounded-full mx-auto mb-4"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              />
                            ) : (
                              <Zap className="w-20 h-20 text-green-400/50 mx-auto mb-4" />
                            )}
                          </motion.div>
                          <p className="text-gray-500">
                            {isLoadingMetadata ? 'Loading image...' : 'No image available'}
                          </p>
                          <p className="text-gray-600 text-sm mt-1">
                            {nft.metadata.name || 'NFT'}
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </div>

                {/* Description Section - Below Image */}
                {jsonMetadata?.description && (
                  <motion.div
                    className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/30 rounded-2xl p-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-3">
                      <FileText className="w-5 h-5 text-blue-400" />
                      Description
                    </h3>
                    <p className="text-gray-300 leading-relaxed text-sm">
                      {jsonMetadata.description}
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Right Side - Details */}
              <div className="lg:w-1/2 p-6 overflow-y-auto">
                <div className="space-y-6">
                  {/* Token Info Section */}
                  <motion.div
                    className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/30 rounded-2xl p-6"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Zap className="w-5 h-5 text-green-400" />
                        Token Details
                      </h3>
                      <div className="text-green-400 text-sm font-medium">
                        {nft.supply > 1 ? 'Fungible' : 'NFT'}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Supply:</span>
                        <span className="text-white font-mono">{nft.supply.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Decimals:</span>
                        <span className="text-white font-mono">{nft.decimal}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Royalty:</span>
                        <span className="text-white font-mono">{(nft.metadata.seller_fee_basis_points / 100).toFixed(2)}%</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Metadata Loading State */}
                  {isLoadingMetadata && (
                    <motion.div
                      className="bg-gray-500/10 border border-gray-500/30 rounded-2xl p-6"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <div className="flex items-center justify-center gap-3">
                        <motion.div
                          className="w-6 h-6 border-2 border-gray-400/30 border-t-gray-400 rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        <span className="text-gray-400">Loading metadata...</span>
                      </div>
                    </motion.div>
                  )}

                  {/* NFT Information */}
                  <motion.div
                    className="space-y-4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {/* Mint Address */}
                    <div className="bg-black/50 border border-green-500/20 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-400 text-sm mb-1 flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Mint Address
                          </p>
                          <p className="text-white font-mono text-sm">
                            {truncateAddress(nft.mint_address)}
                          </p>
                        </div>
                        <motion.button
                          className={`p-2 rounded-lg transition-all duration-200 ${
                            copied 
                              ? 'bg-green-500/30 text-green-300' 
                              : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleCopyAddress}
                        >
                          {copied ? (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="text-green-400 text-xs font-medium px-1"
                            >
                              ✓ Copied
                            </motion.div>
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </motion.button>
                      </div>
                    </div>

                    {/* Owner Info */}
                    <div className="bg-black/50 border border-green-500/20 rounded-xl p-4">
                      <p className="text-gray-400 text-sm mb-1 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Current Owner
                      </p>
                      <p className="text-white font-mono text-sm">
                        {truncateAddress(nft.owner)}
                      </p>
                    </div>

                    {/* Mint Authority */}
                    <div className="bg-black/50 border border-green-500/20 rounded-xl p-4">
                      <p className="text-gray-400 text-sm mb-1 flex items-center gap-2">
                        <Wallet className="w-4 h-4" />
                        Mint Authority
                      </p>
                      <p className="text-white font-mono text-sm">
                        {truncateAddress(nft.mint_authority)}
                      </p>
                    </div>

                    {/* Update Authority */}
                    {nft.metadata.update_authority && (
                      <div className="bg-black/50 border border-green-500/20 rounded-xl p-4">
                        <p className="text-gray-400 text-sm mb-1 flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          Update Authority
                        </p>
                        <p className="text-white font-mono text-sm">
                          {truncateAddress(nft.metadata.update_authority)}
                        </p>
                      </div>
                    )}

                    {/* Freeze Authority */}
                    {nft.freeze_authority && (
                      <div className="bg-black/50 border border-green-500/20 rounded-xl p-4">
                        <p className="text-gray-400 text-sm mb-1 flex items-center gap-2">
                          <X className="w-4 h-4" />
                          Freeze Authority
                        </p>
                        <p className="text-white font-mono text-sm">
                          {truncateAddress(nft.freeze_authority)}
                        </p>
                      </div>
                    )}

                    {/* Metadata URI */}
                    {nft.metadata.metadata_uri && (
                      <div className="bg-black/50 border border-green-500/20 rounded-xl p-4">
                        <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                          <Globe className="w-4 h-4 text-green-400" />
                          Metadata URI
                        </h4>
                        <a
                          href={nft.metadata.metadata_uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-400 hover:text-green-300 text-sm break-all underline"
                        >
                          {nft.metadata.metadata_uri}
                        </a>
                      </div>
                    )}
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default NFTDetailModal;
export type { NFTDetailData };