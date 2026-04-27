using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Farsight.Rpc.Api.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddRpcErrorGroups : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RpcErrorGroups",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false, collation: "name_case_insensitive"),
                    Action = table.Column<string>(type: "text", nullable: false),
                    Errors = table.Column<string[]>(type: "text[]", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RpcErrorGroups", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RpcErrorGroups_Name",
                table: "RpcErrorGroups",
                column: "Name",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RpcErrorGroups");
        }
    }
}
