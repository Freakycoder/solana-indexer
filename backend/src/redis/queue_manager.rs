use redis::{Client, AsyncCommands, RedisResult};
use crate::types::mint::MintData;
use solana_program::pubkey::Pubkey;
use mpl_token_metadata::programs::MPL_TOKEN_METADATA_ID;
use solana_client::rpc_client::{self, RpcClient};

pub struct RedisQueue{
    client : Client
}

impl RedisQueue{
    pub fn new(&self, redis_client : Client) -> Self{
        println!("Initializing redis queue...");
        Self{
            client : redis_client
        }
    }

    pub async fn enqueue_message(&self, message : &str, queue_name : &str) -> RedisResult<usize>{
        let mut conn = self.client.get_multiplexed_async_connection().await?;
        let message_json = match serde_json::to_string(message){
            Ok(mesage_string) => mesage_string,
            Err(_) => format!("Error serialing the message into string")
        };

        let queue_length : usize = conn.lpush(queue_name, message_json).await?;
        println!("pushed the message to the queue");
        Ok(queue_length)
    }

    pub async fn dequeue_message(&self, queue_name : &str) -> RedisResult<Option<MintData>>{
        let mut conn = self.client.get_multiplexed_async_connection().await?;
        let message_string : Option<String>  = conn.rpop(queue_name, None).await?;

        match message_string {
            Some(message) => {
                match serde_json::from_str::<MintData>(&message) {
                    Ok(message_string) => {
                        println!("message recieved and succesfully parsed");
                        Ok(Some(message_string))
                    }
                    Err(e) => {
                        println!("Failed to deserialize message {}",e);
                        Ok(None)
                    }
                }
            }
            None => {
                Ok(None)
            }
        } 
    }

    async fn get_metadeta_pda(mint_address : Pubkey){

        let meta_seeds = &[ b"metadata" , MPL_TOKEN_METADATA_ID.as_ref(), mint_address.as_ref() ];
        let (metadata_pda, _) = Pubkey::find_program_address(meta_seeds, &MPL_TOKEN_METADATA_ID);

         let account = rpc_client.
    }
}