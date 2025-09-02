
pub mod api_server {
    pub use std::process::Command;
    
    pub fn start() -> std::io::Result<std::process::Child> {
        Command::new("cargo")
            .args(&["run", "--manifest-path", "api-server/Cargo.toml"])
            .spawn()
    }
}

pub mod grpc_listener {
    pub use std::process::Command;
    
    pub fn start() -> std::io::Result<std::process::Child> {
        Command::new("cargo")
            .args(&["run", "--manifest-path", "grpc-listener/Cargo.toml"])
            .spawn()
    }
}

pub mod queue_worker {
    pub use std::process::Command;
    
    pub fn start() -> std::io::Result<std::process::Child> {
        Command::new("cargo")
            .args(&["run", "--manifest-path", "queue-worker/Cargo.toml"])
            .spawn()
    }
}



#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>>{
   Ok(())
}

