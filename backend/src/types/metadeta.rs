use mpl_token_metadata::types::TokenStandard;

#[derive(Debug, Clone)]
pub struct Metadata{
    pub mint_address : String,
    pub metadata_address : String,
    pub name : String,
    pub symbol : String,
    pub uri : String,
    pub seller_fee_basis_points : u16,
    pub update_authority : String,
    pub token_standard : Option<TokenStandard>,
    pub primary_sale_happened : bool,
    pub is_mutable : bool,
}