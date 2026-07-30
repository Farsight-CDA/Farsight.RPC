using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Farsight.Rpc.Api.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddRpcRules : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RpcRules",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ApplicationId = table.Column<Guid>(type: "uuid", nullable: false),
                    EnvironmentId = table.Column<Guid>(type: "uuid", nullable: false),
                    AllOf = table.Column<int[]>(type: "integer[]", nullable: false),
                    AnyOf = table.Column<int[]>(type: "integer[]", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RpcRules", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RpcRules_ApplicationEnvironments_EnvironmentId",
                        column: x => x.EnvironmentId,
                        principalTable: "ApplicationEnvironments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RpcRules_ConsumerApplications_ApplicationId",
                        column: x => x.ApplicationId,
                        principalTable: "ConsumerApplications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RpcRules_ApplicationId_EnvironmentId",
                table: "RpcRules",
                columns: new[] { "ApplicationId", "EnvironmentId" });

            migrationBuilder.CreateIndex(
                name: "IX_RpcRules_EnvironmentId",
                table: "RpcRules",
                column: "EnvironmentId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RpcRules");
        }
    }
}
