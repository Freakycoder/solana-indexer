import { TrendingCollection } from "@/types";

const MAGIC_EDEN_BASE_URL = "/api/magic-eden";

export class MagicEdenAPIService {
  private static instance: MagicEdenAPIService;

  private constructor() {}

  public static getInstance(): MagicEdenAPIService {
    if (!MagicEdenAPIService.instance) {
      MagicEdenAPIService.instance = new MagicEdenAPIService();
    }
    return MagicEdenAPIService.instance;
  }

  private async makeRequest<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${MAGIC_EDEN_BASE_URL}${endpoint}`, {
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0 (compatible; NFT-Indexer/1.0)",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Magic Eden API error: ${response.status} ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Magic Eden API request failed:", error);
      throw error;
    }
  }

  public async getPopularCollections(
    timeRange: '1h' | '1d' | '7d' | '30d' = '1h'
  ): Promise<TrendingCollection[]> {
    try {
      const endpoint = `/marketplace/popular_collections?timeRange=${timeRange}`;
      const data = await this.makeRequest<any>(endpoint);

      const collections: TrendingCollection[] = data.map((item: any, index: number) => ({
        symbol: item.symbol,
        name: item.name || item.symbol,
        image: item.image || "/placeholder-collection.jpg",
        floorPrice: item.floorPrice ? item.floorPrice / 1000000000 : undefined,
        volumeAll: item.volumeAll ? item.volumeAll / 1000000000 : undefined,
        description: item.description,
        verified: false,
        featured: false,
        hasCNFTs: item.hasCNFTs || false,
        rank: index + 1,
        timeRange: timeRange,
      }));

      return collections;
    } catch (error) {
      console.error("Failed to fetch popular collections:", error);
      return [];
    }
  }

  public async getAllTimeframeCollections(): Promise<{
    collections: TrendingCollection[];
    timeframeData: Record<string, TrendingCollection[]>;
  }> {
    try {
      const timeframes: ('1h' | '1d' | '7d')[] = ['1h', '1d', '7d'];
      const promises = timeframes.map(timeframe => 
        this.getPopularCollections(timeframe)
      );
      
      const results = await Promise.all(promises);
      const timeframeData: Record<string, TrendingCollection[]> = {};
      
      timeframes.forEach((timeframe, index) => {
        timeframeData[timeframe] = results[index];
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

  public async getTrendingCollections(
    limit = 25
  ): Promise<TrendingCollection[]> {
    try {
      const endpoint = `/marketplace/trending_collections?timeRange=24h&limit=${limit}`;
      const data = await this.makeRequest<any>(endpoint);

      const collections: TrendingCollection[] = data.map((item: any) => ({
        symbol: item.symbol,
        name: item.name || item.symbol,
        image: item.image || "/placeholder-collection.jpg",
        floorPrice: item.floorPrice ? item.floorPrice / 1000000000 : undefined,
        volume1d: item.volume24hr ? item.volume24hr / 1000000000 : undefined,
        avgPrice24hr: item.avgPrice24hr ? item.avgPrice24hr / 1000000000 : undefined,
        listedCount: item.listedCount,
        sales1d: item.sales24hr,
        topBid: item.topBid ? item.topBid / 1000000000 : undefined,
        floorChange1d: item.floorChange24hr,
        sparkline: item.sparkline || [],
        verified: item.verified || false,
        featured: item.featured || false,
        description: item.description,
        twitter: item.twitter,
        discord: item.discord,
        website: item.website,
      }));

      return collections;
    } catch (error) {
      console.error("Failed to fetch trending collections:", error);
      return [];
    }
  }

  public async getCollectionStats(symbol: string) {
    return this.makeRequest(`/collections/${symbol}/stats`);
  }

  public async getCollectionMetadata(symbol: string) {
    return this.makeRequest(`/collections/${symbol}`);
  }
}

export const magicEdenAPI = MagicEdenAPIService.getInstance();
