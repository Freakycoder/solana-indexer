// Cargo.toml - Truly minimal dependencies
//
// [package]
// name = "backend"
// version = "0.1.0"
// edition = "2021"
//
// [dependencies]
// tokio = { version = "1.46.1", features = ["rt-multi-thread", "macros"] }
// yellowstone-grpc-client = "8.0.0"
// yellowstone-grpc-proto = "8.0.0"

use futures::SinkExt;
use std::collections::HashMap;
use tokio_stream::StreamExt;
use yellowstone_grpc_client::{ClientTlsConfig, GeyserGrpcClient};
use yellowstone_grpc_proto::{geyser::{ SubscribeRequest, SubscribeRequestFilterAccounts, SubscribeRequestFilterSlots}, tonic::metadata::Entry};

// Common Solana program IDs
const SYSTEM_PROGRAM: &str = "11111111111111111111111111111111";
const SPL_TOKEN_PROGRAM: &str = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const ASSOCIATED_TOKEN_PROGRAM: &str = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Step 1: Connect to your endpoint
    let client = connect().await?;

    // Step 2: Create a simple subscription
    let subscription = create_minimal_subscription();

    // Step 3: Listen for updates
    listen_for_updates(client, subscription).await?;

    Ok(())
}
// Connect to PublicNode with minimal configuration
async fn connect(
) -> Result<GeyserGrpcClient<impl yellowstone_grpc_client::Interceptor>, Box<dyn std::error::Error>>
{
    println!("Connecting to PublicNode...");

    let client = GeyserGrpcClient::build_from_shared(
        "https://solana-yellowstone-grpc.publicnode.com:443".to_string(),
    )?
    .x_token(Some(
        "6ecc6cb2afc5125f5073bc73b12cf7e75d1155ec5b52fedd7f1467dc9fe519b2".to_string(),
    ))?
    .tls_config(ClientTlsConfig::new().with_native_roots())?
    .connect()
    .await?;

    println!("Connected!");
    Ok(client)
}

// Create the simplest possible subscription - just slot updates
fn create_minimal_subscription() -> SubscribeRequest {
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

async fn listen_for_updates(
    mut client: GeyserGrpcClient<impl yellowstone_grpc_client::Interceptor>,
    subscription: SubscribeRequest,
) -> Result<(), Box<dyn std::error::Error>> {
    println!("Starting subscription...");

    let (mut sink, mut stream) = client.subscribe().await?;

    // we use subscription 
    sink.send(subscription).await?;

    println!("Listening for Solana slot updates...\n");

    // Simple loop - just print whatever we get
    while let Some(update) = stream.next().await {
        match update {
            Ok(msg) => { // basically when u recieve stream of data from validator u get in form of subcribeupdate. in which update_oneof contains the actual data
                // The update_oneof field contains the actual data
                if let Some(update_type) = &msg.update_oneof {
                    match update_type {
                        // yellowstone_grpc_proto::geyser::subscribe_update::UpdateOneof::Slot(
                        //     slot,
                        // ) => {
                        //     println!("New slot: {} (status: {:?})", slot.slot, slot.status);
                        // }
                        // yellowstone_grpc_proto::geyser::subscribe_update::UpdateOneof::Transaction(transaction) => {
                        //     println!("new entry : {:?}", transaction.transaction);
                        // }
                        yellowstone_grpc_proto::geyser::subscribe_update::UpdateOneof::Account(account) => {
                            if let Some(acc) = &account.account {
                                println!("Account Update:");
                                println!("  Account Address: {}", bs58::encode(&acc.pubkey).into_string());
                                println!("  Owner: {}", bs58::encode(&acc.owner).into_string());
                                println!("  Data length: {} bytes", acc.data.len());
                                
                                // Parse data based on owner program
                                parse_account_data(&acc.owner, &acc.data, &acc.pubkey);
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

fn parse_account_data(owner: &[u8], data: &[u8], _pubkey: &[u8]) {
    let owner_str = bs58::encode(owner).into_string(); // encoding from bytes to human readabe format.
    
    println!("  --- Parsing Account Data ---");
    println!("  Owner Program: {}", owner_str);
    
    match owner_str.as_str() {
        SYSTEM_PROGRAM => {
            println!("  Type: System Account (native SOL)");
            if data.is_empty() {
                println!("  Data: Empty (regular wallet)");
            } else {
                println!("  Data: {} bytes of system data", data.len());
                print_hex_data(data, 32);
            }
        },
        SPL_TOKEN_PROGRAM => {
            println!("  Type: SPL Token Account");
            parse_token_account_data(data);
        },
        ASSOCIATED_TOKEN_PROGRAM => {
            println!("  Type: Associated Token Account");
            parse_token_account_data(data);
        },
        _ => {
            println!("  Type: Custom Program Account");
            println!("  Program: {}", owner_str);
            print_hex_data(data, 64);
            
            // Try to detect common patterns
            detect_account_patterns(data);
        }
    }
    println!("");
}

fn parse_token_account_data(data: &[u8]) {
    if data.len() < 165 {
        println!("  Data: Invalid token account (too short)");
        return;
    }
    
    let mint = &data[0..31];
    let owner = &data[32..63];
    let lamports = u64::from_le_bytes(data[64..71].try_into().unwrap_or([0; 8]));
    let state = data[108];
    
    println!("  Token Details:");
    println!("    Mint: {}", bs58::encode(mint).into_string());
    println!("    ATA Owner: {}", bs58::encode(owner).into_string());
    println!("    Amount: {}", lamports);
    println!("    State: {}", match state {
        0 => "Uninitialized",
        1 => "Initialized", 
        2 => "Frozen",
        _ => "Unknown"
    });
}

fn print_hex_data(data: &[u8], max_bytes: usize) {
    let display_bytes = std::cmp::min(data.len(), max_bytes);
    print!("  Raw Data (hex): ");
    for (i, byte) in data[..display_bytes].iter().enumerate() {
        if i > 0 && i % 16 == 0 {
            print!("\n                  ");
        }
        print!("{:02x} ", byte);
    }
    if data.len() > max_bytes {
        print!("... ({} more bytes)", data.len() - max_bytes);
    }
    println!();
    
    // Try to show as string if it contains printable ASCII
    let ascii_str: String = data[..display_bytes].iter()
        .map(|&b| if b.is_ascii_graphic() || b == b' ' { b as char } else { '.' })
        .collect();
    println!("  As ASCII: {}", ascii_str);
}

fn detect_account_patterns(data: &[u8]) {
    if data.len() == 0 {
        return;
    }
    
    println!("  Pattern Analysis:");
    
    // Check for common sizes
    match data.len() {
        32 => println!("    - 32 bytes: Likely a pubkey or hash"),
        64 => println!("    - 64 bytes: Likely two pubkeys or a signature"),
        165 => println!("    - 165 bytes: Standard SPL token account"),
        82 => println!("    - 82 bytes: Mint account"),
        _ => println!("    - {} bytes: Custom data structure", data.len())
    }
    
    // Check if data starts with known patterns
    if data.len() >= 8 {
        let first_8 = u64::from_le_bytes(data[0..8].try_into().unwrap());
        if first_8 == 0 {
            println!("    - Starts with 8 zero bytes (uninitialized or padding)");
        }
    }
    
    // Check for mostly zeros (uninitialized)
    let zero_count = data.iter().filter(|&&b| b == 0).count();
    let zero_percentage = (zero_count * 100) / data.len();
    if zero_percentage > 80 {
        println!("    - {}% zeros: Likely uninitialized or sparse data", zero_percentage);
    }
}
