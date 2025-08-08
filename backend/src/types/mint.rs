use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct MintData{
    pub mint_address : String,
    pub owner : String,
    pub data_length : usize,
    pub mint_authority : String,
    pub supply : u64,
    pub decimal : u8,
    pub is_initialized : bool,
    pub freeze_authority : Option<String>
}