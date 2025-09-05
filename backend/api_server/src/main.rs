use shared::{
    dotenv, env,
    elasticsearch::client::ElasticSearchClient,
    entities::{mint, nft_metadata},
    types::{
        elasticsearch::SearchResponse,
        mint::{MintResponse, PartialMetadata},
    },
    ColumnTrait, Database, DatabaseConnection, EntityTrait, QueryFilter,
    Json, Path, Router, State, StatusCode,
    get, SPL_TOKEN_PROGRAM,
};
use tower_http::cors::{CorsLayer};

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

    let app = Router::new()
        .route("/details/{mint_address}", get(get_details))
        .route("/search/nfts/{query}", get(search_nfts))
        .with_state((db, elasticsearch))
        .layer(CorsLayer::very_permissive());

    let listener = tokio::net::TcpListener::bind("localhost:3001")
        .await
        .unwrap();
    println!("The Server is running at port 3001");
    
    if let Err(e) = axum::serve(listener, app).await {
        eprintln!("Server error: {}", e);
        return Err(e.into());
    }

    Ok(())
}

pub async fn get_details(
    State((db, _)): State<(DatabaseConnection, ElasticSearchClient)>,
    Path(mint_address): Path<String>,
) -> Json<MintResponse> {
    let mint_details = match mint::Entity::find()
    .filter(mint::Column::MintAddress.eq(mint_address.clone()))
    .one(&db)
    .await {
        Ok(Some(mint_data)) => mint_data,
        Ok(None) => {
            println!("Mint data not found for address: {}", mint_address);
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
                    metadata_uri: None,
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
                    metadata_uri: None,
                    seller_fee_basis_points: 0,
                    update_authority: None,
                    is_mutable: false,
                    primary_sale_happened: false,
                },
            });
        }
    };

    let mint_metadata = match nft_metadata::Entity::find()
        .filter(nft_metadata::Column::MintAddress.eq(mint_address.clone()))
        .one(&db)
        .await
    {
        Ok(metadata_opt) => metadata_opt,
        Err(db_err) => {
            println!(
                "Database error occurred while finding metadata {} for the mint address: {}",
                db_err, mint_address
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
                    metadata_uri: None,
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
                    metadata_uri: Some(metadata.metadata_uri),
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
                    metadata_uri: None,
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
    query: Path<String>,
) -> Result<Json<SearchResponse>, StatusCode> {
    match elasticsearch.search_nft(&query, 20).await {
        Ok(search_response) => Ok(Json(search_response)),
        Err(e) => {
            println!("Search error: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}