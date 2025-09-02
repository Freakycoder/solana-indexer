use shared::{
    dotenv, env,
    elasticsearch::client::ElasticSearchClient,
    redis::{queue_manager::RedisQueue, worker::QueueWorker},
    Database,
};

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
    let queue = RedisQueue::new().await?;
    let worker = QueueWorker::new(queue, db, elasticsearch);

    println!("Starting queue worker...");
    worker.start_processing().await;

    Ok(())
}
