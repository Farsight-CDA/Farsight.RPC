using Microsoft.EntityFrameworkCore.Migrations;
using System;

#nullable disable

namespace Farsight.Rpc.Api.Persistence.Migrations;

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
                Name = table.Column<string>(type: "text", nullable: false, collation: "name_case_insensitive"),
                Structures = table.Column<string[]>(type: "text[]", nullable: false)
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
            name: "ApplicationEnvironments",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                ApplicationId = table.Column<Guid>(type: "uuid", nullable: false),
                Name = table.Column<string>(type: "text", nullable: false, collation: "name_case_insensitive")
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_ApplicationEnvironments", x => x.Id);
                table.ForeignKey(
                    name: "FK_ApplicationEnvironments_ConsumerApplications_ApplicationId",
                    column: x => x.ApplicationId,
                    principalTable: "ConsumerApplications",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "ConsumerApiKeys",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                EnvironmentId = table.Column<Guid>(type: "uuid", nullable: false),
                ApplicationId = table.Column<Guid>(type: "uuid", nullable: false),
                Key = table.Column<string>(type: "text", nullable: false),
                LastUsedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_ConsumerApiKeys", x => x.Id);
                table.ForeignKey(
                    name: "FK_ConsumerApiKeys_ApplicationEnvironments_EnvironmentId",
                    column: x => x.EnvironmentId,
                    principalTable: "ApplicationEnvironments",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_ConsumerApiKeys_ConsumerApplications_ApplicationId",
                    column: x => x.ApplicationId,
                    principalTable: "ConsumerApplications",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "Rpcs",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                EnvironmentId = table.Column<Guid>(type: "uuid", nullable: false),
                Chain = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                Address = table.Column<string>(type: "text", nullable: false),
                ProviderId = table.Column<Guid>(type: "uuid", nullable: false),
                ApplicationId = table.Column<Guid>(type: "uuid", nullable: false),
                RpcType = table.Column<string>(type: "character varying(13)", maxLength: 13, nullable: false),
                IndexerStepSize = table.Column<decimal>(type: "numeric(20,0)", nullable: true),
                IndexerBlockOffset = table.Column<decimal>(type: "numeric(20,0)", nullable: true),
                TracingMode = table.Column<int>(type: "integer", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Rpcs", x => x.Id);
                table.ForeignKey(
                    name: "FK_Rpcs_ApplicationEnvironments_EnvironmentId",
                    column: x => x.EnvironmentId,
                    principalTable: "ApplicationEnvironments",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_Rpcs_ConsumerApplications_ApplicationId",
                    column: x => x.ApplicationId,
                    principalTable: "ConsumerApplications",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_Rpcs_RpcProviders_ProviderId",
                    column: x => x.ProviderId,
                    principalTable: "RpcProviders",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_ApplicationEnvironments_ApplicationId_Name",
            table: "ApplicationEnvironments",
            columns: new[] { "ApplicationId", "Name" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_ConsumerApiKeys_ApplicationId_EnvironmentId",
            table: "ConsumerApiKeys",
            columns: new[] { "ApplicationId", "EnvironmentId" });

        migrationBuilder.CreateIndex(
            name: "IX_ConsumerApiKeys_EnvironmentId",
            table: "ConsumerApiKeys",
            column: "EnvironmentId");

        migrationBuilder.CreateIndex(
            name: "IX_ConsumerApplications_Name",
            table: "ConsumerApplications",
            column: "Name",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_RpcProviders_Name",
            table: "RpcProviders",
            column: "Name",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_Rpcs_ApplicationId_EnvironmentId",
            table: "Rpcs",
            columns: new[] { "ApplicationId", "EnvironmentId" });

        migrationBuilder.CreateIndex(
            name: "IX_Rpcs_EnvironmentId",
            table: "Rpcs",
            column: "EnvironmentId");

        migrationBuilder.CreateIndex(
            name: "IX_Rpcs_ProviderId",
            table: "Rpcs",
            column: "ProviderId");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "ConsumerApiKeys");

        migrationBuilder.DropTable(
            name: "Rpcs");

        migrationBuilder.DropTable(
            name: "ApplicationEnvironments");

        migrationBuilder.DropTable(
            name: "RpcProviders");

        migrationBuilder.DropTable(
            name: "ConsumerApplications");
    }
}
