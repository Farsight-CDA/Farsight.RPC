using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Farsight.Rpc.Api.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RemoveRpcProbing : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ProbedUtc",
                table: "rpc_tracing_endpoints");

            migrationBuilder.DropColumn(
                name: "ProbedUtc",
                table: "rpc_realtime_endpoints");

            migrationBuilder.DropColumn(
                name: "ProbedUtc",
                table: "rpc_archive_endpoints");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ProbedUtc",
                table: "rpc_tracing_endpoints",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ProbedUtc",
                table: "rpc_realtime_endpoints",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ProbedUtc",
                table: "rpc_archive_endpoints",
                type: "timestamp with time zone",
                nullable: true);
        }
    }
}
