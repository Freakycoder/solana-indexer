use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Metadata{
    pub metadata_address : String,
    pub mint_address : String,
    pub name : String,
    pub symbol : String,
    pub uri : String,
    pub seller_fee_basis_points : u16,
    pub update_authority : String,
    pub primary_sale_happened : bool,
    pub is_mutable : bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TokenStandard {
    NonFungible,
    FungibleAsset,
    Fungible,
    NonFungibleEdition,
    ProgrammableNonFungible,
    ProgrammableNonFungibleEdition,
}