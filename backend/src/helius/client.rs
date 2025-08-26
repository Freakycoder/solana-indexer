use reqwest::{header::CONTENT_TYPE, Client};

use crate::types::{
    helius::{HeliusAsset, HeliusAssetResponse, RequestBody},
    metadeta::Metadata,
};
use mpl_token_metadata::types::TokenStandard;
use crate::entities::nft_metadata::ActiveModel as NftActiveModel;
use sea_orm::{ActiveModelTrait, DatabaseConnection, DbErr, Set};


pub struct HeliusClient {
    helius_url: String,
    db : DatabaseConnection
}

impl HeliusClient {
    pub fn connect(url: String , db : DatabaseConnection) -> Self {
        println!("Initialized url for helius");
        Self { helius_url: url , db }
    }

    pub async fn get_assets(&self) -> Result<(), Box<dyn std::error::Error>> {
        let client = Client::new();

        let request_body = RequestBody {
            jsonrpc: "2.0".to_string(),
            id: 1,
            method: "searchAssets".to_string(),
            params: serde_json::json!({"conditionType":"all","page":1,"limit":2,"options":{"showCollectionMetadata":true,"showUnverifiedCollections":true}}),
        };

        let response = client
            .post(&self.helius_url)
            .header(CONTENT_TYPE, "application/json")
            .json(&request_body)
            .send()
            .await?;

        println!("Request sent to metaplex server");

        let helius_response: HeliusAssetResponse = response.json().await?;
        let metadata = self.filter_metadata(helius_response.result.items);
        for meta in metadata {
            let _ = self.save_metadata_to_db(meta).await;
        }
        Ok(())
    }

    pub fn filter_metadata(&self, helius_data: Vec<HeliusAsset>) -> Vec<Metadata> {
        
        let metadata_array : Vec<Metadata> = helius_data.into_iter().map(|asset| {

            // extract the address with authority as "full"
            let update_authority = asset
                .authorities
                .iter()
                .find(|auth| auth.scopes.contains(&"full".to_string()))
                .map(|auth| auth.address.clone())
                .unwrap_or_default();
    
            // Extract collection name if available
            let collection_name = asset.grouping.as_ref().and_then(|groupings| {
                groupings
                    .iter()
                    .find(|g| g.group_key == "collection")
                    .and_then(|g| g.collection_metadata.as_ref())
                    .map(|meta| meta.name.clone())
            });
            let token_standard = self.map_interface_to_token_standard(&asset.interface);
            Metadata {
                mint_address: asset.id,
                metadata_address: None,
                name: asset.content.metadata.name,
                symbol: asset.content.metadata.symbol,
                uri: asset.content.json_uri,
                seller_fee_basis_points: asset.royalty.basis_points,
                update_authority,
                token_standard,
                collection: collection_name,
                primary_sale_happened: asset.royalty.primary_sale_happened,
                is_mutable: asset.mutable,
            }
        })
        .collect();

        metadata_array  
        }
        pub fn map_interface_to_token_standard(&self, interface: &str) -> Option<TokenStandard> {
            match interface {
                "V1_NFT" => Some(TokenStandard::NonFungible),
                "V1_PRINT" => Some(TokenStandard::NonFungibleEdition),
                "LEGACY_NFT" => Some(TokenStandard::NonFungible),
                "V1_TOKEN" => Some(TokenStandard::Fungible),
                "FUNGIBLE_TOKEN" => Some(TokenStandard::Fungible),
                "PROGRAMMABLE_NFT" => Some(TokenStandard::ProgrammableNonFungible),
                "V1_COLLECTION" => Some(TokenStandard::NonFungible),
                _ => None
            }
        }
    
        pub async fn save_metadata_to_db(&self, metadata : Metadata) -> Result<crate::entities::nft_metadata::Model, DbErr>{

            println!("saving helius metadata to db...");
            let metadata_model = NftActiveModel {
                metadata_address: Set(None),
                mint_address: Set(metadata.mint_address),
                name: Set(metadata.name),
                symbol: Set(metadata.symbol),
                uri: Set(metadata.uri),
                seller_fee_basis_points: Set(metadata.seller_fee_basis_points),
                update_authority: Set(metadata.update_authority),
                primary_sale_happened: Set(metadata.primary_sale_happened),
                is_mutable: Set(metadata.is_mutable),
                ..Default::default()
            };
    
            let result = metadata_model.insert(&self.db).await;
            println!("helius metadata Saved.");
            result
        }
    }

