import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Heart, Zap, BarChart3, Activity } from 'lucide-react';
import { NFTResult } from '@/types';

interface NFTCardProps {
  nft: NFTResult;
  index: number;
  hoveredCard: string | null;
  onHoverStart: (address: string) => void;
  onHoverEnd: () => void;
}

const cardVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 120,
      damping: 15
    }
  },
  hover: {
    scale: 1.02,
    y: -8,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 25
    }
  }
};

const getRarityColor = (rarity?: string) => {
  switch (rarity) {
    case 'Common': return 'text-gray-400 border-gray-400';
    case 'Rare': return 'text-blue-400 border-blue-400';
    case 'Epic': return 'text-purple-400 border-purple-400';
    case 'Legendary': return 'text-yellow-400 border-yellow-400';
    default: return 'text-green-400 border-green-400';
  }
};

export default function NFTCard({ nft, index, hoveredCard, onHoverStart, onHoverEnd }: NFTCardProps) {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      layout
      transition={{ delay: index * 0.05 }}
      onHoverStart={() => onHoverStart(nft.mint_address)}
      onHoverEnd={onHoverEnd}
      className="group bg-black border border-green-500/20 rounded-2xl overflow-hidden hover:border-green-500/60 transition-all duration-500 hover:shadow-2xl hover:shadow-green-500/20 cursor-pointer backdrop-blur-sm"
    >
      <div className="relative aspect-square overflow-hidden">
        <motion.img 
          src={nft.image || '/api/placeholder/400/400'} 
          alt={nft.nft_name}
          className="w-full h-full object-cover"
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
        
        {/* Animated overlay gradient */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />

        {/* Floating action buttons */}
        <motion.div 
          className="absolute top-4 right-4 flex flex-col gap-2"
          initial={{ opacity: 0, x: 20 }}
          whileHover={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <motion.button 
            className="p-2 bg-black/90 backdrop-blur-sm rounded-xl border border-green-500/30 hover:border-green-500 transition-all duration-300 group/btn"
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Heart className="w-4 h-4 text-green-500 group-hover/btn:fill-current transition-all duration-300" />
          </motion.button>
          <motion.button 
            className="p-2 bg-black/90 backdrop-blur-sm rounded-xl border border-green-500/30 hover:border-green-500 transition-all duration-300 group/btn"
            whileHover={{ scale: 1.1, rotate: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Eye className="w-4 h-4 text-green-500 transition-all duration-300" />
          </motion.button>
        </motion.div>

        {/* Rarity badge */}
        {nft.rarity && (
          <motion.div 
            className="absolute top-4 left-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className={`px-2 py-1 rounded-lg border text-xs font-semibold bg-black/90 backdrop-blur-sm ${getRarityColor(nft.rarity)}`}>
              {nft.rarity}
            </div>
          </motion.div>
        )}

        {/* Price badge */}
        {nft.price && (
          <motion.div 
            className="absolute bottom-4 left-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
          >
            <div className="bg-green-500/20 backdrop-blur-sm border border-green-500/50 rounded-xl px-3 py-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-green-400" />
              <span className="text-green-400 font-bold text-sm">{nft.price} SOL</span>
            </div>
          </motion.div>
        )}

        {/* Volume indicator */}
        {hoveredCard === nft.mint_address && nft.volume24h && (
          <motion.div
            className="absolute bottom-4 right-4"
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <div className="bg-black/90 backdrop-blur-sm border border-green-500/30 rounded-xl px-2 py-1 flex items-center gap-1">
              <BarChart3 className="w-3 h-3 text-green-400" />
              <span className="text-green-400 font-medium text-xs">{nft.volume24h}SOL</span>
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Card content */}
      <motion.div 
        className="p-4 space-y-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div>
          <motion.h3 
            className="font-bold text-white text-lg group-hover:text-green-400 transition-colors duration-300 truncate"
            whileHover={{ x: 2 }}
          >
            {nft.nft_name}
          </motion.h3>
          <motion.p 
            className="text-gray-400 text-sm truncate"
            whileHover={{ x: 2 }}
            transition={{ delay: 0.05 }}
          >
            {nft.collection}
          </motion.p>
        </div>
        
        {/* Stats row */}
        <div className="flex justify-between items-center pt-2 border-t border-green-500/10">
          <motion.div 
            className="text-xs text-gray-400"
            whileHover={{ scale: 1.05 }}
          >
            Last Sale: <span className="text-green-400 font-semibold">{nft.lastSale}SOL</span>
          </motion.div>
          <motion.div
            className="flex items-center gap-1 text-xs text-gray-400"
            whileHover={{ scale: 1.05 }}
          >
            <Activity className="w-3 h-3" />
            <span>Score: {(nft.score * 100).toFixed(0)}%</span>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}