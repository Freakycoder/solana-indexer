import React from 'react';
import { motion } from 'framer-motion';

interface HeroSectionProps {}

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

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 12
    }
  }
};

export default function HeroSection({}: HeroSectionProps) {
  return (
    <motion.section 
      className="relative py-16 px-4 sm:px-6 lg:px-8 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Animated background elements */}
      <motion.div
        className="absolute top-20 left-10 w-72 h-72 bg-green-500/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-96 h-96 bg-green-500/5 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <div className="max-w-7xl mx-auto text-center relative">
        <motion.h1 
          className="text-4xl sm:text-6xl lg:text-7xl font-bold mb-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.span 
            className="block text-white"
            variants={itemVariants}
          >
            Discover the Future of
          </motion.span>
          <motion.span 
            className="block bg-gradient-to-r from-green-400 via-green-500 to-green-600 bg-clip-text text-transparent"
            variants={itemVariants}
          >
            Solana NFTs
          </motion.span>
        </motion.h1>
        
        <motion.p 
          className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed"
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.4 }}
        >
          Search, discover, and explore NFTs on Solana with lightning-fast speed and precision.
        </motion.p>
      </div>
    </motion.section>
  );
}