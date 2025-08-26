use reqwest::{header::CONTENT_TYPE, Client};

use crate::types::{
    helius::{HeliusAsset, HeliusAssetResponse, RequestBody},
    metadeta::Metadata,
};
use mpl_token_metadata::types::TokenStandard;

pub struct HeliusClient {
    helius_url: String,
}

impl HeliusClient {
    pub fn connect(url: String) -> Self {
        println!("Initialized url for helius");
        Self { helius_url: url }
    }

    pub async fn get_assets(&self) -> Result<HeliusAssetResponse, Box<dyn std::error::Error>> {
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
        Ok(helius_response)
    }

    pub fn extract_metadata(&self, helius_data: HeliusAsset) -> Metadata {
        // extract the address with authority as "full"
        let update_authority = helius_data
            .authorities
            .iter()
            .find(|auth| auth.scopes.contains(&"full".to_string()))
            .map(|auth| auth.address.clone())
            .unwrap_or_default();

        // Extract collection name if available
        let collection_name = helius_data.grouping.as_ref().and_then(|groupings| {
            groupings
                .iter()
                .find(|g| g.group_key == "collection")
                .and_then(|g| g.collection_metadata.as_ref())
                .map(|meta| meta.name.clone())
        });

        let token_standard = self.map_interface_to_token_standard(&helius_data.interface);

        let mint_reponse = Metadata {
            mint_address: helius_data.id,
            metadata_address: None,
            name: helius_data.content.metadata.name,
            symbol: helius_data.content.metadata.symbol,
            uri: helius_data.content.json_uri,
            seller_fee_basis_points: helius_data.royalty.basis_points,
            update_authority,
            token_standard,
            collection: collection_name,
            primary_sale_happened: helius_data.royalty.primary_sale_happened,
            is_mutable: helius_data.mutable,
        };

        mint_reponse
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
    
}
