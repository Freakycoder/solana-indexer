use sea_orm::entity::prelude::*;
use serde::{Deserialize,Serialize};
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "nft_creator")]
pub struct Model{
    #[sea_orm(primary_key)]
    pub id: Uuid,
    pub metadata_address: String, // Foreign key to nft_metadata
    pub creator_address: String,
    pub verified: bool,
    pub share: i16, // Percentage share (0-100)
    
    pub created_at: DateTime,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::nft_metadata::Entity",
        from = "Column::MetadataAddress",
        to = "super::nft_metadata::Column::MetadataAddress"
    )]
    NftMetadata,
}

impl Related<super::nft_metadata::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::NftMetadata.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}