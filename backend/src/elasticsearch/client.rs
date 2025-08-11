use elasticsearch::{http::transport::Transport, Elasticsearch};
use serde_json::json;

#[derive(Debug, Clone)]
pub struct ElasticSearchClient{
    client : Elasticsearch,
    index_name : String
}

impl ElasticSearchClient {
    pub async fn new(elasticsearch_url : &str, index_name : &str) -> Result<Self, elasticsearch::Error> {
        let transport = Transport::single_node(elasticsearch_url).map_err(|es_error| {
            println!("failed to create transport {}",es_error);
            es_error
        })?; // first we assure transport layer works.
        let client  = Elasticsearch::new(transport); // here we create new client using the transport layer.

        match client.info().send().await{ // then you check server is alive 
            Ok(response) => {
                if response.status_code().is_success(){
                    println!("Successfully connected to ElasticSearch");
                }
                else {
                    println!("ElasticSearch returned the status {}", response.status_code());
                }
            }
            Err(e) => {
                println!("Error connecting to ElasticSearch {}", e);
            }
        }

        let client_connection = Self {
            client : client,
            index_name : index_name.to_string()
        };

        client_connection.set_up_index().await?;
        Ok(client_connection)
    }

    async fn set_up_index (&self) -> Result<(), elasticsearch::Error>{
        let mapping = json!({
            "mapping" : {
                "properties" : {
                    "mint_address" : {
                        "type" : "keyword"
                    },
                    "collection_name" : {
                        "type" : "text",
                        "field" : {
                            "keyword" : {
                                "type" : "keyword"
                            }
                        },
                        "analyzer" : "standard"
                    }
                }
            },
            "settings" : {
                "number_of_shards" : 1,
                "number_of_replicas" : 2,
                "refresh_interval" : "1s"
            }
        });

        let exist_response = self.client
        .indices()
        .exists(elasticsearch::indices::IndicesExistsParts::Index(&[&self.index_name]))
        .send()
        .await
        .map_err(|es_error| {
            println!("failed to check if index exist due to {}", es_error);
            es_error
        })?;

        if exist_response.status_code().as_u16() == 404 {

            println!("Old index not found");
            println!("Creating new index...");

            let new_index = self.client
            .indices()
            .create(elasticsearch::indices::IndicesCreateParts::Index(&self.index_name))
            .body(mapping)
            .send()
            .await
            .map_err(|es_error| {
                println!("Error in creating a new index due to : {}",es_error);
                es_error
            })?;

            if new_index.status_code().is_success(){
                println!("Sucessfully created new Index");
            }
            else {
                println!("New index created failed");
            }
        }
        else {
            println!("Index already exist");
        }
        Ok(())

    }
}