using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Farsight.RPC.Providers.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "api_clients",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ApiKeyHash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    IsEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_api_clients", x => x.Id);
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
                name: "rpc_archive_endpoints",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IndexerStepSize = table.Column<decimal>(type: "numeric(20,0)", nullable: false),
                    DexIndexStepSize = table.Column<decimal>(type: "numeric(20,0)", nullable: true),
                    IndexBlockOffset = table.Column<decimal>(type: "numeric(20,0)", nullable: false),
                    Environment = table.Column<int>(type: "integer", nullable: false),
                    Application = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Chain = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Provider = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Address = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Priority = table.Column<int>(type: "integer", nullable: false),
                    IsEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_rpc_archive_endpoints", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "rpc_realtime_endpoints",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Environment = table.Column<int>(type: "integer", nullable: false),
                    Application = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Chain = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Provider = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Address = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Priority = table.Column<int>(type: "integer", nullable: false),
                    IsEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_rpc_realtime_endpoints", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "rpc_tracing_endpoints",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TracingMode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Environment = table.Column<int>(type: "integer", nullable: false),
                    Application = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Chain = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Provider = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Address = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Priority = table.Column<int>(type: "integer", nullable: false),
                    IsEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_rpc_tracing_endpoints", x => x.Id);
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
                name: "IX_api_clients_ApiKeyHash",
                table: "api_clients",
                column: "ApiKeyHash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_api_clients_Name",
                table: "api_clients",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_roles_Name",
                table: "roles",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_rpc_archive_endpoints_Application_Chain",
                table: "rpc_archive_endpoints",
                columns: new[] { "Application", "Chain" });

            migrationBuilder.CreateIndex(
                name: "IX_rpc_archive_endpoints_Chain_Provider",
                table: "rpc_archive_endpoints",
                columns: new[] { "Chain", "Provider" });

            migrationBuilder.CreateIndex(
                name: "IX_rpc_archive_endpoints_Environment_Application_Chain_IsEnabl~",
                table: "rpc_archive_endpoints",
                columns: new[] { "Environment", "Application", "Chain", "IsEnabled", "Priority" });

            migrationBuilder.CreateIndex(
                name: "IX_rpc_archive_endpoints_Environment_Application_Chain_Provide~",
                table: "rpc_archive_endpoints",
                columns: new[] { "Environment", "Application", "Chain", "Provider", "Address" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_rpc_realtime_endpoints_Application_Chain",
                table: "rpc_realtime_endpoints",
                columns: new[] { "Application", "Chain" });

            migrationBuilder.CreateIndex(
                name: "IX_rpc_realtime_endpoints_Chain_Provider",
                table: "rpc_realtime_endpoints",
                columns: new[] { "Chain", "Provider" });

            migrationBuilder.CreateIndex(
                name: "IX_rpc_realtime_endpoints_Environment_Application_Chain_IsEnab~",
                table: "rpc_realtime_endpoints",
                columns: new[] { "Environment", "Application", "Chain", "IsEnabled", "Priority" });

            migrationBuilder.CreateIndex(
                name: "IX_rpc_realtime_endpoints_Environment_Application_Chain_Provid~",
                table: "rpc_realtime_endpoints",
                columns: new[] { "Environment", "Application", "Chain", "Provider", "Address" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_rpc_tracing_endpoints_Application_Chain",
                table: "rpc_tracing_endpoints",
                columns: new[] { "Application", "Chain" });

            migrationBuilder.CreateIndex(
                name: "IX_rpc_tracing_endpoints_Chain_Provider",
                table: "rpc_tracing_endpoints",
                columns: new[] { "Chain", "Provider" });

            migrationBuilder.CreateIndex(
                name: "IX_rpc_tracing_endpoints_Environment_Application_Chain_IsEnabl~",
                table: "rpc_tracing_endpoints",
                columns: new[] { "Environment", "Application", "Chain", "IsEnabled", "Priority" });

            migrationBuilder.CreateIndex(
                name: "IX_rpc_tracing_endpoints_Environment_Application_Chain_Provide~",
                table: "rpc_tracing_endpoints",
                columns: new[] { "Environment", "Application", "Chain", "Provider", "Address" },
                unique: true);

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
                name: "rpc_archive_endpoints");

            migrationBuilder.DropTable(
                name: "rpc_realtime_endpoints");

            migrationBuilder.DropTable(
                name: "rpc_tracing_endpoints");

            migrationBuilder.DropTable(
                name: "user_roles");

            migrationBuilder.DropTable(
                name: "roles");

            migrationBuilder.DropTable(
                name: "users");
        }
    }
}
