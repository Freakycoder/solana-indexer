use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "nft_ownership")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: Uuid,
    #[sea_orm(unique)]
    pub mint_address: String,
    pub owner: String,
    #[sea_orm(column_type = "Text", nullable)]
    pub delegate: Option<String>,
    pub frozen: bool,
    pub delegated: bool,
    pub ownership_model: String, // "single", "fractional", etc.
    pub updated_at: DateTime,
    pub created_at: DateTime,
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