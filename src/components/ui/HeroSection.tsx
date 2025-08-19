import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Star, Activity, BarChart3 } from 'lucide-react';

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
      className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden"
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
          The most advanced NFT marketplace on Solana. Search, discover, and trade with lightning-fast speed and zero compromises.
        </motion.p>


        {/* Quick Stats */}
        {/* <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.6 }}
        >
          {[
            { label: 'Total Volume', value: '2.4M SOL', icon: BarChart3 },
            { label: 'Active Collections', value: '15,432', icon: Star },
            { label: 'Total NFTs', value: '1.2M+', icon: TrendingUp },
            { label: 'Daily Traders', value: '8,942', icon: Activity }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              className="bg-black/30 backdrop-blur-sm border border-green-500/20 rounded-xl p-6 text-center group hover:border-green-500/50 transition-all duration-300"
              variants={itemVariants}
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.div
                className="flex justify-center mb-3"
                whileHover={{ rotate: 10, scale: 1.1 }}
              >
                <stat.icon className="w-8 h-8 text-green-400" />
              </motion.div>
              <motion.div 
                className="text-2xl font-bold text-white mb-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
              >
                {stat.value}
              </motion.div>
              <div className="text-gray-400 text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div> */}
      </div>
    </motion.section>
  );
}