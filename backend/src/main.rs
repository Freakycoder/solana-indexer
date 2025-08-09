pub mod entities;
pub mod redis;
pub mod types;
pub mod ys_grpc;
use crate::ys_grpc::grpc_client::GRPCclient;
use dotenvy::dotenv;
use std::env;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
   
    dotenv().ok();
    let grpc_client = GRPCclient::new(env::var("RPC_ENDPOINT").expect("failed to retrieve the rpc from env"), env::var("TOKEN").expect("failed to fetch token from env"));
    
    grpc_client.listen_for_updates().await?;

    Ok(())
}

