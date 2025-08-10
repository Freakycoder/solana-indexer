use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "token_accounts")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id : Uuid,
    #[sea_orm(unique)]
    pub token_address: String,
    #[sea_orm(unique)]
    pub mint_address: String,
    pub owner: String,
    pub amount: u64,
    
    #[sea_orm(column_type = "Text", nullable)]
    pub delegate: Option<String>,
    
    pub delegated_amount: String,
    pub state: u8, // 0 = Uninitialized, 1 = Initialized, 2 = Frozen
    
    #[sea_orm(column_type = "Text", nullable)]
    pub close_authority: Option<String>,
    
    pub is_native: bool,
    pub rent_exempt_reserve: String,
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
