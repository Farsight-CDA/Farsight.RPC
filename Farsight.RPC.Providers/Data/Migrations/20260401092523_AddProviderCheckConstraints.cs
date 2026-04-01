using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Farsight.RPC.Providers.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddProviderCheckConstraints : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddCheckConstraint(
                name: "CK_rpc_tracing_endpoints_Address_Scheme",
                table: "rpc_tracing_endpoints",
                sql: "\"Address\" ~* '^(http|https|ws|wss)://'");

            migrationBuilder.AddCheckConstraint(
                name: "CK_rpc_tracing_endpoints_Application_NotEmpty",
                table: "rpc_tracing_endpoints",
                sql: "btrim(\"Application\") <> ''");

            migrationBuilder.AddCheckConstraint(
                name: "CK_rpc_tracing_endpoints_Chain_NotEmpty",
                table: "rpc_tracing_endpoints",
                sql: "btrim(\"Chain\") <> ''");

            migrationBuilder.AddCheckConstraint(
                name: "CK_rpc_tracing_endpoints_Provider_NotEmpty",
                table: "rpc_tracing_endpoints",
                sql: "btrim(\"Provider\") <> ''");

            migrationBuilder.AddCheckConstraint(
                name: "CK_rpc_realtime_endpoints_Address_Scheme",
                table: "rpc_realtime_endpoints",
                sql: "\"Address\" ~* '^(http|https|ws|wss)://'");

            migrationBuilder.AddCheckConstraint(
                name: "CK_rpc_realtime_endpoints_Application_NotEmpty",
                table: "rpc_realtime_endpoints",
                sql: "btrim(\"Application\") <> ''");

            migrationBuilder.AddCheckConstraint(
                name: "CK_rpc_realtime_endpoints_Chain_NotEmpty",
                table: "rpc_realtime_endpoints",
                sql: "btrim(\"Chain\") <> ''");

            migrationBuilder.AddCheckConstraint(
                name: "CK_rpc_realtime_endpoints_Provider_NotEmpty",
                table: "rpc_realtime_endpoints",
                sql: "btrim(\"Provider\") <> ''");

            migrationBuilder.AddCheckConstraint(
                name: "CK_rpc_archive_endpoints_Address_Scheme",
                table: "rpc_archive_endpoints",
                sql: "\"Address\" ~* '^(http|https|ws|wss)://'");

            migrationBuilder.AddCheckConstraint(
                name: "CK_rpc_archive_endpoints_Application_NotEmpty",
                table: "rpc_archive_endpoints",
                sql: "btrim(\"Application\") <> ''");

            migrationBuilder.AddCheckConstraint(
                name: "CK_rpc_archive_endpoints_Chain_NotEmpty",
                table: "rpc_archive_endpoints",
                sql: "btrim(\"Chain\") <> ''");

            migrationBuilder.AddCheckConstraint(
                name: "CK_rpc_archive_endpoints_Provider_NotEmpty",
                table: "rpc_archive_endpoints",
                sql: "btrim(\"Provider\") <> ''");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_rpc_tracing_endpoints_Address_Scheme",
                table: "rpc_tracing_endpoints");

            migrationBuilder.DropCheckConstraint(
                name: "CK_rpc_tracing_endpoints_Application_NotEmpty",
                table: "rpc_tracing_endpoints");

            migrationBuilder.DropCheckConstraint(
                name: "CK_rpc_tracing_endpoints_Chain_NotEmpty",
                table: "rpc_tracing_endpoints");

            migrationBuilder.DropCheckConstraint(
                name: "CK_rpc_tracing_endpoints_Provider_NotEmpty",
                table: "rpc_tracing_endpoints");

            migrationBuilder.DropCheckConstraint(
                name: "CK_rpc_realtime_endpoints_Address_Scheme",
                table: "rpc_realtime_endpoints");

            migrationBuilder.DropCheckConstraint(
                name: "CK_rpc_realtime_endpoints_Application_NotEmpty",
                table: "rpc_realtime_endpoints");

            migrationBuilder.DropCheckConstraint(
                name: "CK_rpc_realtime_endpoints_Chain_NotEmpty",
                table: "rpc_realtime_endpoints");

            migrationBuilder.DropCheckConstraint(
                name: "CK_rpc_realtime_endpoints_Provider_NotEmpty",
                table: "rpc_realtime_endpoints");

            migrationBuilder.DropCheckConstraint(
                name: "CK_rpc_archive_endpoints_Address_Scheme",
                table: "rpc_archive_endpoints");

            migrationBuilder.DropCheckConstraint(
                name: "CK_rpc_archive_endpoints_Application_NotEmpty",
                table: "rpc_archive_endpoints");

            migrationBuilder.DropCheckConstraint(
                name: "CK_rpc_archive_endpoints_Chain_NotEmpty",
                table: "rpc_archive_endpoints");

            migrationBuilder.DropCheckConstraint(
                name: "CK_rpc_archive_endpoints_Provider_NotEmpty",
                table: "rpc_archive_endpoints");
        }
    }
}
