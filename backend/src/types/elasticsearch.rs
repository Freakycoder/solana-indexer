use serde::{Serialize};

#[derive(Debug, Serialize)]
pub struct SearchResult{
    pub mint_address : String,
    pub collection_name : String,
    pub score : f64
}

#[derive(Debug, Serialize)]
pub struct SearchResponse{
    pub results : Vec<SearchResult>
}