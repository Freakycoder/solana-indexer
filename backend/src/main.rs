pub mod elasticsearch;
pub mod entities;
pub mod helius;
pub mod redis;
pub mod types;
pub mod ys_grpc;

use crate::elasticsearch::client::ElasticSearchClient;
use crate::entities::mint;
use crate::helius::client::HeliusClient;
use crate::redis::queue_manager::RedisQueue;
use crate::redis::worker::QueueWorker;
use crate::{
    entities::nft_metadata,
    types::{
        elasticsearch::SearchResponse,
        mint::{MintResponse, PartialMetadata},
    },
    ys_grpc::grpc_client::GRPCclient,
};
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
    routing::get,
    Router,
};
use dotenvy::dotenv;
use sea_orm::{prelude::Uuid, ColumnTrait, Database, DatabaseConnection, EntityTrait, QueryFilter};
use std::env;

const SPL_TOKEN_PROGRAM: &str = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();

    let elasticsearch = ElasticSearchClient::new(
        env::var("ELASTICSEARCH_URL").expect("failed to get es_url from env"),
        env::var("ELASTICSEARCH_INDEX_NAME").expect("failed to get index name from env"),
    )
    .await
    .expect("Error creating a elasticsearch client");
    let db = Database::connect(env::var("DATABASE_URL").expect("DATABASE_URL must be set")).await?;
    let helius_client = HeliusClient::connect(
        env::var("HELIUS_URL").expect("failed to get helius url from env"),
        db.clone(),
    );
    let _ = helius_client.get_assets().await;
    let queue = RedisQueue::new().await?;
    let worker = QueueWorker::new(queue, db.clone(), elasticsearch.clone()); // here we initialized worker and queue

    let grpc_client = GRPCclient::new(
        env::var("RPC_ENDPOINT").expect("failed to retrieve the rpc from env"),
        env::var("RPC_TOKEN").expect("failed to fetch token from env"),
    ); // the client is also initialized

    grpc_client.listen_for_updates().await?; // the client is up & ready and waiting for messages to push to queue
    worker.start_processing().await; // message ready to be extracted from queue and be processed.

    let app = Router::new()
        .route("/details/{mint_id}", get(get_details))
        .route("/search/nfts/{query}", get(search_nfts))
        .with_state((db, elasticsearch));

    let listener = tokio::net::TcpListener::bind("localhost:3001")
        .await
        .unwrap();
    println!("The server is running at localhost:3001");
    axum::serve(listener, app).await?;

    Ok(())
}

pub async fn get_details(
    State((db, _)): State<(DatabaseConnection, ElasticSearchClient)>,
    Path(mint_id): Path<Uuid>,
) -> Json<MintResponse> {
    let mint_details = match mint::Entity::find_by_id(mint_id).one(&db).await {
        Ok(Some(mint_data)) => mint_data,
        Ok(None) => {
            println!("Mint data not found for id: {}", mint_id);
            return Json(MintResponse {
                mint_address: String::new(),
                owner: SPL_TOKEN_PROGRAM.to_string(),
                mint_authority: String::new(),
                supply: 0,
                decimal: 0,
                is_initialized: false,
                freeze_authority: None,
                metadata: PartialMetadata {
                    name: None,
                    symbol: None,
                    uri: None,
                    seller_fee_basis_points: 0,
                    update_authority: None,
                    is_mutable: false,
                    primary_sale_happened: false,
                },
            });
        }
        Err(db_err) => {
            println!("Database error occurred: {}", db_err);
            return Json(MintResponse {
                mint_address: String::new(),
                owner: SPL_TOKEN_PROGRAM.to_string(),
                mint_authority: String::new(),
                supply: 0,
                decimal: 0,
                is_initialized: false,
                freeze_authority: None,
                metadata: PartialMetadata {
                    name: None,
                    symbol: None,
                    uri: None,
                    seller_fee_basis_points: 0,
                    update_authority: None,
                    is_mutable: false,
                    primary_sale_happened: false,
                },
            });
        }
    };

    let mint_metadata = match nft_metadata::Entity::find()
        .filter(nft_metadata::Column::MintAddress.eq(&mint_details.mint_address))
        .one(&db)
        .await
    {
        Ok(metadata_opt) => metadata_opt,
        Err(db_err) => {
            println!(
                "Database error occurred while finding metadata {} for the mint id: {}",
                db_err, mint_id
            );
            return Json(MintResponse {
                mint_address: mint_details.mint_address,
                owner: SPL_TOKEN_PROGRAM.to_string(),
                mint_authority: mint_details.mint_authority.unwrap_or_default(),
                supply: mint_details.supply,
                decimal: mint_details.decimal,
                is_initialized: mint_details.is_initialized,
                freeze_authority: mint_details.freeze_authority,
                metadata: PartialMetadata {
                    name: None,
                    symbol: None,
                    uri: None,
                    seller_fee_basis_points: 0,
                    update_authority: None,
                    is_mutable: false,
                    primary_sale_happened: false,
                },
            });
        }
    };

    match mint_metadata {
        Some(metadata) => {
            println!("Found metadata for the mint");
            Json(MintResponse {
                mint_address: mint_details.mint_address,
                owner: SPL_TOKEN_PROGRAM.to_string(),
                mint_authority: mint_details.mint_authority.unwrap_or_default(),
                supply: mint_details.supply,
                decimal: mint_details.decimal,
                is_initialized: mint_details.is_initialized,
                freeze_authority: mint_details.freeze_authority,
                metadata: PartialMetadata {
                    name: Some(metadata.name),
                    symbol: metadata.symbol,
                    uri: Some(metadata.uri),
                    seller_fee_basis_points: metadata.seller_fee_basis_points,
                    update_authority: Some(metadata.update_authority),
                    is_mutable: metadata.is_mutable,
                    primary_sale_happened: metadata.primary_sale_happened,
                },
            })
        }
        None => {
            println!("No metadata found for the mint");
            Json(MintResponse {
                mint_address: mint_details.mint_address,
                owner: SPL_TOKEN_PROGRAM.to_string(),
                mint_authority: mint_details.mint_authority.unwrap_or_default(),
                supply: mint_details.supply,
                decimal: mint_details.decimal,
                is_initialized: mint_details.is_initialized,
                freeze_authority: mint_details.freeze_authority,
                metadata: PartialMetadata {
                    name: None,
                    symbol: None,
                    uri: None,
                    seller_fee_basis_points: 0,
                    update_authority: None,
                    is_mutable: false,
                    primary_sale_happened: false,
                },
            })
        }
    }
}

pub async fn search_nfts(
    State((_, elasticsearch)): State<(DatabaseConnection, ElasticSearchClient)>,
    query_path: Path<String>,
) -> Result<Json<SearchResponse>, StatusCode> {
    match elasticsearch.search_nft(query_path, 20).await {
        Ok(search_response) => Ok(Json(search_response)),
        Err(e) => {
            println!("Search error: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}
