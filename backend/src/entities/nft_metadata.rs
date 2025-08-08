use sea_orm::entity::prelude::*;
use serde::{Deserialize,Serialize};
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "nft_metadata")]
pub struct Model{
    #[sea_orm(primary_key, auto_increment = false)]
    pub metadata_address : String,
    pub mint_address : String,
    #[sea_orm(column_type = "Text")]
    pub name : String,
    #[sea_orm(column_type = "Text")]
    pub symbol : String,
    #[sea_orm(column_type = "Text")]
    pub uri : String,
    pub seller_fee_basis_pioints : i32,
    pub update_authority : String,
    pub primary_sale_happened : bool,
    pub is_mutable : bool, // tells wheather the metadata can be changed or updated
    pub created_at : DateTime
}
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm (
        belongs_to = "super::mint::Entity",
        from = "Column::MintAddress", 
        to = "super::mint::Column::MintAddress"
    )]
    Mint,
    
    #[sea_orm(has_many = "super::nft_creator::Entity")]
    NftCreators,
}

impl Related<super::mint::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Mint.def()
    }
}

impl Related<super::nft_creator::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::NftCreators.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
