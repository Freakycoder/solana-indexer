use std::time::Duration;
use tokio::time::sleep;

use crate::elasticsearch::client::ElasticSearchClient;
use crate::entities::mint::{ActiveModel, Model};
use crate::entities::nft_metadata::{ActiveModel as NftActiveModel, Model as NftModel};
use crate::types::elasticsearch::NftDoc;
use crate::types::metadeta::Metadata;
use crate::{redis::queue_manager::RedisQueue, types::mint::MintData};
use sea_orm::Set;
use sea_orm::{ActiveModelTrait, DatabaseConnection, DbErr};
use solana_program::pubkey::Pubkey;

pub struct QueueWorker {
    queue: RedisQueue,
    db: DatabaseConnection,
    elasticsearch_client: ElasticSearchClient,
}

impl QueueWorker {
    pub fn new(queue: RedisQueue, db: DatabaseConnection, client: ElasticSearchClient) -> Self {
        println!("initializing queue, db connection and es_client for worker to work on...");
        Self {
            queue,
            db,
            elasticsearch_client: client,
        }
    }

    pub async fn start_processing(&self) {
        println!("Started to process to the queue messages...");
        loop {
            match self.queue.dequeue_message("mint_data_message").await {
                Ok(Some(data)) => {
                    println!("Recived mint data from the queue");
                    println!("queue message : {:?}", data);
                    self.process_mint_data(data).await
                }
                Ok(None) => {
                    println!("Queue empty, no mint data recieved. sleeping for some time...");
                    sleep(Duration::from_millis(100)).await;
                }
                Err(e) => {
                    println!("Error getting the message from the queue {}", e);
                    sleep(Duration::from_secs(2)).await;
                }
            }
        }
    }

    async fn process_mint_data(&self, mint_data: MintData) {
        println!("🔄 Processing mint: {}", mint_data.mint_address);
        println!("🔍 Mint details - Decimal: {}, Supply: {}", mint_data.decimal, mint_data.supply);

        // Only filter out high-decimal tokens (6+ decimals are definitely not NFTs)
        if mint_data.decimal > 2 {
            println!("⚠️ Skipping high-decimal token (decimal: {}), definitely not an NFT", mint_data.decimal);
            return;
        }

        println!("🎨 Potential NFT/Collection detected - processing...");
        println!("💾 Attempting to save mint to database...");

        // Try to save mint, but don't stop if it already exists
        let mint_save_result = self.save_mint_to_db(mint_data.clone()).await;
        match mint_save_result {
            Ok(_) => {
                println!("✅ Successfully saved new mint to DB!");
            }
            Err(db_error) => {
                let error_string = format!("{:?}", db_error);
                if error_string.contains("duplicate key") || error_string.contains("already exists") {
                    println!("ℹ️ Mint already exists in database, continuing with metadata processing...");
                } else {
                    println!("❌ Unexpected database error: {:?}", db_error);
                    return; // Only return on unexpected errors
                }
            }
        }

        println!("📍 Getting the PDA address for the mint...");
        let metadata_pda_address = match self
            .queue
            .get_metadata_pda_address(&mint_data.mint_address)
        {
            Ok(pda) => {
                println!("✅ Successfully Found PDA: {}", pda);
                pda
            }
            Err(e) => {
                println!("❌ Failed to get PDA address: {}", e);
                return;
            }
        };

        println!("🔍 Getting the metadata from the PDA address...");
        match self
            .queue
            .parse_metadata_pda_data(mint_data.mint_address.clone(), metadata_pda_address)
            .await
        {
            Ok(Some(metadata_data)) => {
                println!("Successfully parsed metadata bytes");
                println!("Saving the metadata info to the db...");
                let nft_name_clone = metadata_data.name.clone().replace('\0', "").trim().to_string();
                
                match self
                    .save_metadata_to_db(
                        metadata_data,
                        metadata_pda_address,
                        mint_data.mint_address.clone(),
                    )
                    .await
                {
                    Ok(_) => {
                        println!(" Successfully saved metadata to db");
                        let nft_doc = NftDoc {
                            mint_address: mint_data.mint_address,
                            nft_name: nft_name_clone,
                        };
                        
                        match self.elasticsearch_client.create_nft_index(nft_doc).await {
                            Ok(_) => {
                                println!(" Successfully indexed NFT in Elasticsearch");
                            }
                            Err(e) => {
                                println!(" Failed to create Elasticsearch index: {}", e);
                            }
                        }
                    }
                    Err(e) => {
                        let error_string = format!("{:?}", e);
                        if error_string.contains("duplicate key") {
                            println!("Metadata already exists, skipping...");
                        } else {
                            println!("Error saving metadata to db: {}", e);
                        }
                    }
                }
            }
            Ok(None) => {
                println!(" No metadata account found for this mint");
                println!(" This could be because:");
                println!("   - It's a regular token without metadata");
                println!("   - The metadata account doesn't exist"); 
                println!("   - RPC rate limiting or network issues");
            }
            Err(e) => {
                println!("❌ Failed to parse metadata bytes: {}", e);
            }
        }
    }

    async fn save_mint_to_db(&self, mint_data: MintData) -> Result<Model, DbErr> {
        let mint_model = ActiveModel {
            mint_address: Set(mint_data.mint_address),
            decimal: Set(mint_data.decimal),
            supply: Set(mint_data.supply),
            mint_authority: Set(Some(mint_data.mint_authority)),
            freeze_authority: Set(mint_data.freeze_authority),
            is_initialized: Set(mint_data.is_initialized),
            ..Default::default()
        };

        let result = mint_model.insert(&self.db).await;
        result
    }

    async fn save_metadata_to_db(
        &self,
        metadata_data: Metadata,
        metadata_pda_address: Pubkey,
        mint_address: String,
    ) -> Result<NftModel, DbErr> {
        let clean_name = metadata_data.name.replace('\0', "").trim().to_string();
        let clean_symbol = metadata_data.symbol.map(|s| s.replace('\0', "").trim().to_string());
        let clean_uri = metadata_data.uri.replace('\0', "").trim().to_string();
        let clean_update_authority = metadata_data.update_authority.replace('\0', "").trim().to_string();
        
        let metadata_model = NftActiveModel {
            metadata_address: Set(Some(metadata_pda_address.to_string())),
            mint_address: Set(mint_address),
            name: Set(clean_name),
            symbol: Set(clean_symbol),
            uri: Set(clean_uri),
            seller_fee_basis_points: Set(metadata_data.seller_fee_basis_points),
            update_authority: Set(clean_update_authority),
            primary_sale_happened: Set(metadata_data.primary_sale_happened),
            is_mutable: Set(metadata_data.is_mutable),
            ..Default::default()
        };

        let result = metadata_model.insert(&self.db).await;
        result
    }
}