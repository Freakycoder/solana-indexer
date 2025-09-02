// src/services/magicEdenAPI.ts
import { TrendingCollection } from "@/types";

const MAGIC_EDEN_BASE_URL = "/api/magic-eden";

// Request cache to prevent duplicate requests
const requestCache = new Map<string, Promise<any>>();
const CACHE_DURATION = 30 * 1000; // 30 seconds

// Rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 100; // 100ms between requests

export class MagicEdenAPIService {
  private static instance: MagicEdenAPIService;

  private constructor() {}

  public static getInstance(): MagicEdenAPIService {
    if (!MagicEdenAPIService.instance) {
      MagicEdenAPIService.instance = new MagicEdenAPIService();
    }
    return MagicEdenAPIService.instance;
  }

  private async makeRequest<T>(endpoint: string, retries: number = 2): Promise<T> {
    const cacheKey = endpoint;
    
    // Check if we have a pending request for this endpoint
    if (requestCache.has(cacheKey)) {
      return requestCache.get(cacheKey);
    }

    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await new Promise(resolve => 
        setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
      );
    }
    lastRequestTime = Date.now();

    const requestPromise = this.executeRequest<T>(endpoint, retries);
    
    // Cache the promise
    requestCache.set(cacheKey, requestPromise);
    
    // Clear cache after duration
    setTimeout(() => {
      requestCache.delete(cacheKey);
    }, CACHE_DURATION);

    try {
      return await requestPromise;
    } catch (error) {
      // Remove failed request from cache immediately
      requestCache.delete(cacheKey);
      throw error;
    }
  }

  private async executeRequest<T>(endpoint: string, retries: number): Promise<T> {
    let lastError: Error = new Error('Request failed');

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(`${MAGIC_EDEN_BASE_URL}${endpoint}`, {
          headers: {
            Accept: "application/json",
            "User-Agent": "Mozilla/5.0 (compatible; NFT-Indexer/1.0)",
            "Cache-Control": "no-cache",
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          // Handle specific HTTP errors
          if (response.status === 429) {
            // Rate limited - wait and retry
            if (attempt < retries) {
              await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
              continue;
            }
          }
          
          if (response.status === 404) {
            throw new Error(`Magic Eden endpoint not found: ${endpoint}`);
          }

          const errorText = await response.text().catch(() => 'Unknown error');
          throw new Error(
            `Magic Eden API error: ${response.status} ${response.statusText} - ${errorText}`
          );
        }

        const data = await response.json();
        return data;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Don't retry on abort or client errors
        if (error instanceof Error && 
            (error.name === 'AbortError' || error.message.includes('404'))) {
          throw lastError;
        }

        // Wait before retrying
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
        }

        console.warn(`Magic Eden API request attempt ${attempt + 1} failed:`, lastError.message);
      }
    }

    console.error("Magic Eden API request failed after all retries:", lastError);
    throw lastError;
  }

  public async getPopularCollections(
    timeRange: '1h' | '1d' | '7d' | '30d' = '1h'
  ): Promise<TrendingCollection[]> {
    try {
      const endpoint = `/marketplace/popular_collections?timeRange=${timeRange}`;
      const data = await this.makeRequest<any[]>(endpoint);

      if (!Array.isArray(data)) {
        console.warn('Magic Eden API returned non-array data:', data);
        return [];
      }

      const collections: TrendingCollection[] = data
        .filter(item => item && typeof item === 'object') // Filter out invalid items
        .map((item: any, index: number) => ({
          symbol: item.symbol || `unknown-${index}`,
          name: item.name || item.symbol || `Collection ${index + 1}`,
          image: item.image || "/placeholder-collection.jpg",
          floorPrice: this.convertLamportsToSOL(item.floorPrice),
          volumeAll: this.convertLamportsToSOL(item.volumeAll),
          description: item.description || '',
          verified: Boolean(item.verified),
          featured: Boolean(item.featured),
          hasCNFTs: Boolean(item.hasCNFTs),
          rank: index + 1,
          timeRange: timeRange,
        }))
        .filter(collection => collection.symbol !== 'unknown'); // Filter out invalid collections

      console.log(`Fetched ${collections.length} collections for ${timeRange}`);
      return collections;

    } catch (error) {
      console.error(`Failed to fetch popular collections for ${timeRange}:`, error);
      
      // Return fallback data for development/testing
      if (process.env.NODE_ENV === 'development') {
        return this.getFallbackCollections(timeRange);
      }
      
      return [];
    }
  }

  public async getAllTimeframeCollections(): Promise<{
    collections: TrendingCollection[];
    timeframeData: Record<string, TrendingCollection[]>;
  }> {
    try {
      const timeframes: ('1h' | '1d' | '7d')[] = ['1h', '1d', '7d'];
      
      // Use Promise.allSettled to handle partial failures
      const results = await Promise.allSettled(
        timeframes.map(timeframe => this.getPopularCollections(timeframe))
      );
      
      const timeframeData: Record<string, TrendingCollection[]> = {};
      
      results.forEach((result, index) => {
        const timeframe = timeframes[index];
        if (result.status === 'fulfilled') {
          timeframeData[timeframe] = result.value;
        } else {
          console.warn(`Failed to fetch ${timeframe} data:`, result.reason);
          timeframeData[timeframe] = [];
        }
      });

      // Create unified collections list with smart ranking
      const allCollections = new Map<string, TrendingCollection>();
      const seenSymbols = new Set<string>();
      
      // Priority order: 1h -> 1d -> 7d
      timeframes.forEach(timeframe => {
        timeframeData[timeframe].forEach(collection => {
          if (!seenSymbols.has(collection.symbol)) {
            seenSymbols.add(collection.symbol);
            const enhancedCollection: TrendingCollection = {
              ...collection,
              primaryTimeframe: timeframe,
              otherTimeframes: [],
            };
            allCollections.set(collection.symbol, enhancedCollection);
          } else {
            // Add to otherTimeframes for multi-timeframe badge
            const existing = allCollections.get(collection.symbol);
            if (existing && existing.otherTimeframes) {
              existing.otherTimeframes.push(timeframe);
            }
          }
        });
      });

      return {
        collections: Array.from(allCollections.values()),
        timeframeData,
      };
    } catch (error) {
      console.error("Failed to fetch all timeframe collections:", error);
      return { collections: [], timeframeData: {} };
    }
  }

  public async getTrendingCollections(limit = 25): Promise<TrendingCollection[]> {
    try {
      const endpoint = `/marketplace/trending_collections?timeRange=24h&limit=${limit}`;
      const data = await this.makeRequest<any[]>(endpoint);

      if (!Array.isArray(data)) {
        console.warn('Magic Eden API returned non-array data for trending:', data);
        return [];
      }

      const collections: TrendingCollection[] = data
        .filter(item => item && typeof item === 'object')
        .map((item: any) => ({
          symbol: item.symbol || 'unknown',
          name: item.name || item.symbol || 'Unknown Collection',
          image: item.image || "/placeholder-collection.jpg",
          floorPrice: this.convertLamportsToSOL(item.floorPrice),
          volume1d: this.convertLamportsToSOL(item.volume24hr),
          avgPrice24hr: this.convertLamportsToSOL(item.avgPrice24hr),
          listedCount: item.listedCount || 0,
          sales1d: item.sales24hr || 0,
          topBid: this.convertLamportsToSOL(item.topBid),
          floorChange1d: item.floorChange24hr || 0,
          sparkline: Array.isArray(item.sparkline) ? item.sparkline : [],
          verified: Boolean(item.verified),
          featured: Boolean(item.featured),
          description: item.description || '',
          twitter: item.twitter || '',
          discord: item.discord || '',
          website: item.website || '',
        }))
        .filter(collection => collection.symbol !== 'unknown');

      return collections;
    } catch (error) {
      console.error("Failed to fetch trending collections:", error);
      return [];
    }
  }

  public async getCollectionStats(symbol: string) {
    return this.makeRequest(`/collections/${encodeURIComponent(symbol)}/stats`);
  }

  public async getCollectionMetadata(symbol: string) {
    return this.makeRequest(`/collections/${encodeURIComponent(symbol)}`);
  }

  // Utility methods
  private convertLamportsToSOL(lamports: number | string | undefined): number | undefined {
    if (lamports === undefined || lamports === null) return undefined;
    const num = typeof lamports === 'string' ? parseFloat(lamports) : lamports;
    return isNaN(num) ? undefined : num / 1000000000;
  }

  private getFallbackCollections(timeRange: string): TrendingCollection[] {
    // Fallback data for development
    return [
      {
        symbol: "mad_lads",
        name: "Mad Lads",
        image: "https://creator-hub-prod.s3.us-east-2.amazonaws.com/mad_lads_pfp_1682211343777.png",
        floorPrice: 179.99,
        volumeAll: 2812.52,
        description: "Mad Lads NFT Collection",
        verified: true,
        featured: true,
        hasCNFTs: false,
        rank: 1,
        timeRange: timeRange as any,
      },
      {
        symbol: "tensorians",
        name: "TENSORIANS",
        image: "https://bafkreictk4t6dafy4p7bgpbvgrop76aajnlzllpue6wr4ynkyj3xxsejte.ipfs.nftstorage.link/",
        floorPrice: 59.0,
        volumeAll: 838.33,
        description: "Tensorians NFT Collection",
        verified: true,
        featured: false,
        hasCNFTs: true,
        rank: 2,
        timeRange: timeRange as any,
      },
    ];
  }

  // Clear cache manually if needed
  public clearCache(): void {
    requestCache.clear();
  }
}

export const magicEdenAPI = MagicEdenAPIService.getInstance();