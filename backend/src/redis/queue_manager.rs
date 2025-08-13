use crate::types::{metadeta::Metadata, mint::MintData};
use mpl_token_metadata::{accounts::Metadata as MetadataAccount, programs::MPL_TOKEN_METADATA_ID};
use redis::{AsyncCommands, Client, RedisResult};
use solana_client::rpc_client::RpcClient;
use solana_program::pubkey::Pubkey;
use std::str::FromStr;
pub struct RedisQueue {
    redis_client: Client,
    rpc_client: RpcClient,
}

impl RedisQueue {
    pub async fn new() -> Result<Self, Box<dyn std::error::Error>> {
        println!("Initializing redis queue...");

        let redis_url = "redis://localhost:6379";

        let redis_client = Client::open(redis_url)?;

        Ok(Self {
            redis_client,
            rpc_client: RpcClient::new("https://api.mainnet-beta.solana.com"),
        })
    }

    pub async fn enqueue_message(&self, data: &[u8], account_owner_bytes : &[u8], queue_name: &str, mint_address_bytes: &[u8]) -> RedisResult<usize> {
        let mut conn = self.redis_client.get_multiplexed_async_connection().await?;
        
        let mint_authority  = bs58::encode(&data[4..36]).into_string(); // following fields are present in bytes representation
        let supply  = u64::from_le_bytes(data[36..44].try_into().unwrap_or([0; 8])); // we didn't use unwarp over here bcoz it panics on Err and None. instead we gave default value by using unwrap_or
        let decimal = data[44];                                                             // try_into converts the value attached to it into [u8;8] and is of Result<> type. we use unwrap as fallback incase try_into fails.
        let is_initialized = data[45]; // if false stored as 0 and 1 as true.
        let freeze_authority = bs58::encode(&data[50..82]).into_string();
        let data_length = data.len();
        let mint_address = bs58::encode(mint_address_bytes).into_string();
        let account_owner = bs58::encode(account_owner_bytes).into_string();

        let mint_data = MintData {
            mint_authority,
            owner : account_owner,
            data_length,
            decimal,
            freeze_authority : Some(freeze_authority),
            is_initialized : is_initialized != 0,
            mint_address,
            supply
        };

        let message_json = match serde_json::to_string(&mint_data) {
            Ok(mesage_string) => mesage_string,
            Err(_) => format!("Error serialing the message into string"),
        };

        let queue_length: usize = conn.lpush(queue_name, message_json).await?;
        println!("Message pushed to the queue succesfully");
        Ok(queue_length)
    }

    pub async fn dequeue_message(&self, queue_name: &str) -> RedisResult<Option<MintData>> {
        let mut conn = self.redis_client.get_multiplexed_async_connection().await?;
        let message_string: Option<String> = conn.rpop(queue_name, None).await?;

        match message_string {
            Some(message) => {
                match serde_json::from_str::<MintData>(&message) {
                    Ok(mint_data) => {
                        Ok(Some(mint_data))
                    }
                    Err(e) => {
                        println!("Failed to deserialize mint message {}", e);
                        Ok(None)
                    }
                }
            }
            None => Ok(None),
        }
    }

    pub fn get_metadata_pda_address(&self, mint_address : &str ) -> Result<Pubkey, Box<dyn std::error::Error>>{
        let mint_pubkey = Pubkey::from_str(mint_address).map_err(|e| {
            println!("Inavlid pubkey parsing");
            format!("Invalid pubkey: {}", e)
        })?;

        let meta_seeds = &[
            b"metadata",
            MPL_TOKEN_METADATA_ID.as_ref(),
            mint_pubkey.as_ref(),
        ];
        let (metadata_pda, _) = Pubkey::find_program_address(meta_seeds, &MPL_TOKEN_METADATA_ID);  
        Ok(metadata_pda)     
    }

    async fn get_metadeta_pda_data(
        &self,
        mint_address: String
    ) -> Result<Option<Vec<u8>>, Box<dyn std::error::Error>> {
        let metadata_pda = self.get_metadata_pda_address(&mint_address)?;

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
        mint_address: String,
        metadata_address :Pubkey
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
                metadata_address : metadata_address.to_string(),
                name: metadeta.name,
                symbol: metadeta.symbol,
                uri: metadeta.uri,
                seller_fee_basis_points: metadeta.seller_fee_basis_points,
                token_standard : metadeta.token_standard,
                collection : metadeta.collection,
                update_authority: metadeta.update_authority.to_string(),
                primary_sale_happened: metadeta.primary_sale_happened,
                is_mutable: metadeta.is_mutable,
            })),
            Err(_) => Ok(None),
        }
    }
}
