use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "mint")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: Uuid,
    #[sea_orm(unique)]
    pub mint_address: String,
    pub decimal: u8,
    pub supply: u64,
    #[sea_orm(column_type = "Text", nullable)]
    pub mint_authority: Option<String>,
    #[sea_orm(column_type = "Text", nullable)]
    pub freeze_authority: Option<String>,
    pub is_initialized: bool,
    pub created_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::token_account::Entity")]
    TokenAccounts,
    // #[sea_orm(has_one = "super::nft_metadata::Entity")]
    // NftMetadata,
    #[sea_orm(has_one = "super::nft_json_metadata::Entity")]
    NftJsonMetadata,
    #[sea_orm(has_one = "super::nft_ownership::Entity")]
    NftOwnership,
    #[sea_orm(has_one = "super::nft_royalty::Entity")]
    NftRoyalty,
}

impl Related<super::token_account::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::TokenAccounts.def()
    }
}
// impl Related<super::nft_metadata::Entity> for Entity {
//     fn to() -> RelationDef {
//         Relation::NftMetadata.def()
//     }
// }

impl Related<super::nft_json_metadata::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::NftJsonMetadata.def()
    }
}

impl Related<super::nft_ownership::Entity> for Entity {
    
    fn to() -> RelationDef {
        Relation::NftOwnership.def()
    }
}

impl Related<super::nft_royalty::Entity> for Entity {
    
    fn to() -> RelationDef {
        Relation::NftRoyalty.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
