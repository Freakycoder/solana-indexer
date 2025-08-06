use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct MintData{
    pub mint_address : String,
    pub owner : String,
    pub data_length : u64,
    pub mint_authority : String,
    pub supply : f64,
    pub decimal : u32,
    pub is_initialized : bool,
    pub freeze_authority : Option<String>
}