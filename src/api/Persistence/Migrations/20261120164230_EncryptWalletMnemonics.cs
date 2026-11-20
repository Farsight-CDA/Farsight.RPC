using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Farsight.Rpc.Api.Persistence.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20261120164230_EncryptWalletMnemonics")]
public sealed class EncryptWalletMnemonics : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
        // Startup encrypts existing mnemonics with the application key, then finalizes the schema.
        => migrationBuilder.AddColumn<byte[]>(
            name: "EncryptedMnemonic",
            table: "Wallets",
            type: "bytea",
            nullable: true);

    protected override void Down(MigrationBuilder migrationBuilder)
        => throw new NotSupportedException("Wallet mnemonic encryption cannot be rolled back by a schema migration.");
}
