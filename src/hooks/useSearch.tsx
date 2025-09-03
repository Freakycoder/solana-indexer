import { useState, useEffect, useCallback, useRef } from 'react';
import axios, { AxiosError, CancelTokenSource } from 'axios';

interface NFTSearchResult {
  mint_address: string;
  nft_name: string;
  score: number;
}

interface SearchResponse {
  results: NFTSearchResult[];
}

interface UseSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  results: NFTSearchResult[];
  isSearching: boolean;
  error: string | null;
  clearSearch: () => void;
  clearError: () => void;
}
const api = axios.create({
  baseURL: 'http://localhost:3001',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const useSearch = (): UseSearchReturn => {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<NFTSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cancelTokenRef = useRef<CancelTokenSource | null>(null);

  // Cancel pending requests
  const cancelPendingRequests = useCallback(() => {
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel('Request canceled by user');
      cancelTokenRef.current = null;
    }
  }, []);

  // Clear search state
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
    setIsSearching(false);
    cancelPendingRequests();
  }, [cancelPendingRequests]);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Perform search
  const search = useCallback(async (searchQuery: string): Promise<void> => {
    const trimmedQuery = searchQuery.trim();
    
    // Clear results if query is empty
    if (!trimmedQuery) {
      setResults([]);
      setError(null);
      setIsSearching(false);
      return;
    }

    // Cancel any pending requests
    cancelPendingRequests();

    // Create new cancel token
    cancelTokenRef.current = axios.CancelToken.source();

    try {
      setIsSearching(true);
      setError(null);

      console.log('Searching for:', trimmedQuery);

      // Call backend API: /search/nfts/{query}
      const response = await api.get<SearchResponse>(
        `/search/nfts/${encodeURIComponent(trimmedQuery)}`,
        {
          cancelToken: cancelTokenRef.current.token,
        }
      );

      console.log('Search response:', response.data);

      const transformedResults: NFTSearchResult[] = response.data.results.map((result : any) => ({
        mint_address: result.mint_address,
        nft_name: result.nft_name,
        score: result.score
      }));

      setResults(transformedResults);
      
    } catch (err) {
      // Don't show error for canceled requests
      if (axios.isCancel(err)) {
        console.log('Search request canceled');
        return;
      }
      
      setResults([]);
    } finally {
      setIsSearching(false);
      cancelTokenRef.current = null;
    }
  }, [cancelPendingRequests]);

  // Debounced search effect
  useEffect(() => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout for debounced search
    debounceTimeoutRef.current = setTimeout(() => {
      search(query);
    }, 400); // 400ms debounce

    // Cleanup timeout on query change
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [query, search]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelPendingRequests();
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [cancelPendingRequests]);

  return {
    query,
    setQuery,
    results,
    isSearching,
    error,
    clearSearch,
    clearError,
  };
};

export default useSearch;
export type { NFTSearchResult, SearchResponse, UseSearchReturn };