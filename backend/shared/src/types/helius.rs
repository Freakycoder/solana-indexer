use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize,Serialize)]
pub struct RequestBody{
    pub jsonrpc: String,
    pub id: u64,
    pub method: String,
    pub params: serde_json::Value,
}

#[derive(Debug, Deserialize)]
pub struct HeliusAssetResponse {
    pub jsonrpc: String,
    pub result: HeliusResult,
    pub id: u64,
}

#[derive(Debug, Deserialize)]
pub struct HeliusResult {
    pub total: u32,
    pub limit: u32,
    pub page: u32,
    pub items: Vec<HeliusAsset>,
}

#[derive(Debug, Deserialize)]
pub struct HeliusAsset {
    pub interface: String,
    pub id: String,
    pub content: AssetContent,
    pub authorities: Vec<AuthorityInfo>,
    pub compression: Option<CompressionInfo>,
    pub grouping: Option<Vec<GroupingInfo>>,
    pub royalty: RoyaltyInfo,
    pub creators: Vec<CreatorInfo>,
    pub ownership: OwnershipInfo,
    pub supply: SupplyInfo,
    pub mutable: bool,
    pub burnt: bool,
}

#[derive(Debug, Deserialize)]
pub struct AssetContent {
    #[serde(rename = "$schema")]
    pub schema: Option<String>,
    pub json_uri: String,
    pub files: Option<Vec<FileInfo>>,
    pub metadata: MetadataContent,
    pub links: LinksInfo,
}

#[derive(Debug, Deserialize)]
pub struct FileInfo {
    pub uri: String,
    pub cdn_uri: Option<String>,
    pub mime: String,
}

#[derive(Debug, Deserialize)]
pub struct MetadataContent {
    pub attributes: Option<Vec<AttributeInfo>>,
    pub description: Option<String>,
    pub name: String,
    pub symbol: Option<String>,
    pub token_standard: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AttributeInfo {
    pub value: String,
    pub trait_type: String,
}

#[derive(Debug, Deserialize)]
pub struct LinksInfo {
    pub external_url: Option<String>,
    pub image: Option<String>,
    pub animation_url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AuthorityInfo {
    pub address: String,
    pub scopes: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct CompressionInfo {
    pub eligible: bool,
    pub compressed: bool,
    pub data_hash: Option<String>,
    pub creator_hash: Option<String>,
    pub asset_hash: Option<String>,
    pub tree: Option<String>,
    pub seq: Option<u64>,
    pub leaf_id: Option<u64>,
}

#[derive(Debug, Deserialize)]
pub struct GroupingInfo {
    pub group_key: String,
    pub group_value: String,
    pub verified: bool,
    pub collection_metadata: Option<CollectionMetadata>,
}

#[derive(Debug, Deserialize)]
pub struct CollectionMetadata {
    pub name: String,
    pub symbol: String,
    pub image: Option<String>,
    pub description: Option<String>,
    pub external_url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct RoyaltyInfo {
    pub royalty_model: String,
    pub target: Option<String>,
    pub percent: f64,
    pub basis_points: i32,
    pub primary_sale_happened: bool,
    pub locked: bool,
}

#[derive(Debug, Deserialize)]
pub struct CreatorInfo {
    pub address: String,
    pub share: u8,
    pub verified: bool,
}

#[derive(Debug, Deserialize)]
pub struct OwnershipInfo {
    pub frozen: bool,
    pub delegated: bool,
    pub delegate: Option<String>,
    pub ownership_model: String,
    pub owner: String,
}

#[derive(Debug, Deserialize)]
pub struct SupplyInfo {
    pub print_max_supply: u32,
    pub print_current_supply: u32,
    pub edition_nonce: Option<u32>,
}