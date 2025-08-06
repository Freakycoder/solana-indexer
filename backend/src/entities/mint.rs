use sea_orm::entity::prelude::*;
use serde::{Deserialize,Serialize};
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "mint")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub mint_address : String,
    pub decimal : u8,
    pub supply : f64,
    #[sea_orm(column_type = "Text", nullable)]
    pub mint_authority : Option<String>,
    #[sea_orm(column_type = "Text", nullable)]
    pub freeze_authority : Option<String>,
    pub is_initialized : bool,
    pub created_at : DateTime
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::token_account::Entity")]
    TokenAccounts,
}

impl Related<super::token_account::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::TokenAccounts.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}