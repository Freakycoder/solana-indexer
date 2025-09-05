import { useState, useEffect, useCallback, useRef } from 'react';
import axios, { CancelTokenSource } from 'axios';

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
      cancelTokenRef.current.cancel('Request canceled');
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
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
  }, [cancelPendingRequests]);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Perform search
  const search = useCallback(async (searchQuery: string): Promise<void> => {
    const trimmedQuery = searchQuery.trim();
    
    // Clear results if query is empty or too short
    if (!trimmedQuery || trimmedQuery.length < 2) {
      setResults([]);
      setError(null);
      setIsSearching(false);
      return;
    }

    // Cancel any pending requests
    cancelPendingRequests();

    // Create new cancel token
    const source = axios.CancelToken.source();
    cancelTokenRef.current = source;

    try {
      setIsSearching(true);
      setError(null);

      console.log('Searching for:', trimmedQuery);

      const response = await axios.get<SearchResponse>(
        `http://localhost:3001/search/nfts/${encodeURIComponent(trimmedQuery)}`,
        {
          cancelToken: source.token,
          timeout: 8000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // Check if request was cancelled
      if (source.token.reason) {
        return;
      }

      console.log('Search response:', response.data);

      // Validate and transform results
      const validResults: NFTSearchResult[] = [];
      
      if (response.data && Array.isArray(response.data.results)) {
        for (const result of response.data.results) {
          if (result && 
              typeof result.mint_address === 'string' && 
              typeof result.nft_name === 'string' && 
              result.mint_address.length > 0 && 
              result.nft_name.length > 0) {
            validResults.push({
              mint_address: result.mint_address,
              nft_name: result.nft_name,
              score: typeof result.score === 'number' ? result.score : 0
            });
          }
        }
      }

      setResults(validResults);
      
    } catch (err) {
      // Don't show error for canceled requests
      if (axios.isCancel(err)) {
        console.log('Search request canceled');
        return;
      }
      
      console.error('Search error:', err);
      setResults([]);
      setError('Search failed. Please try again.');
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
      debounceTimeoutRef.current = null;
    }

    // Set new timeout for debounced search
    debounceTimeoutRef.current = setTimeout(() => {
      search(query);
    }, 300);

    // Cleanup function
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
    };
  }, [query, search]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelPendingRequests();
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
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