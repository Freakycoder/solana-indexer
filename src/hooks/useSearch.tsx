// src/hooks/useSearch.ts
import { useState, useEffect, useCallback, useRef } from 'react';

interface NFTResult {
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

interface SearchResponse {
  results: NFTResult[];
  total: number;
  page: number;
  hasMore: boolean;
}

interface UseSearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
  initialPage?: number;
  pageSize?: number;
}

interface UseSearchReturn {
  // Search state
  query: string;
  setQuery: (query: string) => void;
  results: NFTResult[];
  isSearching: boolean;
  error: string | null;
  
  // Pagination
  currentPage: number;
  totalResults: number;
  hasMore: boolean;
  loadMore: () => void;
  
  // Search control
  search: (searchQuery: string, page?: number) => Promise<void>;
  clearSearch: () => void;
  clearError: () => void;
  
  // Request management
  cancelPendingRequests: () => void;
}

const useSearch = (options: UseSearchOptions = {}): UseSearchReturn => {
  const {
    debounceMs = 400,
    minQueryLength = 0,
    initialPage = 1,
    pageSize = 20
  } = options;

  // State management
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<NFTResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);

  // Refs for cleanup and request management
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastQueryRef = useRef<string>('');
  const isMountedRef = useRef<boolean>(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      cancelPendingRequests();
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Cancel pending requests
  const cancelPendingRequests = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Clear search state
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
    setCurrentPage(initialPage);
    setTotalResults(0);
    setHasMore(false);
    setIsSearching(false);
    cancelPendingRequests();
  }, [initialPage, cancelPendingRequests]);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Perform search API call
  const performSearch = useCallback(async (
    searchQuery: string, 
    page: number = 1,
    append: boolean = false
  ): Promise<void> => {
    // Cancel any pending requests
    cancelPendingRequests();

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    try {
      setIsSearching(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams({
        q: searchQuery,
        page: page.toString(),
        limit: pageSize.toString()
      });

      // Make API request
      const response = await fetch(`/api/search?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal
      });

      // Check if component is still mounted
      if (!isMountedRef.current) return;

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data: SearchResponse = await response.json();

      // Update state only if component is still mounted
      if (isMountedRef.current) {
        if (append && page > 1) {
          setResults(prev => [...prev, ...data.results]);
        } else {
          setResults(data.results);
        }
        
        setCurrentPage(data.page);
        setTotalResults(data.total);
        setHasMore(data.hasMore);
      }

    } catch (err) {
      // Only handle errors if component is still mounted and request wasn't aborted
      if (isMountedRef.current && !signal.aborted) {
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(errorMessage);
        console.error('Search error:', err);
      }
    } finally {
      if (isMountedRef.current) {
        setIsSearching(false);
      }
    }
  }, [pageSize]);

  // Main search function
  const search = useCallback(async (searchQuery: string, page: number = 1): Promise<void> => {
    const trimmedQuery = searchQuery.trim();
    
    // Skip search if query is too short
    if (trimmedQuery.length < minQueryLength) {
      if (trimmedQuery.length === 0) {
        clearSearch();
      }
      return;
    }

    // Track the last query to prevent duplicate requests
    lastQueryRef.current = trimmedQuery;

    await performSearch(trimmedQuery, page, false);
  }, [minQueryLength, performSearch, clearSearch]);

  // Load more results (pagination)
  const loadMore = useCallback(async (): Promise<void> => {
    if (!hasMore || isSearching || !query.trim()) return;

    const nextPage = currentPage + 1;
    await performSearch(query.trim(), nextPage, true);
  }, [hasMore, isSearching, query, currentPage, performSearch]);

  // Debounced search effect
  useEffect(() => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout for debounced search
    debounceTimeoutRef.current = setTimeout(() => {
      const trimmedQuery = query.trim();
      
      // Only search if query changed and meets minimum length
      if (trimmedQuery !== lastQueryRef.current) {
        search(trimmedQuery);
      }
    }, debounceMs);

    // Cleanup timeout on query change
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [query, search, debounceMs]);

  return {
    // Search state
    query,
    setQuery,
    results,
    isSearching,
    error,
    
    // Pagination
    currentPage,
    totalResults,
    hasMore,
    loadMore,
    
    // Search control
    search,
    clearSearch,
    clearError,
    
    // Request management
    cancelPendingRequests
  };
};

export default useSearch;
export type { NFTResult, SearchResponse, UseSearchOptions, UseSearchReturn };