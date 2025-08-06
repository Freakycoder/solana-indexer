use sea_orm::entity::prelude::*;
use serde::{Deserialize,Serialize};
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "nft_json_metadata")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub mint_address: String,
    
    // JSON metadata fields
    #[sea_orm(column_type = "Text", nullable)]
    pub description: Option<String>,
    
    #[sea_orm(column_type = "Text", nullable)]
    pub image: Option<String>,
    
    #[sea_orm(column_type = "Text", nullable)]
    pub animation_url: Option<String>,
    
    #[sea_orm(column_type = "Text", nullable)]
    pub external_url: Option<String>,
    
    // Attributes stored as JSON
    #[sea_orm(column_type = "JsonBinary", nullable)]
    pub attributes: Option<Json>, // [{"trait_type": "Background", "value": "Blue"}, ...]
    
    #[sea_orm(column_type = "JsonBinary", nullable)]
    pub properties: Option<Json>, // Additional properties
    
    // Collection info
    #[sea_orm(column_type = "Text", nullable)]
    pub collection_name: Option<String>,
    
    #[sea_orm(column_type = "Text", nullable)]
    pub collection_family: Option<String>,
    
    // Tracking
    pub last_fetched: Option<DateTime>,
    pub fetch_attempts: i32,
    pub created_at: DateTime,
    pub updated_at: DateTime,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::mint::Entity",
        from = "Column::MintAddress",
        to = "super::mint::Column::MintAddress"
    )]
    Mint,
}

impl Related<super::mint::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Mint.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}