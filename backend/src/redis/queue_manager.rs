use redis::{Client, AsyncCommands, RedisResult};
use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize)]
pub struct SolanaData{
 pub address : String
}
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

    pub async fn dequeue_message(&self, queue_name : &str) -> RedisResult<Option<SolanaData>>{
        let mut conn = self.client.get_multiplexed_async_connection().await?;
        let message_string : Option<String>  = conn.rpop(queue_name, None).await?;

        match message_string {
            Some(message) => {
                match serde_json::from_str::<SolanaData>(&message) {
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
}