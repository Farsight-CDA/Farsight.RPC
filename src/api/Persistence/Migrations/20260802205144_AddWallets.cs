using Microsoft.EntityFrameworkCore.Migrations;
using System;

#nullable disable

namespace Farsight.Rpc.Api.Persistence.Migrations;

/// <inheritdoc />
public partial class AddWallets : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "Wallets",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                Name = table.Column<string>(type: "text", nullable: false, collation: "name_case_insensitive"),
                Mnemonic = table.Column<string>(type: "text", nullable: false),
                Color = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: false, defaultValue: "#6B7280")
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Wallets", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "WalletKeys",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                WalletId = table.Column<Guid>(type: "uuid", nullable: false),
                Curve = table.Column<string>(type: "text", nullable: false),
                DerivationPath = table.Column<string>(type: "text", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_WalletKeys", x => x.Id);
                table.ForeignKey(
                    name: "FK_WalletKeys_Wallets_WalletId",
                    column: x => x.WalletId,
                    principalTable: "Wallets",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "WalletApiKeys",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                WalletKeyId = table.Column<Guid>(type: "uuid", nullable: false),
                Name = table.Column<string>(type: "text", nullable: false),
                Key = table.Column<string>(type: "text", nullable: false),
                LastUsedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_WalletApiKeys", x => x.Id);
                table.ForeignKey(
                    name: "FK_WalletApiKeys_WalletKeys_WalletKeyId",
                    column: x => x.WalletKeyId,
                    principalTable: "WalletKeys",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_WalletApiKeys_Key",
            table: "WalletApiKeys",
            column: "Key",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_WalletApiKeys_WalletKeyId",
            table: "WalletApiKeys",
            column: "WalletKeyId");

        migrationBuilder.CreateIndex(
            name: "IX_WalletKeys_WalletId_Curve_DerivationPath",
            table: "WalletKeys",
            columns: ["WalletId", "Curve", "DerivationPath"],
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_Wallets_Name",
            table: "Wallets",
            column: "Name",
            unique: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "WalletApiKeys");

        migrationBuilder.DropTable(
            name: "WalletKeys");

        migrationBuilder.DropTable(
            name: "Wallets");
    }
}
