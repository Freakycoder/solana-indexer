use crate::types::{metadeta::Metadata, mint::MintData};
use mpl_token_metadata::{accounts::Metadata as MetadataAccount, programs::MPL_TOKEN_METADATA_ID};
use redis::{AsyncCommands, Client, RedisResult};
use solana_client::rpc_client::RpcClient;
use solana_program::pubkey::Pubkey;
use std::str::FromStr;
pub struct RedisQueue {
    client: Client,
    rpc_client: RpcClient,
}

impl RedisQueue {
    pub fn new(redis_client: Client, rpc_url: String) -> Self {
        println!("Initializing redis queue...");
        Self {
            client: redis_client,
            rpc_client: RpcClient::new(rpc_url),
        }
    }

    pub async fn enqueue_message(&self, message: &str, queue_name: &str) -> RedisResult<usize> {
        let mut conn = self.client.get_multiplexed_async_connection().await?;
        let message_json = match serde_json::to_string(message) {
            Ok(mesage_string) => mesage_string,
            Err(_) => format!("Error serialing the message into string"),
        };

        let queue_length: usize = conn.lpush(queue_name, message_json).await?;
        println!("pushed the message to the queue");
        Ok(queue_length)
    }

    pub async fn dequeue_message(&self, queue_name: &str) -> RedisResult<Option<MintData>> {
        let mut conn = self.client.get_multiplexed_async_connection().await?;
        let message_string: Option<String> = conn.rpop(queue_name, None).await?;

        match message_string {
            Some(message) => {
                match serde_json::from_str::<MintData>(&message) {
                    Ok(mint_data) => {
                        // CHNAGES TO BE MADE. REMOVE THE INTERNAL LOOPING. FIRST WE CALL DEQUEUE TO GET MINT INFO THEN WE GET METADATA INFO THEN WE GET CREATOR
                        Ok(Some(mint_data))
                    }
                    Err(e) => {
                        println!("Failed to deserialize message {}", e);
                        Ok(None)
                    }
                }
            }
            None => Ok(None),
        }
    }

    async fn get_metadeta_pda_data(
        &self,
        mint_address: String,
    ) -> Result<Option<Vec<u8>>, Box<dyn std::error::Error>> {
        let mint_pubkey = Pubkey::from_str(&mint_address).map_err(|e| {
            println!("Inavlid pubkey parsing");
            format!("Invalid pubkey: {}", e)
        })?;

        let meta_seeds = &[
            b"metadata",
            MPL_TOKEN_METADATA_ID.as_ref(),
            mint_pubkey.as_ref(),
        ];
        let (metadata_pda, _) = Pubkey::find_program_address(meta_seeds, &MPL_TOKEN_METADATA_ID);

        match self.rpc_client.get_account(&metadata_pda) {
            Ok(account) => {
                println!("Metadata account found");
                println!("Data length {} bytes", account.data.len());

                if account.owner == MPL_TOKEN_METADATA_ID {
                    Ok(Some(account.data)) // we're returning vector of bytes
                } else {
                    println!("But account not owned by metaplex program");
                    Ok(None)
                }
            }
            Err(_) => {
                println!("No metadata account found");
                Ok(None)
            }
        }
    }

    pub async fn parse_metadata_pda_data(
        &self,
        metadata_address: String,
        mint_address: String,
    ) -> Result<Option<Metadata>, Box<dyn std::error::Error>> {
        let metadata_account_data = match self.get_metadeta_pda_data(mint_address).await {
            Ok(Some(data_byte)) => data_byte, // the return type is result of option, so we check for both some and none
            Ok(None) => return Ok(None),
            Err(e) => return Err(e),
        };
        println!("📋 Parsing metadata account...");

        match MetadataAccount::safe_deserialize(&metadata_account_data) {
            Ok(metadeta) => Ok(Some(Metadata {
                mint_address: metadeta.mint.to_string(),
                metadata_address: metadata_address,
                name: metadeta.name,
                symbol: metadeta.symbol,
                uri: metadeta.uri,
                seller_fee_basis_points: metadeta.seller_fee_basis_points,
                update_authority: metadeta.update_authority.to_string(),
                primary_sale_happened: metadeta.primary_sale_happened,
                is_mutable: metadeta.is_mutable,
            })),
            Err(_) => Ok(None),
        }
    }
}
