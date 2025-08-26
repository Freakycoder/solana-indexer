use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "nft_royalty")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: Uuid,
    #[sea_orm(unique)]
    pub mint_address: String,
    #[sea_orm(column_type = "Text")]
    pub royalty_model: String, // "creators", "fanout", etc.
    #[sea_orm(column_type = "Text", nullable)]
    pub target: Option<String>, // Target address for royalties
    pub percent: f64, // Royalty percentage (0.0 to 1.0)
    pub basis_points: u16, // Basis points (0 to 10000)
    pub primary_sale_happened: bool,
    pub locked: bool,
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