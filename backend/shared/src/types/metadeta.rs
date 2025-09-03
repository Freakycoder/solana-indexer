use mpl_token_metadata::types::{TokenStandard};

#[derive(Debug, Clone)]
pub struct Metadata{
    pub mint_address : String,
    pub metadata_address : Option<String>,
    pub name : String,
    pub symbol : Option<String>,
    pub uri : String,
    pub seller_fee_basis_points : i16,
    pub update_authority : String,
    pub token_standard : Option<TokenStandard>,
    pub collection : Option<String>,
    pub primary_sale_happened : bool,
    pub is_mutable : bool,
}