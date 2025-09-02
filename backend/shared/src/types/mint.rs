use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct MintData{
    pub mint_address : String,
    pub owner : String,
    pub data_length : usize,
    pub mint_authority : String,
    pub supply : u64,
    pub decimal : u8,
    pub is_initialized : bool,
    pub freeze_authority : Option<String>
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct MintResponse{
    pub mint_address : String,
    pub owner : String,
    pub mint_authority : String,
    pub supply : u64,
    pub decimal : u8,
    pub is_initialized : bool,
    pub freeze_authority : Option<String>,
    pub metadata : PartialMetadata
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct PartialMetadata{
    pub name : Option<String>,
    pub symbol : Option<String>,
    pub uri : Option<String>,
    pub seller_fee_basis_points : i32,
    pub update_authority : Option<String>,
    pub primary_sale_happened : bool,
    pub is_mutable : bool,
}