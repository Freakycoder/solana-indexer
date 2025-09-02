use shared::{dotenv, env, ys_grpc::grpc_client::GRPCclient};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();

    let grpc_client = GRPCclient::new(
        env::var("RPC_ENDPOINT").expect("failed to retrieve the rpc from env"),
        env::var("RPC_TOKEN").expect("failed to fetch token from env"),
    );

    println!("Starting GRPC server...");
    if let Err(e) = grpc_client.listen_for_updates().await {
        eprintln!("GRPC listener Error: {}", e);
        return Err(e.into());
    }

    Ok(())
}
