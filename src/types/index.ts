export interface NFTResult {
  mint_address: string;
  nft_name: string;
  score: number;
  image?: string;
  price?: number;
  collection?: string;
  rarity?: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  volume24h?: number;
  lastSale?: number;
}

export interface SearchResponse {
  results: NFTResult[];
}

export interface TrendingCollection {
  symbol: string;
  name: string;
  image: string;
  floorPrice?: number;
  volumeAll?: number;
  volume1d?: number;
  volume7d?: number;
  volume30d?: number;
  avgPrice24hr?: number;
  listedCount?: number;
  marketCap?: number;
  sales1d?: number;
  sales7d?: number;
  sales30d?: number;
  description?: string;
  twitter?: string;
  discord?: string;
  website?: string;
  verified?: boolean;
  featured?: boolean;
  topBid?: number;
  floorChange1d?: number;
  sparkline?: number[];
  hasCNFTs?: boolean;
  rank?: number;
  timeRange?: '1h' | '1d' | '7d' | '30d';
  primaryTimeframe?: '1h' | '1d' | '7d' | '30d';
  otherTimeframes?: ('1h' | '1d' | '7d' | '30d')[];
}

export interface TrendingCollectionsResponse {
  collections: TrendingCollection[];
  hasMore?: boolean;
  total?: number;
}

export type ViewMode = 'grid' | 'list';
export type SortOption = 'relevance' | 'price_low' | 'price_high' | 'recent' | 'volume';
export type FilterOption = 'all' | 'common' | 'rare' | 'epic' | 'legendary';