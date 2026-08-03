using Microsoft.EntityFrameworkCore.Migrations;
using System;

#nullable disable

namespace Farsight.Rpc.Api.Persistence.Migrations;

/// <inheritdoc />
public partial class AddWalletPrivateKeyGroups : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<Guid>(
            name: "GroupId",
            table: "WalletPrivateKeys",
            type: "uuid",
            nullable: true);

        migrationBuilder.CreateTable(
            name: "WalletPrivateKeyGroups",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                WalletId = table.Column<Guid>(type: "uuid", nullable: false),
                Name = table.Column<string>(type: "text", nullable: false, collation: "name_case_insensitive"),
                Description = table.Column<string>(type: "text", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_WalletPrivateKeyGroups", x => x.Id);
                table.ForeignKey(
                    name: "FK_WalletPrivateKeyGroups_Wallets_WalletId",
                    column: x => x.WalletId,
                    principalTable: "Wallets",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_WalletPrivateKeys_GroupId",
            table: "WalletPrivateKeys",
            column: "GroupId");

        migrationBuilder.CreateIndex(
            name: "IX_WalletPrivateKeyGroups_WalletId_Name",
            table: "WalletPrivateKeyGroups",
            columns: ["WalletId", "Name"],
            unique: true);

        migrationBuilder.AddForeignKey(
            name: "FK_WalletPrivateKeys_WalletPrivateKeyGroups_GroupId",
            table: "WalletPrivateKeys",
            column: "GroupId",
            principalTable: "WalletPrivateKeyGroups",
            principalColumn: "Id",
            onDelete: ReferentialAction.SetNull);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey(
            name: "FK_WalletPrivateKeys_WalletPrivateKeyGroups_GroupId",
            table: "WalletPrivateKeys");

        migrationBuilder.DropTable(
            name: "WalletPrivateKeyGroups");

        migrationBuilder.DropIndex(
            name: "IX_WalletPrivateKeys_GroupId",
            table: "WalletPrivateKeys");

        migrationBuilder.DropColumn(
            name: "GroupId",
            table: "WalletPrivateKeys");
    }
}
