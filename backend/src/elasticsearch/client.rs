use core::fmt;
use std::error::Error;
use elasticsearch::{http::transport::Transport, Elasticsearch, IndexParts, SearchParts};
use futures::future::ok;
use serde_json::{json, Value};

use crate::types::{elasticsearch::{SearchResponse, SearchResult}, mint::NftDoc};

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

    pub async fn create_nft_index(&self, nft_doc : NftDoc) -> Result<(), ElasticSearchError>{
        let response = self.client
        .index(IndexParts::IndexId(&self.index_name, &nft_doc.mint_address))
        .body(&nft_doc)
        .refresh(elasticsearch::params::Refresh::WaitFor) // referesh determines when the newly inserted or updated doc becomes searchable
        .send()
        .await
        .map_err(|index_err| {
            ElasticSearchError::IndexError(format!("Failed to index the document {}",index_err))
        })?;

        if response.status_code().is_success() {
            println!("✅ Successfully indexed NFT: {}", nft_doc.mint_address);
            Ok(())
        } else {
            Err(ElasticSearchError::IndexError(format!("Indexing failed")))
        }
    }

    pub async fn search_collection_name(&self, query : &str, size : i64) -> Result<(), ElasticSearchError>{
        let search_query = json!({
            "query" : {
                "match" : {
                    "collection_name" : {
                        "query" : query, // the text we're searching for
                        "fuzziness" : "AUTO", // include partial matching/close matching
                        "operator" : "or" //match any term
                    }

                }
            },
            "sort" : [
                {"_score" : {"order" : "desc"}} // sort results by relevance score
            ]
        });

        let search_response = self.client
        .search(SearchParts::Index(&[&self.index_name])) // ES can search multiple indices (indexes) that's why it takes &[&str]. like &["index1", "index2", "index3"]
        .body(search_query)
        //.from(from) from means how much docs to skips and then return the result. if from(5) then skip the first 5 matching results and show from 6th.
        .size(size) // size means how much matching docs to return in result. if size(5) then return only 5 matching docs
        .send()
        .await
        .map_err(|e| ElasticSearchError::SearchError(format!("Failed to search for the text {}",e)))?;

        if search_response.status_code().is_success(){
            println!("Succesfully recieved searched response for the query.");
            println!("Sending it for parsing the response...");
            let search_json : Value  = search_response.json().await.map_err(|e| ElasticSearchError::SearchError(format!("Error converting search result into JSON {}", e)))?;
            self.parse_response_data(search_json);
        }
        else {
            
        }
    }

    fn parse_response_data(&self , search_response : Value) -> Result<SearchResponse, ElasticSearchError>{
        let hits = search_response["hits"]["hits"].as_array() // we're using the same dot notation as JS, but only syntax different and we need to explicitly mention the type of value that field contains using (as_str(), as_f64, as_array...etc)
                                .ok_or_else(|| ElasticSearchError::SearchError(format!("Unable to retrieve hits array from response")))?; // this is used for return type of Option<> and map_err is used for Result<>
        
        let search_result_array : Vec<SearchResult> = hits.iter().filter_map(|hit| { // .iter() gives interable reference for the elements present in the vec. 
            let source = &hit["_source"];
            let score = &hit["_score"];
            Some(SearchResult {
                mint_address : source["mint_address"].as_str()?.to_string(), // if mint_address exist then as_str converts it into string reference followed by string conversion(owned). if doesn't exist then as_str return None.
                collection_name : source["collection_name"].as_str()?.to_string(),
                score : score.as_f64().unwrap_or(0.0)
            })
        }).collect(); // this fn collects all the some(value) from the iterator and turns them into vec<T> or Hashmap<T>

        Ok(SearchResponse { results: search_result_array })
    
    }
}

#[derive(Debug)]
pub enum ElasticSearchError{ // here we created a enum varaints for elasticSearch errors
    ConnectionError(String),
    DocumentError(String),
    IndexError(String),
    SearchError(String)
}

impl fmt::Display for ElasticSearchError { // now since we want the error to be displayed in human readable friendly manner we need to implement the "Display" trait. like using the enum variant in "println!"
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result { // this fn must be explicitly re-written when we implement the "Display" trait.
        match self { // the formatter which is the second argument to the fmt fn. it takes the msg : String, and convert it into displayable format and returns through Result
            ElasticSearchError::ConnectionError(msg) => write!(f, "Connection Error : {}", msg),
            ElasticSearchError::DocumentError(msg) => write!(f, "Document Error : {}", msg),
            ElasticSearchError::IndexError(msg) => write!(f, "Index Error : {}", msg),
            ElasticSearchError::SearchError(msg) => write!(f, "Search Error : {}", msg)
        }
    }
} // ususally things have display implemented automatically. here we just manually implement and explicitly write the custom fmt fn.

impl Error for ElasticSearchError{} // we implement the std::error:Error for the enum bcoz then only it can we used in Result<> struct as error.