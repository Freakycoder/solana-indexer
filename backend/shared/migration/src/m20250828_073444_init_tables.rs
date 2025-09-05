use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Mint::Table)
                    .if_not_exists()
                    .col(
                        pk_uuid(Mint::Id)
                            .uuid()
                            .not_null()
                            .default(Expr::cust("gen_random_uuid()")),
                    )
                    .col(string_uniq(Mint::MintAddress))
                    .col(small_integer(Mint::Decimal))
                    .col(big_integer(Mint::Supply))
                    .col(text_null(Mint::MintAuthority))
                    .col(text_null(Mint::FreezeAuthority))
                    .col(boolean(Mint::IsInitialized))
                    .col(
                        timestamp_with_time_zone(Mint::CreatedAt)
                            .default(Expr::current_timestamp()),
                    )
                    .to_owned(),
            )
            .await?;

        // Create nft_metadata table (NO foreign key constraint to mint)
        manager
            .create_table(
                Table::create()
                    .table(NftMetadata::Table)
                    .if_not_exists()
                    .col(
                        pk_uuid(NftMetadata::Id)
                            .uuid()
                            .not_null()
                            .default(Expr::cust("gen_random_uuid()")),
                    )
                    .col(string_uniq(NftMetadata::MintAddress))
                    .col(string_null(NftMetadata::MetadataAddress)) // NULLABLE, no unique constraint
                    .col(text(NftMetadata::Name))
                    .col(text(NftMetadata::Symbol))
                    .col(text(NftMetadata::MetadataUri))
                    .col(small_integer(NftMetadata::SellerFeeBasisPoints))
                    .col(string(NftMetadata::UpdateAuthority))
                    .col(boolean(NftMetadata::PrimarySaleHappened))
                    .col(boolean(NftMetadata::IsMutable))
                    .col(
                        timestamp_with_time_zone(NftMetadata::CreatedAt)
                            .default(Expr::current_timestamp()),
                    )
                    // NO FOREIGN KEY CONSTRAINT
                    .to_owned(),
            )
            .await?;

        // Create nft_json_metadata table (NO foreign key constraint to mint)
        manager
            .create_table(
                Table::create()
                    .table(NftJsonMetadata::Table)
                    .if_not_exists()
                    .col(
                        pk_uuid(NftJsonMetadata::Id)
                            .uuid()
                            .not_null()
                            .default(Expr::cust("gen_random_uuid()")),
                    )
                    .col(string_uniq(NftJsonMetadata::MintAddress))
                    .col(text_null(NftJsonMetadata::Description))
                    .col(text_null(NftJsonMetadata::Image))
                    .col(text_null(NftJsonMetadata::AnimationUrl))
                    .col(text_null(NftJsonMetadata::ExternalUrl))
                    .col(json_binary_null(NftJsonMetadata::Attributes))
                    .col(json_binary_null(NftJsonMetadata::Properties))
                    .col(text_null(NftJsonMetadata::CollectionName))
                    .col(text_null(NftJsonMetadata::CollectionFamily))
                    .col(
                        timestamp_with_time_zone(NftJsonMetadata::CreatedAt)
                            .default(Expr::current_timestamp()),
                    )
                    // NO FOREIGN KEY CONSTRAINT
                    .to_owned(),
            )
            .await?;

        // Create nft_creator table (references nft_metadata by metadata_address)
        manager
            .create_table(
                Table::create()
                    .table(NftCreator::Table)
                    .if_not_exists()
                    .col(
                        pk_uuid(NftCreator::Id)
                            .uuid()
                            .not_null()
                            .default(Expr::cust("gen_random_uuid()")),
                    )
                    .col(string_null(NftCreator::MetadataAddress)) // Made nullable since parent can be null
                    .col(string(NftCreator::CreatorAddress))
                    .col(boolean(NftCreator::Verified))
                    .col(small_integer(NftCreator::Share))
                    .col(
                        timestamp_with_time_zone(NftCreator::CreatedAt)
                            .default(Expr::current_timestamp()),
                    )
                    // NO FOREIGN KEY CONSTRAINT (since metadata_address can be null)
                    .to_owned(),
            )
            .await?;

        // Create nft_ownership table (NO foreign key constraint to mint)
        manager
            .create_table(
                Table::create()
                    .table(NftOwnership::Table)
                    .if_not_exists()
                    .col(
                        pk_uuid(NftOwnership::Id)
                            .uuid()
                            .not_null()
                            .default(Expr::cust("gen_random_uuid()")),
                    )
                    .col(string_uniq(NftOwnership::MintAddress))
                    .col(string(NftOwnership::Owner))
                    .col(text_null(NftOwnership::Delegate))
                    .col(boolean(NftOwnership::Frozen))
                    .col(boolean(NftOwnership::Delegated))
                    .col(string(NftOwnership::OwnershipModel))
                    .col(timestamp_with_time_zone(NftOwnership::UpdatedAt))
                    .col(
                        timestamp_with_time_zone(NftOwnership::CreatedAt)
                            .default(Expr::current_timestamp()),
                    )
                    // NO FOREIGN KEY CONSTRAINT
                    .to_owned(),
            )
            .await?;

        // Create nft_royalty table (NO foreign key constraint to mint)
        manager
            .create_table(
                Table::create()
                    .table(NftRoyalty::Table)
                    .if_not_exists()
                    .col(
                        pk_uuid(NftRoyalty::Id)
                            .uuid()
                            .not_null()
                            .default(Expr::cust("gen_random_uuid()")),
                    )
                    .col(string_uniq(NftRoyalty::MintAddress))
                    .col(text(NftRoyalty::RoyaltyModel))
                    .col(text_null(NftRoyalty::Target))
                    .col(double(NftRoyalty::Percent))
                    .col(small_unsigned(NftRoyalty::BasisPoints))
                    .col(boolean(NftRoyalty::PrimarySaleHappened))
                    .col(boolean(NftRoyalty::Locked))
                    .col(timestamp_with_time_zone(NftRoyalty::UpdatedAt))
                    .col(
                        timestamp_with_time_zone(NftRoyalty::CreatedAt)
                            .default(Expr::current_timestamp()),
                    )
                    // NO FOREIGN KEY CONSTRAINT
                    .to_owned(),
            )
            .await?;

        // Create token_accounts table (NO foreign key constraint to mint)
        manager
            .create_table(
                Table::create()
                    .table(TokenAccounts::Table)
                    .if_not_exists()
                    .col(
                        pk_uuid(TokenAccounts::Id)
                            .uuid()
                            .not_null()
                            .default(Expr::cust("gen_random_uuid()")),
                    )
                    .col(string_uniq(TokenAccounts::TokenAddress))
                    .col(string_uniq(TokenAccounts::MintAddress))
                    .col(string(TokenAccounts::Owner))
                    .col(big_integer(TokenAccounts::Amount))
                    .col(text_null(TokenAccounts::Delegate))
                    .col(string(TokenAccounts::DelegatedAmount))
                    .col(small_integer(TokenAccounts::State))
                    .col(text_null(TokenAccounts::CloseAuthority))
                    .col(boolean(TokenAccounts::IsNative))
                    .col(string(TokenAccounts::RentExemptReserve))
                    .col(
                        timestamp_with_time_zone(TokenAccounts::CreatedAt)
                            .default(Expr::current_timestamp()),
                    )
                    // NO FOREIGN KEY CONSTRAINT
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(TokenAccounts::Table).to_owned())
            .await?;

        manager
            .drop_table(Table::drop().table(NftRoyalty::Table).to_owned())
            .await?;

        manager
            .drop_table(Table::drop().table(NftOwnership::Table).to_owned())
            .await?;

        manager
            .drop_table(Table::drop().table(NftCreator::Table).to_owned())
            .await?;

        manager
            .drop_table(Table::drop().table(NftJsonMetadata::Table).to_owned())
            .await?;

        manager
            .drop_table(Table::drop().table(NftMetadata::Table).to_owned())
            .await?;

        manager
            .drop_table(Table::drop().table(Mint::Table).to_owned())
            .await?;

        Ok(())
    }
}

#[derive(DeriveIden)]
enum Mint {
    Table,
    Id,
    MintAddress,
    Decimal,
    Supply,
    MintAuthority,
    FreezeAuthority,
    IsInitialized,
    CreatedAt,
}

#[derive(DeriveIden)]
enum NftMetadata {
    Table,
    Id,
    MintAddress,
    MetadataAddress,
    Name,
    Symbol,
    MetadataUri,
    SellerFeeBasisPoints,
    UpdateAuthority,
    PrimarySaleHappened,
    IsMutable,
    CreatedAt,
}

#[derive(DeriveIden)]
enum NftJsonMetadata {
    Table,
    Id,
    MintAddress,
    Description,
    Image,
    AnimationUrl,
    ExternalUrl,
    Attributes,
    Properties,
    CollectionName,
    CollectionFamily,
    CreatedAt,
}

#[derive(DeriveIden)]
enum NftCreator {
    Table,
    Id,
    MetadataAddress,
    CreatorAddress,
    Verified,
    Share,
    CreatedAt,
}

#[derive(DeriveIden)]
enum NftOwnership {
    Table,
    Id,
    MintAddress,
    Owner,
    Delegate,
    Frozen,
    Delegated,
    OwnershipModel,
    UpdatedAt,
    CreatedAt,
}

#[derive(DeriveIden)]
enum NftRoyalty {
    Table,
    Id,
    MintAddress,
    RoyaltyModel,
    Target,
    Percent,
    BasisPoints,
    PrimarySaleHappened,
    Locked,
    UpdatedAt,
    CreatedAt,
}

#[derive(DeriveIden)]
enum TokenAccounts {
    Table,
    Id,
    TokenAddress,
    MintAddress,
    Owner,
    Amount,
    Delegate,
    DelegatedAmount,
    State,
    CloseAuthority,
    IsNative,
    RentExemptReserve,
    CreatedAt,
}
