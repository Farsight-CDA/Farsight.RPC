using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Farsight.Rpc.Api.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RemoveChainsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Add the new Chain (string) columns as nullable first
            migrationBuilder.AddColumn<string>(
                name: "Chain",
                table: "rpc_realtime_endpoints",
                type: "citext",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Chain",
                table: "rpc_archive_endpoints",
                type: "citext",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Chain",
                table: "rpc_tracing_endpoints",
                type: "citext",
                maxLength: 100,
                nullable: true);

            // 2. Populate Chain from the chains lookup table
            migrationBuilder.Sql("""
                UPDATE rpc_realtime_endpoints SET "Chain" = c."Name" FROM chains c WHERE c."Id" = "ChainId";
                UPDATE rpc_archive_endpoints SET "Chain" = c."Name" FROM chains c WHERE c."Id" = "ChainId";
                UPDATE rpc_tracing_endpoints SET "Chain" = c."Name" FROM chains c WHERE c."Id" = "ChainId";
                """);

            // 3. Make Chain non-nullable now that data is populated
            migrationBuilder.AlterColumn<string>(
                name: "Chain",
                table: "rpc_realtime_endpoints",
                type: "citext",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<string>(
                name: "Chain",
                table: "rpc_archive_endpoints",
                type: "citext",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<string>(
                name: "Chain",
                table: "rpc_tracing_endpoints",
                type: "citext",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            // 4. Drop foreign keys
            migrationBuilder.DropForeignKey(
                name: "FK_rpc_archive_endpoints_chains_ChainId",
                table: "rpc_archive_endpoints");

            migrationBuilder.DropForeignKey(
                name: "FK_rpc_realtime_endpoints_chains_ChainId",
                table: "rpc_realtime_endpoints");

            migrationBuilder.DropForeignKey(
                name: "FK_rpc_tracing_endpoints_chains_ChainId",
                table: "rpc_tracing_endpoints");

            // 5. Drop old indexes
            migrationBuilder.DropIndex(
                name: "IX_rpc_tracing_endpoints_ApplicationId_Environment_ChainId",
                table: "rpc_tracing_endpoints");

            migrationBuilder.DropIndex(
                name: "IX_rpc_tracing_endpoints_ChainId",
                table: "rpc_tracing_endpoints");

            migrationBuilder.DropIndex(
                name: "IX_rpc_realtime_endpoints_ApplicationId_Environment_ChainId",
                table: "rpc_realtime_endpoints");

            migrationBuilder.DropIndex(
                name: "IX_rpc_realtime_endpoints_ChainId",
                table: "rpc_realtime_endpoints");

            migrationBuilder.DropIndex(
                name: "IX_rpc_archive_endpoints_ApplicationId_Environment_ChainId",
                table: "rpc_archive_endpoints");

            migrationBuilder.DropIndex(
                name: "IX_rpc_archive_endpoints_ChainId",
                table: "rpc_archive_endpoints");

            // 6. Drop old ChainId columns
            migrationBuilder.DropColumn(
                name: "ChainId",
                table: "rpc_tracing_endpoints");

            migrationBuilder.DropColumn(
                name: "ChainId",
                table: "rpc_realtime_endpoints");

            migrationBuilder.DropColumn(
                name: "ChainId",
                table: "rpc_archive_endpoints");

            // 7. Drop the chains table
            migrationBuilder.DropTable(
                name: "chains");

            // 8. Create new indexes using Chain string
            migrationBuilder.CreateIndex(
                name: "IX_rpc_tracing_endpoints_ApplicationId_Environment_Chain",
                table: "rpc_tracing_endpoints",
                columns: new[] { "ApplicationId", "Environment", "Chain" });

            migrationBuilder.CreateIndex(
                name: "IX_rpc_realtime_endpoints_ApplicationId_Environment_Chain",
                table: "rpc_realtime_endpoints",
                columns: new[] { "ApplicationId", "Environment", "Chain" });

            migrationBuilder.CreateIndex(
                name: "IX_rpc_archive_endpoints_ApplicationId_Environment_Chain",
                table: "rpc_archive_endpoints",
                columns: new[] { "ApplicationId", "Environment", "Chain" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_rpc_tracing_endpoints_ApplicationId_Environment_Chain",
                table: "rpc_tracing_endpoints");

            migrationBuilder.DropIndex(
                name: "IX_rpc_realtime_endpoints_ApplicationId_Environment_Chain",
                table: "rpc_realtime_endpoints");

            migrationBuilder.DropIndex(
                name: "IX_rpc_archive_endpoints_ApplicationId_Environment_Chain",
                table: "rpc_archive_endpoints");

            migrationBuilder.DropColumn(
                name: "Chain",
                table: "rpc_tracing_endpoints");

            migrationBuilder.DropColumn(
                name: "Chain",
                table: "rpc_realtime_endpoints");

            migrationBuilder.DropColumn(
                name: "Chain",
                table: "rpc_archive_endpoints");

            migrationBuilder.AddColumn<Guid>(
                name: "ChainId",
                table: "rpc_tracing_endpoints",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "ChainId",
                table: "rpc_realtime_endpoints",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "ChainId",
                table: "rpc_archive_endpoints",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateTable(
                name: "chains",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "citext", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_chains", x => x.Id);
                    table.CheckConstraint("CK_chains_Name_NotEmpty", "btrim(\"Name\") <> ''");
                });

            migrationBuilder.CreateIndex(
                name: "IX_rpc_tracing_endpoints_ApplicationId_Environment_ChainId",
                table: "rpc_tracing_endpoints",
                columns: new[] { "ApplicationId", "Environment", "ChainId" });

            migrationBuilder.CreateIndex(
                name: "IX_rpc_tracing_endpoints_ChainId",
                table: "rpc_tracing_endpoints",
                column: "ChainId");

            migrationBuilder.CreateIndex(
                name: "IX_rpc_realtime_endpoints_ApplicationId_Environment_ChainId",
                table: "rpc_realtime_endpoints",
                columns: new[] { "ApplicationId", "Environment", "ChainId" });

            migrationBuilder.CreateIndex(
                name: "IX_rpc_realtime_endpoints_ChainId",
                table: "rpc_realtime_endpoints",
                column: "ChainId");

            migrationBuilder.CreateIndex(
                name: "IX_rpc_archive_endpoints_ApplicationId_Environment_ChainId",
                table: "rpc_archive_endpoints",
                columns: new[] { "ApplicationId", "Environment", "ChainId" });

            migrationBuilder.CreateIndex(
                name: "IX_rpc_archive_endpoints_ChainId",
                table: "rpc_archive_endpoints",
                column: "ChainId");

            migrationBuilder.CreateIndex(
                name: "IX_chains_Name",
                table: "chains",
                column: "Name",
                unique: true);

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
    }
}
