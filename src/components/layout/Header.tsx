import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Wallet, Search, X, Loader2 } from 'lucide-react';
import { MotionValue } from 'framer-motion';

interface HeaderProps {
  headerBackground: MotionValue<string>;
  query: string;
  isSearching: boolean;
  isSearchFocused: boolean;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchFocus: () => void;
  onSearchBlur: () => void;
  onClearSearch: () => void;
}

const pulseVariants = {
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut" as const
    }
  }
};

export default function Header({ 
  headerBackground, 
  query, 
  isSearching, 
  isSearchFocused, 
  onSearchChange, 
  onSearchFocus, 
  onSearchBlur, 
  onClearSearch 
}: HeaderProps) {
  return (
    <motion.header 
      className="fixed top-0 left-0 right-0 z-50 border-b border-green-500/20 backdrop-blur-xl"
      style={{ backgroundColor: headerBackground }}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 40 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div 
            className="flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center"
              variants={pulseVariants}
              animate="pulse"
            >
              <Zap className="w-5 h-5 text-black" />
            </motion.div>
            <span className="text-xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
              SolanaFy
            </span>
          </motion.div>


          {/* Desktop Navigation */}
          <nav className="flex items-center gap-6">
            {['Explore', 'Collections', 'Activity', 'Stats'].map((item, index) => (
              <motion.a
                key={item}
                href="#"
                className="text-gray-300 hover:text-green-400 transition-colors duration-300 font-medium relative text-sm"
                whileHover={{ y: -2 }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {item}
                <motion.div
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-green-400 origin-left"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.a>
            ))}
          </nav>
          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <div className="relative flex items-center bg-black/50 backdrop-blur-xl border border-green-500/30 rounded-xl overflow-hidden">
                <motion.div
                  className="pl-4 pr-3"
                  animate={{ rotate: isSearching ? 360 : 0 }}
                  transition={{ duration: 1, repeat: isSearching ? Infinity : 0, ease: "linear" }}
                >
                  <Search className="w-4 h-4 text-green-400" />
                </motion.div>
                
                <input
                  type="text"
                  placeholder="Search NFTs, collections, or addresses..."
                  value={query}
                  onChange={onSearchChange}
                  onFocus={onSearchFocus}
                  onBlur={onSearchBlur}
                  className="flex-1 py-2.5 px-2 bg-transparent text-white placeholder-gray-400 focus:outline-none text-sm"
                />
                
                <AnimatePresence>
                  {isSearching && (
                    <motion.div
                      className="pr-4"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <Loader2 className="w-4 h-4 text-green-400 animate-spin" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {query && (
                  <motion.button
                    className="pr-4 text-gray-400 hover:text-white transition-colors"
                    onClick={onClearSearch}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
            </div>
          </div>

          {/* Connect Wallet Button */}
          <motion.button
            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 px-6 py-2 rounded-xl font-semibold text-black transition-all duration-300 shadow-lg hover:shadow-green-500/25"
            whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(34, 197, 94, 0.3)" }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Wallet className="w-4 h-4" />
            Connect Wallet
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}