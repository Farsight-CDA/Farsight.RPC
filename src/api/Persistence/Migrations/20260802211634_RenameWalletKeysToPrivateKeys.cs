using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Farsight.Rpc.Api.Persistence.Migrations;

/// <inheritdoc />
public partial class RenameWalletKeysToPrivateKeys : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey(
            name: "FK_WalletApiKeys_WalletKeys_WalletKeyId",
            table: "WalletApiKeys");

        migrationBuilder.DropForeignKey(
            name: "FK_WalletKeys_Wallets_WalletId",
            table: "WalletKeys");

        migrationBuilder.DropPrimaryKey(
            name: "PK_WalletKeys",
            table: "WalletKeys");

        migrationBuilder.RenameTable(
            name: "WalletKeys",
            newName: "WalletPrivateKeys");

        migrationBuilder.RenameColumn(
            name: "WalletKeyId",
            table: "WalletApiKeys",
            newName: "WalletPrivateKeyId");

        migrationBuilder.RenameIndex(
            name: "IX_WalletApiKeys_WalletKeyId",
            table: "WalletApiKeys",
            newName: "IX_WalletApiKeys_WalletPrivateKeyId");

        migrationBuilder.RenameIndex(
            name: "IX_WalletKeys_WalletId_Curve_DerivationPath",
            table: "WalletPrivateKeys",
            newName: "IX_WalletPrivateKeys_WalletId_Curve_DerivationPath");

        migrationBuilder.AddPrimaryKey(
            name: "PK_WalletPrivateKeys",
            table: "WalletPrivateKeys",
            column: "Id");

        migrationBuilder.AddForeignKey(
            name: "FK_WalletPrivateKeys_Wallets_WalletId",
            table: "WalletPrivateKeys",
            column: "WalletId",
            principalTable: "Wallets",
            principalColumn: "Id",
            onDelete: ReferentialAction.Cascade);

        migrationBuilder.AddForeignKey(
            name: "FK_WalletApiKeys_WalletPrivateKeys_WalletPrivateKeyId",
            table: "WalletApiKeys",
            column: "WalletPrivateKeyId",
            principalTable: "WalletPrivateKeys",
            principalColumn: "Id",
            onDelete: ReferentialAction.Cascade);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey(
            name: "FK_WalletApiKeys_WalletPrivateKeys_WalletPrivateKeyId",
            table: "WalletApiKeys");

        migrationBuilder.DropForeignKey(
            name: "FK_WalletPrivateKeys_Wallets_WalletId",
            table: "WalletPrivateKeys");

        migrationBuilder.DropPrimaryKey(
            name: "PK_WalletPrivateKeys",
            table: "WalletPrivateKeys");

        migrationBuilder.RenameTable(
            name: "WalletPrivateKeys",
            newName: "WalletKeys");

        migrationBuilder.RenameColumn(
            name: "WalletPrivateKeyId",
            table: "WalletApiKeys",
            newName: "WalletKeyId");

        migrationBuilder.RenameIndex(
            name: "IX_WalletApiKeys_WalletPrivateKeyId",
            table: "WalletApiKeys",
            newName: "IX_WalletApiKeys_WalletKeyId");

        migrationBuilder.RenameIndex(
            name: "IX_WalletPrivateKeys_WalletId_Curve_DerivationPath",
            table: "WalletKeys",
            newName: "IX_WalletKeys_WalletId_Curve_DerivationPath");

        migrationBuilder.AddPrimaryKey(
            name: "PK_WalletKeys",
            table: "WalletKeys",
            column: "Id");

        migrationBuilder.AddForeignKey(
            name: "FK_WalletKeys_Wallets_WalletId",
            table: "WalletKeys",
            column: "WalletId",
            principalTable: "Wallets",
            principalColumn: "Id",
            onDelete: ReferentialAction.Cascade);

        migrationBuilder.AddForeignKey(
            name: "FK_WalletApiKeys_WalletKeys_WalletKeyId",
            table: "WalletApiKeys",
            column: "WalletKeyId",
            principalTable: "WalletKeys",
            principalColumn: "Id",
            onDelete: ReferentialAction.Cascade);
    }
}
