using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Farsight.Rpc.Api.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPublicRpcProvider : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "RpcProviders",
                columns: new[] { "Id", "Name", "RateLimit" },
                values: new object[] { new Guid("00000000-0000-0000-0000-000000000001"), "Public RPC", 5 });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "RpcProviders",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000001"));
        }
    }
}
