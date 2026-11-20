using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Farsight.Rpc.Api.Persistence.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20261120172416_HashWalletApiKeys")]
public sealed class HashWalletApiKeys : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
        => migrationBuilder.Sql("""
            ALTER TABLE "WalletApiKeys" RENAME COLUMN "Key" TO "KeyHash";
            ALTER TABLE "WalletApiKeys" ALTER COLUMN "KeyHash" TYPE bytea USING sha256(convert_to("KeyHash", 'UTF8'));
            ALTER INDEX "IX_WalletApiKeys_Key" RENAME TO "IX_WalletApiKeys_KeyHash";
            """);

    protected override void Down(MigrationBuilder migrationBuilder)
        => throw new NotSupportedException("Plaintext wallet API keys cannot be recovered from their hashes.");
}
