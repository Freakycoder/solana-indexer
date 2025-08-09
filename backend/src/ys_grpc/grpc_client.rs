use std::collections::HashMap;
use futures::SinkExt;
use tokio_stream::StreamExt;
use yellowstone_grpc_client::{ClientTlsConfig, GeyserGrpcClient};
use yellowstone_grpc_proto::geyser::{SubscribeRequest, SubscribeRequestFilterAccounts, SubscribeRequestFilterSlots};
use crate::redis::queue_manager::RedisQueue;

const SPL_TOKEN_PROGRAM: &str = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

pub struct GRPCclient {
    pub rpc_endpoint: String,
    pub token: String,
}

impl GRPCclient {
    pub fn new(endpoint: String, token: String) -> Self {
        println!("Initializing grpc endpoint along with token access...");
        Self {
            rpc_endpoint: endpoint,
            token: token,
        }
    }

    async fn client_connection(
        &self,
    ) -> Result<
        GeyserGrpcClient<impl yellowstone_grpc_client::Interceptor>,
        Box<dyn std::error::Error>,
    > {
        println!("Connecting to PublicNode...");

        let client = GeyserGrpcClient::build_from_shared(
            self.rpc_endpoint.to_string(),
        )?
        .x_token(Some(
            self.token.to_string(),
        ))?
        .tls_config(ClientTlsConfig::new().with_native_roots())?
        .connect()
        .await?;

        println!("Connected!");
        Ok(client)
    }

    fn create_subscription(&self) -> SubscribeRequest {
    let mut slots = HashMap::new();
    slots.insert(
        "slots".to_string(),
        SubscribeRequestFilterSlots {
            filter_by_commitment: Some(true),
            interslot_updates: None,
        },
    );
    let mut accounts = HashMap::new();
    accounts.insert("all_accounts".to_string(), SubscribeRequestFilterAccounts{
        account : vec![], // here we give the specific address we want to monitor.
        owner : vec![SPL_TOKEN_PROGRAM.to_string()], // we give the program IDs who owns the account
        filters : vec![], // here we specify in depth account details to filter out precisely
        nonempty_txn_signature : None
    });

    println!("Created subscription for the server.");

    let commitment = Some(2);

    SubscribeRequest {
        slots,
        accounts: accounts,
        transactions: HashMap::new(),
        transactions_status: HashMap::new(),
        blocks: HashMap::new(),
        blocks_meta: HashMap::new(),
        entry: HashMap::new(),
        commitment: commitment,
        accounts_data_slice: vec![],
        ping: None,
        from_slot: None,
    }
}

pub async fn listen_for_updates(
    &self
) -> Result<(), Box<dyn std::error::Error>> {
    
    let mut client = self.client_connection().await?;
    let subscription = self.create_subscription();
    println!("Starting to listen subscription for messages...");

    let (mut sink, mut stream) = client.subscribe().await?;

    // we get 2 objects from client subscription. sink used to sending the request object  and stream for receiving the requested data from grpc
    sink.send(subscription).await?;

    println!("Listening for Solana slot updates...\n");

    let queue = RedisQueue::new().await?;

    // looping continously to get message from server.
    while let Some(update) = stream.next().await {
        match update {
            Ok(msg) => { // basically when u recieve stream of data from validator u get in form of subcribeupdate, in which update_oneof contains the actual data
                if let Some(update_type) = &msg.update_oneof {
                    match update_type {
                        yellowstone_grpc_proto::geyser::subscribe_update::UpdateOneof::Account(account) => {
                            if let Some(acc) = &account.account {
                                println!("Account Update:");
                                println!("  Account Address: {}", bs58::encode(&acc.pubkey).into_string());
                                println!("  Owner: {}", bs58::encode(&acc.owner).into_string());
                                println!("  Data length: {} bytes", acc.data.len());
                                
                                if acc.data.len() == 82 {
                                    let _ = queue.enqueue_message(&acc.data, &acc.owner, "mint_data_message", &acc.pubkey).await.map_err(|e| {
                                        println!("Error pushing message to the queue due to {}",e);
                                    });
                                }

                            }
                        }
                        _ => {println!("got other updates...ignore.")}
                    }
                }
            }
            Err(e) => {
                println!("Stream error: {}", e);
                break;
            }
        }
    }

    Ok(())
}
}
