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
                    .col(pk_uuid(Mint::Id))
                    .col(string_uniq(Mint::MintAddress))
                    .col(tiny_unsigned(Mint::Decimal))
                    .col(big_unsigned(Mint::Supply))
                    .col(text_null(Mint::MintAuthority))
                    .col(text_null(Mint::FreezeAuthority))
                    .col(boolean(Mint::IsInitialized))
                    .col(timestamp_with_time_zone(Mint::CreatedAt))
                    .to_owned(),
            )
            .await?;

        // Create nft_metadata table (references mint)
        manager
            .create_table(
                Table::create()
                    .table(NftMetadata::Table)
                    .if_not_exists()
                    .col(pk_uuid(NftMetadata::Id))
                    .col(string_uniq(NftMetadata::MintAddress))
                    .col(string_uniq(NftMetadata::MetadataAddress))
                    .col(text(NftMetadata::Name))
                    .col(text(NftMetadata::Symbol))
                    .col(text(NftMetadata::Uri))
                    .col(small_unsigned(NftMetadata::SellerFeeBasisPoints))
                    .col(string(NftMetadata::UpdateAuthority))
                    .col(boolean(NftMetadata::PrimarySaleHappened))
                    .col(boolean(NftMetadata::IsMutable))
                    .col(timestamp_with_time_zone(NftMetadata::CreatedAt))
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_nft_metadata_mint_address")
                            .from(NftMetadata::Table, NftMetadata::MintAddress)
                            .to(Mint::Table, Mint::MintAddress)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // Create nft_json_metadata table (references mint)
        manager
            .create_table(
                Table::create()
                    .table(NftJsonMetadata::Table)
                    .if_not_exists()
                    .col(pk_uuid(NftJsonMetadata::Id))
                    .col(string_uniq(NftJsonMetadata::MintAddress))
                    .col(text_null(NftJsonMetadata::Description))
                    .col(text_null(NftJsonMetadata::Image))
                    .col(text_null(NftJsonMetadata::AnimationUrl))
                    .col(text_null(NftJsonMetadata::ExternalUrl))
                    .col(json_binary_null(NftJsonMetadata::Attributes))
                    .col(json_binary_null(NftJsonMetadata::Properties))
                    .col(text_null(NftJsonMetadata::CollectionName))
                    .col(text_null(NftJsonMetadata::CollectionFamily))
                    .col(timestamp_with_time_zone(NftJsonMetadata::UpdatedAt))
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_nft_json_metadata_mint_address")
                            .from(NftJsonMetadata::Table, NftJsonMetadata::MintAddress)
                            .to(Mint::Table, Mint::MintAddress)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // Create nft_creator table (references nft_metadata)
        manager
            .create_table(
                Table::create()
                    .table(NftCreator::Table)
                    .if_not_exists()
                    .col(pk_uuid(NftCreator::Id))
                    .col(string(NftCreator::MetadataAddress))
                    .col(string(NftCreator::CreatorAddress))
                    .col(boolean(NftCreator::Verified))
                    .col(small_integer(NftCreator::Share))
                    .col(timestamp_with_time_zone(NftCreator::CreatedAt))
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_nft_creator_metadata_address")
                            .from(NftCreator::Table, NftCreator::MetadataAddress)
                            .to(NftMetadata::Table, NftMetadata::MetadataAddress)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // Create nft_ownership table (references mint)
        manager
            .create_table(
                Table::create()
                    .table(NftOwnership::Table)
                    .if_not_exists()
                    .col(pk_uuid(NftOwnership::Id))
                    .col(string_uniq(NftOwnership::MintAddress))
                    .col(string(NftOwnership::Owner))
                    .col(text_null(NftOwnership::Delegate))
                    .col(boolean(NftOwnership::Frozen))
                    .col(boolean(NftOwnership::Delegated))
                    .col(string(NftOwnership::OwnershipModel))
                    .col(timestamp_with_time_zone(NftOwnership::UpdatedAt))
                    .col(timestamp_with_time_zone(NftOwnership::CreatedAt))
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_nft_ownership_mint_address")
                            .from(NftOwnership::Table, NftOwnership::MintAddress)
                            .to(Mint::Table, Mint::MintAddress)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // Create nft_royalty table (references mint)
        manager
            .create_table(
                Table::create()
                    .table(NftRoyalty::Table)
                    .if_not_exists()
                    .col(pk_uuid(NftRoyalty::Id))
                    .col(string_uniq(NftRoyalty::MintAddress))
                    .col(text(NftRoyalty::RoyaltyModel))
                    .col(text_null(NftRoyalty::Target))
                    .col(double(NftRoyalty::Percent))
                    .col(small_unsigned(NftRoyalty::BasisPoints))
                    .col(boolean(NftRoyalty::PrimarySaleHappened))
                    .col(boolean(NftRoyalty::Locked))
                    .col(timestamp_with_time_zone(NftRoyalty::UpdatedAt))
                    .col(timestamp_with_time_zone(NftRoyalty::CreatedAt))
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_nft_royalty_mint_address")
                            .from(NftRoyalty::Table, NftRoyalty::MintAddress)
                            .to(Mint::Table, Mint::MintAddress)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // Create token_accounts table (references mint)
        manager
            .create_table(
                Table::create()
                    .table(TokenAccounts::Table)
                    .if_not_exists()
                    .col(pk_uuid(TokenAccounts::Id))
                    .col(string_uniq(TokenAccounts::TokenAddress))
                    .col(string_uniq(TokenAccounts::MintAddress))
                    .col(string(TokenAccounts::Owner))
                    .col(big_unsigned(TokenAccounts::Amount))
                    .col(text_null(TokenAccounts::Delegate))
                    .col(string(TokenAccounts::DelegatedAmount))
                    .col(tiny_unsigned(TokenAccounts::State))
                    .col(text_null(TokenAccounts::CloseAuthority))
                    .col(boolean(TokenAccounts::IsNative))
                    .col(string(TokenAccounts::RentExemptReserve))
                    .col(timestamp_with_time_zone(TokenAccounts::CreatedAt))
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_token_accounts_mint_address")
                            .from(TokenAccounts::Table, TokenAccounts::MintAddress)
                            .to(Mint::Table, Mint::MintAddress)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Replace the sample below with your own migration scripts
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
    Uri,
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
    UpdatedAt,
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