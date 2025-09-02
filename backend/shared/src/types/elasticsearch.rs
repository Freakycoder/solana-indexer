use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
pub struct SearchResult{
    pub mint_address : String,
    pub nft_name : String,
    pub score : f64
}

#[derive(Debug, Serialize)]
pub struct SearchResponse{
    pub results : Vec<SearchResult>
}

#[derive(Debug, Clone,Serialize, Deserialize)]
pub struct NftDoc{
    pub mint_address : String,
    pub nft_name : String
}