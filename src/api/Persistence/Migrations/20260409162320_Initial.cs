using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Farsight.Rpc.Api.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Initial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:CollationDefinition:name_case_insensitive", "und-u-ks-level2,und-u-ks-level2,icu,False");

            migrationBuilder.CreateTable(
                name: "ConsumerApplications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false, collation: "name_case_insensitive")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConsumerApplications", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RpcProviders",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false, collation: "name_case_insensitive"),
                    RateLimit = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RpcProviders", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ConsumerApiKeys",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Environment = table.Column<int>(type: "integer", nullable: false),
                    ApplicationId = table.Column<Guid>(type: "uuid", nullable: false),
                    Key = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConsumerApiKeys", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ConsumerApiKeys_ConsumerApplications_ApplicationId",
                        column: x => x.ApplicationId,
                        principalTable: "ConsumerApplications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ArchiveRpcs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Environment = table.Column<int>(type: "integer", nullable: false),
                    Chain = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Address = table.Column<string>(type: "text", nullable: false),
                    ProviderId = table.Column<Guid>(type: "uuid", nullable: false),
                    ApplicationId = table.Column<Guid>(type: "uuid", nullable: false),
                    IndexerStepSize = table.Column<decimal>(type: "numeric(20,0)", nullable: false),
                    DexIndexerStepSize = table.Column<decimal>(type: "numeric(20,0)", nullable: false),
                    IndexerBlockOffset = table.Column<decimal>(type: "numeric(20,0)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ArchiveRpcs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ArchiveRpcs_ConsumerApplications_ApplicationId",
                        column: x => x.ApplicationId,
                        principalTable: "ConsumerApplications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ArchiveRpcs_RpcProviders_ProviderId",
                        column: x => x.ProviderId,
                        principalTable: "RpcProviders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RealtimeRpcs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Environment = table.Column<int>(type: "integer", nullable: false),
                    Chain = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Address = table.Column<string>(type: "text", nullable: false),
                    ProviderId = table.Column<Guid>(type: "uuid", nullable: false),
                    ApplicationId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RealtimeRpcs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RealtimeRpcs_ConsumerApplications_ApplicationId",
                        column: x => x.ApplicationId,
                        principalTable: "ConsumerApplications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RealtimeRpcs_RpcProviders_ProviderId",
                        column: x => x.ProviderId,
                        principalTable: "RpcProviders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TracingRpcs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Environment = table.Column<int>(type: "integer", nullable: false),
                    Chain = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Address = table.Column<string>(type: "text", nullable: false),
                    ProviderId = table.Column<Guid>(type: "uuid", nullable: false),
                    ApplicationId = table.Column<Guid>(type: "uuid", nullable: false),
                    TracingMode = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TracingRpcs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TracingRpcs_ConsumerApplications_ApplicationId",
                        column: x => x.ApplicationId,
                        principalTable: "ConsumerApplications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TracingRpcs_RpcProviders_ProviderId",
                        column: x => x.ProviderId,
                        principalTable: "RpcProviders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ArchiveRpcs_ApplicationId_Environment",
                table: "ArchiveRpcs",
                columns: new[] { "ApplicationId", "Environment" });

            migrationBuilder.CreateIndex(
                name: "IX_ArchiveRpcs_ProviderId",
                table: "ArchiveRpcs",
                column: "ProviderId");

            migrationBuilder.CreateIndex(
                name: "IX_ConsumerApiKeys_ApplicationId_Environment",
                table: "ConsumerApiKeys",
                columns: new[] { "ApplicationId", "Environment" });

            migrationBuilder.CreateIndex(
                name: "IX_ConsumerApplications_Name",
                table: "ConsumerApplications",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RealtimeRpcs_ApplicationId_Environment",
                table: "RealtimeRpcs",
                columns: new[] { "ApplicationId", "Environment" });

            migrationBuilder.CreateIndex(
                name: "IX_RealtimeRpcs_ProviderId",
                table: "RealtimeRpcs",
                column: "ProviderId");

            migrationBuilder.CreateIndex(
                name: "IX_RpcProviders_Name",
                table: "RpcProviders",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TracingRpcs_ApplicationId_Environment",
                table: "TracingRpcs",
                columns: new[] { "ApplicationId", "Environment" });

            migrationBuilder.CreateIndex(
                name: "IX_TracingRpcs_ProviderId",
                table: "TracingRpcs",
                column: "ProviderId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ArchiveRpcs");

            migrationBuilder.DropTable(
                name: "ConsumerApiKeys");

            migrationBuilder.DropTable(
                name: "RealtimeRpcs");

            migrationBuilder.DropTable(
                name: "TracingRpcs");

            migrationBuilder.DropTable(
                name: "ConsumerApplications");

            migrationBuilder.DropTable(
                name: "RpcProviders");
        }
    }
}
