use reqwest::{header::CONTENT_TYPE, Client};

use crate::types::{helius::{HeliusAsset, HeliusAssetResponse, RequestBody}, metadeta::Metadata, mint::MintResponse};

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

    pub fn extract_metadata(helius_data : HeliusAsset) -> Metadata{
        let mint_reponse = Metadata {
            mint_address : helius_data.id,
            metadata_address : None,
            name : helius_data.content.metadata.name,
            symbol : helius_data.content.metadata.symbol,
            uri : helius_data.content.json_uri,
            seller_fee_basis_points : helius_data.royalty.basis_points,
            update_authority : helius_data.authorities[0].address,
            token_standard : helius_data.interface,
            collection : Some(helius_data.grouping[])
        };
    }
}
