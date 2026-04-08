using Farsight.RPC.Providers.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Farsight.RPC.Providers.Data.Migrations;

[DbContext(typeof(RpcProvidersDbContext))]
[Migration("20260403120000_CascadeDeleteChainsToEndpoints")]
public sealed class CascadeDeleteChainsToEndpoints : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey(
            name: "FK_rpc_archive_endpoints_chains_ChainId",
            table: "rpc_archive_endpoints");

        migrationBuilder.DropForeignKey(
            name: "FK_rpc_realtime_endpoints_chains_ChainId",
            table: "rpc_realtime_endpoints");

        migrationBuilder.DropForeignKey(
            name: "FK_rpc_tracing_endpoints_chains_ChainId",
            table: "rpc_tracing_endpoints");

        migrationBuilder.AddForeignKey(
            name: "FK_rpc_archive_endpoints_chains_ChainId",
            table: "rpc_archive_endpoints",
            column: "ChainId",
            principalTable: "chains",
            principalColumn: "Id",
            onDelete: ReferentialAction.Cascade);

        migrationBuilder.AddForeignKey(
            name: "FK_rpc_realtime_endpoints_chains_ChainId",
            table: "rpc_realtime_endpoints",
            column: "ChainId",
            principalTable: "chains",
            principalColumn: "Id",
            onDelete: ReferentialAction.Cascade);

        migrationBuilder.AddForeignKey(
            name: "FK_rpc_tracing_endpoints_chains_ChainId",
            table: "rpc_tracing_endpoints",
            column: "ChainId",
            principalTable: "chains",
            principalColumn: "Id",
            onDelete: ReferentialAction.Cascade);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey(
            name: "FK_rpc_archive_endpoints_chains_ChainId",
            table: "rpc_archive_endpoints");

        migrationBuilder.DropForeignKey(
            name: "FK_rpc_realtime_endpoints_chains_ChainId",
            table: "rpc_realtime_endpoints");

        migrationBuilder.DropForeignKey(
            name: "FK_rpc_tracing_endpoints_chains_ChainId",
            table: "rpc_tracing_endpoints");

        migrationBuilder.AddForeignKey(
            name: "FK_rpc_archive_endpoints_chains_ChainId",
            table: "rpc_archive_endpoints",
            column: "ChainId",
            principalTable: "chains",
            principalColumn: "Id",
            onDelete: ReferentialAction.Restrict);

        migrationBuilder.AddForeignKey(
            name: "FK_rpc_realtime_endpoints_chains_ChainId",
            table: "rpc_realtime_endpoints",
            column: "ChainId",
            principalTable: "chains",
            principalColumn: "Id",
            onDelete: ReferentialAction.Restrict);

        migrationBuilder.AddForeignKey(
            name: "FK_rpc_tracing_endpoints_chains_ChainId",
            table: "rpc_tracing_endpoints",
            column: "ChainId",
            principalTable: "chains",
            principalColumn: "Id",
            onDelete: ReferentialAction.Restrict);
    }
}
