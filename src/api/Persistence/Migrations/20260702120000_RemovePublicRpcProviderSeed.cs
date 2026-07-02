using Farsight.Rpc.Api.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Farsight.Rpc.Api.Persistence.Migrations;

/// <inheritdoc />
[DbContext(typeof(AppDbContext))]
[Migration("20260702120000_RemovePublicRpcProviderSeed")]
public partial class RemovePublicRpcProviderSeed : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
        => migrationBuilder.Sql("""
            DELETE FROM "RpcProviders"
            WHERE "Id" = '00000000-0000-0000-0000-000000000001'
              AND NOT EXISTS (
                  SELECT 1
                  FROM "Rpcs"
                  WHERE "ProviderId" = '00000000-0000-0000-0000-000000000001'
              );
            """);

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
        => migrationBuilder.Sql("""
            INSERT INTO "RpcProviders" ("Id", "Name", "RateLimit")
            VALUES ('00000000-0000-0000-0000-000000000001', 'Public RPC', 5)
            ON CONFLICT DO NOTHING;
            """);
}
