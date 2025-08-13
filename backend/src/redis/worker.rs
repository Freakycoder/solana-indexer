use std::thread::sleep;
use std::time::Duration;

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
    elasticsearch_client : ElasticSearchClient
}

impl QueueWorker {

    pub fn new(queue : RedisQueue, db : DatabaseConnection, client : ElasticSearchClient) -> Self{
        println!("initializing queue and db connection for worker to work on...");
        Self {
            queue,
            db,
            elasticsearch_client: client
        }
    }
    pub async fn start_processing(&self) {
        loop {
            println!("Started to process to the queue messages...");
            match self.queue.dequeue_message("mint_data_messsage").await {
                Ok(Some(data)) => {
                    println!("Recived mint data from the queue");
                    println!("queue message : {:?}",data);
                    self.process_mint_data(data).await},
                    Ok(None) => {
                        println!("Queue empty, no mint data recieved. sleeping for some time...");
                        sleep(Duration::from_millis(100));
                    }
                    Err(e) => {
                        println!("Error getting the message from the queue {}", e);
                        sleep(Duration::from_secs(2));
                    }
                }
            }
        }
        
    async fn process_mint_data(&self, mint_data: MintData) {
        println!("Processing the mint data...");
        println!("Saving the mint data to db...");
        if let Ok(_) = self.save_mint_to_db(mint_data.clone()).await {
            println!("Succesfully Saved!");
            println!("Getting the PDA address for the mint...");
            let metadata_pda_address = self
                .queue
                .get_metadata_pda_address(&mint_data.mint_address)
                .expect("failed to get the address of metadata PDA");
            println!("Succesfully Found!");
            println!("Getting the metadata from the PDA address...");
            match self
                .queue
                .parse_metadata_pda_data(mint_data.mint_address.clone(), metadata_pda_address)
                .await
            {
                Ok(Some(metadata_data)) => {
                    println!("Successfully parsed metadata bytes");
                    println!("PDA metadata : {:?}",metadata_data);
                    println!("Saving the metadata info to the db...");
                    match self
                        .save_metadata_to_db(
                            metadata_data,
                            metadata_pda_address,
                            mint_data.mint_address.clone(),
                        )
                        .await
                    {
                        Ok(_) => {
                            println!("Sucessfully saved metadata to db");
                            let nft_doc = NftDoc {
                                mint_address : mint_data.mint_address,
                                nft_name : metadata_data.name
                            };
                            self.elasticsearch_client.create_nft_index(nft_doc).await;
                        }
                        Err(e) => {
                            println!("Error saving metadata to db {}", e)
                        }
                    };
                }
                Ok(None) => {
                    println!("No metadata recieved on parsing the metadata bytes")
                }
                Err(e) => {
                    println!("failed to parse the metadata bytes {}", e);
                }
            };
        };
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
        let metadata_model = NftActiveModel {
            metadata_address: Set(metadata_pda_address.to_string()),
            mint_address: Set(mint_address),
            name: Set(metadata_data.name),
            symbol: Set(metadata_data.symbol),
            uri: Set(metadata_data.uri),
            seller_fee_basis_points: Set(metadata_data.seller_fee_basis_points),
            update_authority: Set(metadata_data.update_authority),
            primary_sale_happened: Set(metadata_data.primary_sale_happened),
            is_mutable: Set(metadata_data.is_mutable),
            ..Default::default()
        };

        let result = metadata_model.insert(&self.db).await;
        result
    }
}
