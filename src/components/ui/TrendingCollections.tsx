// src/components/ui/TrendingCollections.tsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, Calendar, CalendarDays } from 'lucide-react';
import { TrendingCollection } from '@/types';
import { magicEdenAPI } from '@/services/magicEdenAPI';

// Session-based cache for timeframe data - persists across component mounts but resets on page refresh
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY = 'solana-trending-collections-cache';
const CACHE_TIMESTAMP_KEY = 'solana-trending-collections-timestamp';

// Cache utilities
const getCachedData = (): { data: Record<string, TrendingCollection[]> | null, timestamp: number } => {
  try {
    const cachedData = sessionStorage.getItem(CACHE_KEY);
    const cachedTimestamp = sessionStorage.getItem(CACHE_TIMESTAMP_KEY);
    
    if (cachedData && cachedTimestamp) {
      return {
        data: JSON.parse(cachedData),
        timestamp: parseInt(cachedTimestamp, 10)
      };
    }
  } catch (error) {
    console.warn('Failed to read from sessionStorage:', error);
  }
  
  return { data: null, timestamp: 0 };
};

const setCachedData = (data: Record<string, TrendingCollection[]>, timestamp: number) => {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
    sessionStorage.setItem(CACHE_TIMESTAMP_KEY, timestamp.toString());
  } catch (error) {
    console.warn('Failed to write to sessionStorage:', error);
  }
};

// Move CollectionCard outside component to prevent re-creation on renders
const CollectionCard = React.memo<{ 
  collection: TrendingCollection; 
  index: number;
  timeframe: string;
}>(({ collection, index, timeframe }) => {
  const formatSOL = useCallback((amount: number | undefined): string => {
    if (!amount) return '0 SOL';
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M SOL`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K SOL`;
    return `${amount.toFixed(2)} SOL`;
  }, []);

  return (
    <motion.div
      className="flex-shrink-0 w-72 sm:w-80 h-80 sm:h-96 relative"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
    >
      {/* Card Container with rounded corners and shadow */}
      <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${collection.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />

        {/* Dark gradient overlay at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Bottom overlay content (Collection name + Floor price) */}
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 z-10">
          <div className="flex justify-between items-end">
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold text-base sm:text-lg truncate mb-1">
                {collection.name}
              </h3>
              <p className="text-gray-300 text-xs sm:text-sm truncate">
                {collection.symbol}
              </p>
            </div>
            <div className="text-right ml-3 sm:ml-4">
              <p className="text-gray-400 text-xs mb-1">Floor</p>
              <p className="text-white font-bold text-xs sm:text-sm">
                {formatSOL(collection.floorPrice)}
              </p>
            </div>
          </div>
        </div>

        {/* Rank badge */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30">
          <div className="bg-black/50 backdrop-blur-sm text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold">
            #{index + 1}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

CollectionCard.displayName = 'CollectionCard';

const TrendingCollections: React.FC = React.memo(() => {
  const [timeframeData, setTimeframeData] = useState<Record<string, TrendingCollection[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const scrollRefs = {
    '1h': useRef<HTMLDivElement>(null),
    '1d': useRef<HTMLDivElement>(null),
    '7d': useRef<HTMLDivElement>(null),
  };


  // Fetch data - only runs on first component mount if no valid cache exists
  useEffect(() => {
    const fetchAllTimeframes = async () => {
      const now = Date.now();
      const { data: cachedData, timestamp: cachedTimestamp } = getCachedData();
      
      // Check if we have valid cached data
      if (cachedData && Object.keys(cachedData).length > 0 && (now - cachedTimestamp) < CACHE_DURATION) {
        console.log('Using cached trending collections data');
        setTimeframeData(cachedData);
        setLoading(false);
        setIsInitialLoad(false);
        return;
      }

      try {
        setLoading(true);
        const timeframes: ('1h' | '1d' | '7d')[] = ['1h', '1d', '7d'];
        console.log('Fetching fresh trending collections data for timeframes:', timeframes);
        
        const promises = timeframes.map(timeframe => 
          magicEdenAPI.getPopularCollections(timeframe)
        );
        
        const results = await Promise.all(promises);
        const data: Record<string, TrendingCollection[]> = {};
        
        timeframes.forEach((timeframe, index) => {
          data[timeframe] = results[index];
        });

        // Update both component state and session cache
        setTimeframeData(data);
        setCachedData(data, now);
        setError(null);
        console.log('Fresh trending collections data fetched and cached successfully');
      } catch (err) {
        console.error('Error fetching collections:', err);
        setError('Failed to load collections');
      } finally {
        setLoading(false);
        setIsInitialLoad(false);
      }
    };

    // Only fetch if this is the initial load
    if (isInitialLoad) {
      fetchAllTimeframes();
    }
  }, [isInitialLoad]);

  // Auto-scroll effect for each section - completely separate from hover state
  useEffect(() => {
    if (loading || Object.keys(timeframeData).length === 0) return;

    const scrollAnimations: { [key: string]: number } = {};
    const pausedSections = new Set<string>();

    const startScrolling = (timeframe: '1h' | '1d' | '7d', direction: 'left' | 'right') => {
      const scrollContainer = scrollRefs[timeframe].current;
      if (!scrollContainer || !timeframeData[timeframe]?.length) return;

      let currentPosition = direction === 'right' ? 0 : scrollContainer.scrollWidth - scrollContainer.clientWidth;
      const scrollSpeed = direction === 'right' ? 1 : -1;
      const baseSpeed = 0.6; // Slightly slower for better UX

      const scroll = () => {
        const container = scrollRefs[timeframe].current;
        if (!container) return;

        // Check if this section should be paused
        if (pausedSections.has(timeframe)) {
          scrollAnimations[timeframe] = requestAnimationFrame(scroll);
          return;
        }

        const scrollWidth = container.scrollWidth;
        const containerWidth = container.clientWidth;
        const maxScroll = scrollWidth - containerWidth;

        if (maxScroll <= 0) {
          scrollAnimations[timeframe] = requestAnimationFrame(scroll);
          return;
        }

        currentPosition += scrollSpeed * baseSpeed;

        if (direction === 'right') {
          if (currentPosition >= maxScroll + 100) {
            currentPosition = -200;
          }
        } else {
          if (currentPosition <= -200) {
            currentPosition = maxScroll + 100;
          }
        }

        container.scrollLeft = Math.max(0, Math.min(maxScroll, currentPosition));
        scrollAnimations[timeframe] = requestAnimationFrame(scroll);
      };

      // Add mouse event listeners to pause/resume scrolling
      const pauseScroll = () => {
        pausedSections.add(timeframe);
      };
      
      const resumeScroll = () => {
        pausedSections.delete(timeframe);
      };

      if (scrollContainer) {
        scrollContainer.addEventListener('mouseenter', pauseScroll, { passive: true });
        scrollContainer.addEventListener('mouseleave', resumeScroll, { passive: true });
      }

      // Start scrolling with delay
      setTimeout(() => {
        scrollAnimations[timeframe] = requestAnimationFrame(scroll);
      }, 1000);

      // Return cleanup function
      return () => {
        if (scrollContainer) {
          scrollContainer.removeEventListener('mouseenter', pauseScroll);
          scrollContainer.removeEventListener('mouseleave', resumeScroll);
        }
        if (scrollAnimations[timeframe]) {
          cancelAnimationFrame(scrollAnimations[timeframe]);
        }
      };
    };

    // Start scrolling for each timeframe with different directions
    const cleanup1h = startScrolling('1h', 'left');
    const cleanup1d = startScrolling('1d', 'right');
    const cleanup7d = startScrolling('7d', 'left');

    return () => {
      // Cancel all animations
      Object.values(scrollAnimations).forEach(animation => {
        if (animation) cancelAnimationFrame(animation);
      });
      
      // Call cleanup functions
      if (cleanup1h) cleanup1h();
      if (cleanup1d) cleanup1d();
      if (cleanup7d) cleanup7d();
    };
  }, [timeframeData, loading]); // No hoveredCard dependency

  // Memoize duplicated collections to prevent re-creation on every render
  const getDuplicatedCollections = useCallback((collections: TrendingCollection[]) => {
    if (!collections.length) return [];
    return [...collections, ...collections];
  }, []);

  const ScrollSection: React.FC<{
    timeframe: '1h' | '1d' | '7d';
    title: string;
    icon: React.ComponentType<any>;
    direction: 'left' | 'right';
  }> = React.memo(({ timeframe, title, icon: Icon, direction }) => {
    const collections = timeframeData[timeframe] || [];
    const duplicatedCollections = useMemo(() => 
      getDuplicatedCollections(collections), 
      [collections, getDuplicatedCollections]
    );
    
    return (
      <section className="py-8 sm:py-12">
        <div className="max-w-full px-4 sm:px-6">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-center gap-3 mb-6 sm:mb-8"
          >
            <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white text-center">
              {title}
            </h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-gray-400 text-xs sm:text-sm">
                {direction}
              </span>
            </div>
          </motion.div>

          {/* Scrolling Container */}
          <div className="relative w-full">
            <motion.div
              ref={scrollRefs[timeframe]}
              className="flex gap-4 sm:gap-6 overflow-hidden scrollbar-hide"
              style={{ 
                scrollbarWidth: 'none', 
                msOverflowStyle: 'none',
                overflowX: 'hidden',
                overflowY: 'hidden'
              }}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {/* Render collection cards */}
              {duplicatedCollections.map((collection, index) => (
                <CollectionCard
                  key={`${collection.symbol}-${timeframe}-${Math.floor(index / collections.length)}`}
                  collection={collection}
                  index={index % collections.length}
                  timeframe={timeframe}
                />
              ))}
            </motion.div>

            {/* Gradient overlays for fade effect */}
            <div className="absolute left-0 top-0 w-8 sm:w-12 h-full bg-gradient-to-r from-black via-black/50 to-transparent pointer-events-none z-10" />
            <div className="absolute right-0 top-0 w-8 sm:w-12 h-full bg-gradient-to-l from-black via-black/50 to-transparent pointer-events-none z-10" />
          </div>
        </div>
      </section>
    );
  });

  ScrollSection.displayName = 'ScrollSection';

  if (loading) {
    return (
      <div className="bg-black min-h-screen">
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Popular Collections
              </h2>
              <p className="text-gray-300 text-lg">Loading the hottest NFT collections on Solana...</p>
            </motion.div>

            {/* Loading skeleton for 3 sections */}
            {[1, 2, 3].map((section) => (
              <div key={section} className="mb-16">
                <div className="flex justify-center mb-6">
                  <div className="w-64 h-8 bg-gray-800/50 rounded animate-pulse" />
                </div>
                <div className="flex gap-6 justify-center">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="flex-shrink-0 w-72 sm:w-80 h-80 sm:h-96 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl animate-pulse"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/20 rounded-xl p-8"
            >
              <h2 className="text-2xl font-bold text-white mb-2">Unable to Load Collections</h2>
              <p className="text-gray-300 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Retry
              </button>
            </motion.div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen overflow-x-hidden">
      {/* Background decoration */}
      <motion.div
        className="absolute top-0 left-0 w-96 h-96 bg-green-500/5 rounded-full blur-3xl"
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
      
      {/* Main header */}
      <section className="pt-12 pb-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 flex items-center justify-center gap-3 sm:gap-4">
              <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-green-400" />
              Popular Collections
            </h1>
            <p className="text-gray-300 text-base sm:text-lg max-w-2xl mx-auto">
              Discover the hottest NFT collections on Solana across different timeframes
            </p>
          </motion.div>
        </div>
      </section>

      {/* Three horizontal scroll sections */}
      <div className="space-y-8 sm:space-y-12">
        <ScrollSection 
          timeframe="1h" 
          title="🔥 Hot Right Now - 1 Hour" 
          icon={Clock} 
          direction="left" 
        />
        
        <ScrollSection 
          timeframe="1d" 
          title="📈 Daily Trending - 24 Hours" 
          icon={Calendar} 
          direction="right" 
        />
        
        <ScrollSection 
          timeframe="7d" 
          title="⭐ Weekly Champions - 7 Days" 
          icon={CalendarDays} 
          direction="left" 
        />
      </div>

      {/* Footer */}
      <section className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8 }}
          >
            <p className="text-gray-400 text-sm">
              Data powered by{' '}
              <a 
                href="https://magiceden.io" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-green-400 hover:text-green-300 transition-colors"
              >
                Magic Eden
              </a>
              {' '}• Cached for 5 minutes
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
});

TrendingCollections.displayName = 'TrendingCollections';

export default TrendingCollections;