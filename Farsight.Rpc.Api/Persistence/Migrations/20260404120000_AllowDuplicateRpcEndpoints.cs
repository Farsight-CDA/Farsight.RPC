using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Farsight.Rpc.Api.Persistence.Migrations;

public partial class AllowDuplicateRpcEndpoints : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_rpc_archive_endpoints_Environment_ApplicationId_ChainId_Pro~",
            table: "rpc_archive_endpoints");

        migrationBuilder.DropIndex(
            name: "IX_rpc_realtime_endpoints_Environment_ApplicationId_ChainId_Pr~",
            table: "rpc_realtime_endpoints");

        migrationBuilder.DropIndex(
            name: "IX_rpc_tracing_endpoints_Environment_ApplicationId_ChainId_Pro~",
            table: "rpc_tracing_endpoints");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateIndex(
            name: "IX_rpc_archive_endpoints_Environment_ApplicationId_ChainId_Pro~",
            table: "rpc_archive_endpoints",
            columns: new[] { "Environment", "ApplicationId", "ChainId", "ProviderId", "Address" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_rpc_realtime_endpoints_Environment_ApplicationId_ChainId_Pr~",
            table: "rpc_realtime_endpoints",
            columns: new[] { "Environment", "ApplicationId", "ChainId", "ProviderId", "Address" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_rpc_tracing_endpoints_Environment_ApplicationId_ChainId_Pro~",
            table: "rpc_tracing_endpoints",
            columns: new[] { "Environment", "ApplicationId", "ChainId", "ProviderId", "Address" },
            unique: true);
    }
}
