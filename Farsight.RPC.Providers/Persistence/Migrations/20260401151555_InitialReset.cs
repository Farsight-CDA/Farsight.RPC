using Microsoft.EntityFrameworkCore.Migrations;
using System;

#nullable disable

namespace Farsight.RPC.Providers.Persistence.Migrations;

/// <inheritdoc />
public partial class InitialReset : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AlterDatabase()
            .Annotation("Npgsql:PostgresExtension:citext", ",,");

        migrationBuilder.CreateTable(
            name: "applications",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                Name = table.Column<string>(type: "citext", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_applications", x => x.Id);
                table.CheckConstraint("CK_applications_Name_NotEmpty", "btrim(\"Name\") <> ''");
            });

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

        migrationBuilder.CreateTable(
            name: "providers",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                Name = table.Column<string>(type: "citext", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_providers", x => x.Id);
                table.CheckConstraint("CK_providers_Name_NotEmpty", "btrim(\"Name\") <> ''");
            });

        migrationBuilder.CreateTable(
            name: "roles",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_roles", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "users",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                UserName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                PasswordHash = table.Column<string>(type: "text", nullable: false),
                IsEnabled = table.Column<bool>(type: "boolean", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_users", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "api_clients",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                ApiKey = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                ApplicationId = table.Column<Guid>(type: "uuid", nullable: true),
                Environment = table.Column<int>(type: "integer", nullable: true),
                IsEnabled = table.Column<bool>(type: "boolean", nullable: false),
                CreatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                UpdatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_api_clients", x => x.Id);
                table.ForeignKey(
                    name: "FK_api_clients_applications_ApplicationId",
                    column: x => x.ApplicationId,
                    principalTable: "applications",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "provider_rate_limits",
            columns: table => new
            {
                ProviderId = table.Column<Guid>(type: "uuid", nullable: false),
                RateLimit = table.Column<int>(type: "integer", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_provider_rate_limits", x => x.ProviderId);
                table.CheckConstraint("CK_provider_rate_limits_RateLimit_Positive", "\"RateLimit\" > 0");
                table.ForeignKey(
                    name: "FK_provider_rate_limits_providers_ProviderId",
                    column: x => x.ProviderId,
                    principalTable: "providers",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "rpc_archive_endpoints",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                IndexerStepSize = table.Column<decimal>(type: "numeric(20,0)", nullable: false),
                DexIndexStepSize = table.Column<decimal>(type: "numeric(20,0)", nullable: true),
                IndexBlockOffset = table.Column<decimal>(type: "numeric(20,0)", nullable: false),
                Environment = table.Column<int>(type: "integer", nullable: false),
                ApplicationId = table.Column<Guid>(type: "uuid", nullable: false),
                ChainId = table.Column<Guid>(type: "uuid", nullable: false),
                ProviderId = table.Column<Guid>(type: "uuid", nullable: false),
                Address = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                UpdatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                ProbedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_rpc_archive_endpoints", x => x.Id);
                table.CheckConstraint("CK_rpc_archive_endpoints_Address_Scheme", "\"Address\" ~* '^(http|https|ws|wss)://'");
                table.ForeignKey(
                    name: "FK_rpc_archive_endpoints_applications_ApplicationId",
                    column: x => x.ApplicationId,
                    principalTable: "applications",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_rpc_archive_endpoints_chains_ChainId",
                    column: x => x.ChainId,
                    principalTable: "chains",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_rpc_archive_endpoints_providers_ProviderId",
                    column: x => x.ProviderId,
                    principalTable: "providers",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "rpc_realtime_endpoints",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                Environment = table.Column<int>(type: "integer", nullable: false),
                ApplicationId = table.Column<Guid>(type: "uuid", nullable: false),
                ChainId = table.Column<Guid>(type: "uuid", nullable: false),
                ProviderId = table.Column<Guid>(type: "uuid", nullable: false),
                Address = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                UpdatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                ProbedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_rpc_realtime_endpoints", x => x.Id);
                table.CheckConstraint("CK_rpc_realtime_endpoints_Address_Scheme", "\"Address\" ~* '^(http|https|ws|wss)://'");
                table.ForeignKey(
                    name: "FK_rpc_realtime_endpoints_applications_ApplicationId",
                    column: x => x.ApplicationId,
                    principalTable: "applications",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_rpc_realtime_endpoints_chains_ChainId",
                    column: x => x.ChainId,
                    principalTable: "chains",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_rpc_realtime_endpoints_providers_ProviderId",
                    column: x => x.ProviderId,
                    principalTable: "providers",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "rpc_tracing_endpoints",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                TracingMode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                Environment = table.Column<int>(type: "integer", nullable: false),
                ApplicationId = table.Column<Guid>(type: "uuid", nullable: false),
                ChainId = table.Column<Guid>(type: "uuid", nullable: false),
                ProviderId = table.Column<Guid>(type: "uuid", nullable: false),
                Address = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                UpdatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                ProbedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_rpc_tracing_endpoints", x => x.Id);
                table.CheckConstraint("CK_rpc_tracing_endpoints_Address_Scheme", "\"Address\" ~* '^(http|https|ws|wss)://'");
                table.ForeignKey(
                    name: "FK_rpc_tracing_endpoints_applications_ApplicationId",
                    column: x => x.ApplicationId,
                    principalTable: "applications",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_rpc_tracing_endpoints_chains_ChainId",
                    column: x => x.ChainId,
                    principalTable: "chains",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_rpc_tracing_endpoints_providers_ProviderId",
                    column: x => x.ProviderId,
                    principalTable: "providers",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "user_roles",
            columns: table => new
            {
                UserId = table.Column<Guid>(type: "uuid", nullable: false),
                RoleId = table.Column<Guid>(type: "uuid", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_user_roles", x => new { x.UserId, x.RoleId });
                table.ForeignKey(
                    name: "FK_user_roles_roles_RoleId",
                    column: x => x.RoleId,
                    principalTable: "roles",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_user_roles_users_UserId",
                    column: x => x.UserId,
                    principalTable: "users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_api_clients_ApiKey",
            table: "api_clients",
            column: "ApiKey",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_api_clients_ApplicationId",
            table: "api_clients",
            column: "ApplicationId");

        migrationBuilder.CreateIndex(
            name: "IX_applications_Name",
            table: "applications",
            column: "Name",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_chains_Name",
            table: "chains",
            column: "Name",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_providers_Name",
            table: "providers",
            column: "Name",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_roles_Name",
            table: "roles",
            column: "Name",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_rpc_archive_endpoints_ApplicationId_Environment_ChainId",
            table: "rpc_archive_endpoints",
            columns: new[] { "ApplicationId", "Environment", "ChainId" });

        migrationBuilder.CreateIndex(
            name: "IX_rpc_archive_endpoints_ChainId",
            table: "rpc_archive_endpoints",
            column: "ChainId");

        migrationBuilder.CreateIndex(
            name: "IX_rpc_archive_endpoints_Environment_ApplicationId_ChainId_Pro~",
            table: "rpc_archive_endpoints",
            columns: new[] { "Environment", "ApplicationId", "ChainId", "ProviderId", "Address" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_rpc_archive_endpoints_ProviderId",
            table: "rpc_archive_endpoints",
            column: "ProviderId");

        migrationBuilder.CreateIndex(
            name: "IX_rpc_realtime_endpoints_ApplicationId_Environment_ChainId",
            table: "rpc_realtime_endpoints",
            columns: new[] { "ApplicationId", "Environment", "ChainId" });

        migrationBuilder.CreateIndex(
            name: "IX_rpc_realtime_endpoints_ChainId",
            table: "rpc_realtime_endpoints",
            column: "ChainId");

        migrationBuilder.CreateIndex(
            name: "IX_rpc_realtime_endpoints_Environment_ApplicationId_ChainId_Pr~",
            table: "rpc_realtime_endpoints",
            columns: new[] { "Environment", "ApplicationId", "ChainId", "ProviderId", "Address" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_rpc_realtime_endpoints_ProviderId",
            table: "rpc_realtime_endpoints",
            column: "ProviderId");

        migrationBuilder.CreateIndex(
            name: "IX_rpc_tracing_endpoints_ApplicationId_Environment_ChainId",
            table: "rpc_tracing_endpoints",
            columns: new[] { "ApplicationId", "Environment", "ChainId" });

        migrationBuilder.CreateIndex(
            name: "IX_rpc_tracing_endpoints_ChainId",
            table: "rpc_tracing_endpoints",
            column: "ChainId");

        migrationBuilder.CreateIndex(
            name: "IX_rpc_tracing_endpoints_Environment_ApplicationId_ChainId_Pro~",
            table: "rpc_tracing_endpoints",
            columns: new[] { "Environment", "ApplicationId", "ChainId", "ProviderId", "Address" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_rpc_tracing_endpoints_ProviderId",
            table: "rpc_tracing_endpoints",
            column: "ProviderId");

        migrationBuilder.CreateIndex(
            name: "IX_user_roles_RoleId",
            table: "user_roles",
            column: "RoleId");

        migrationBuilder.CreateIndex(
            name: "IX_users_UserName",
            table: "users",
            column: "UserName",
            unique: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "api_clients");

        migrationBuilder.DropTable(
            name: "provider_rate_limits");

        migrationBuilder.DropTable(
            name: "rpc_archive_endpoints");

        migrationBuilder.DropTable(
            name: "rpc_realtime_endpoints");

        migrationBuilder.DropTable(
            name: "rpc_tracing_endpoints");

        migrationBuilder.DropTable(
            name: "user_roles");

        migrationBuilder.DropTable(
            name: "applications");

        migrationBuilder.DropTable(
            name: "chains");

        migrationBuilder.DropTable(
            name: "providers");

        migrationBuilder.DropTable(
            name: "roles");

        migrationBuilder.DropTable(
            name: "users");
    }
}
