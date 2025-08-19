import type { NextApiRequest, NextApiResponse } from 'next';

const MAGIC_EDEN_V2_URL = 'https://api-mainnet.magiceden.dev/v2';
const MAGIC_EDEN_V3_URL = 'https://api-mainnet.magiceden.dev/v3/rtp/solana';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { path, ...queryParams } = req.query;
    const endpoint = Array.isArray(path) ? path.join('/') : path;
    
    // Filter out the path from query params for the URL construction
    const filteredParams = Object.fromEntries(
      Object.entries(queryParams).filter(([key]) => key !== 'path')
    );
    const queryString = new URLSearchParams(filteredParams as Record<string, string>).toString();
    
    // Try v2 first for legacy endpoints, then v3
    const v2Url = `${MAGIC_EDEN_V2_URL}/${endpoint}${queryString ? `?${queryString}` : ''}`;
    
    console.log('Trying v2 API:', v2Url);

    let response = await fetch(v2Url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; NFT-Indexer/1.0)',
      },
    });

    // If v2 fails, try v3
    if (!response.ok && response.status === 404) {
      const v3Url = `${MAGIC_EDEN_V3_URL}/${endpoint}${queryString ? `?${queryString}` : ''}`;
      console.log('v2 failed, trying v3 API:', v3Url);
      
      response = await fetch(v3Url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; NFT-Indexer/1.0)',
        },
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Magic Eden API error: ${response.status} ${response.statusText}`, errorText);
      return res.status(response.status).json({ 
        error: `Magic Eden API error: ${response.status} ${response.statusText}`,
        details: errorText 
      });
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Magic Eden API proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch from Magic Eden API', details: error instanceof Error ? error.message : 'Unknown error' });
  }
}