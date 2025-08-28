use sea_orm_migration::{prelude::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(NftMetadata::Table)
                    .modify_column(
                        ColumnDef::new(NftMetadata::MetadataAddress).string().null(), // Make it nullable
                    )
                    .to_owned(),
            )
            .await?;

        // Remove unique constraint on metadata_address since it can be null
        manager
            .drop_index(
                Index::drop()
                    .name("idx-nft_metadata-metadata_address") // This might have different name
                    .table(NftMetadata::Table)
                    .to_owned(),
            )
            .await
            .ok(); // Use .ok() because the index might not exist
        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(NftMetadata::Table)
                    .modify_column(
                        ColumnDef::new(NftMetadata::MetadataAddress)
                            .string()
                            .not_null()
                            .unique_key(),
                    )
                    .to_owned(),
            )
            .await
    }
}

#[derive(DeriveIden)]
enum NftMetadata {
    Table,
    MetadataAddress,
}