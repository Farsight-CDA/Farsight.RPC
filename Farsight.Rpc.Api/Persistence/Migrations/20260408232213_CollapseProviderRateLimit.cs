using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Farsight.Rpc.Api.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class CollapseProviderRateLimit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "RateLimit",
                table: "providers",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.Sql("""
                UPDATE providers AS p
                SET \"RateLimit\" = prl.\"RateLimit\"
                FROM provider_rate_limits AS prl
                WHERE p.\"Id\" = prl.\"ProviderId\";
                """);

            migrationBuilder.DropTable(
                name: "provider_rate_limits");

            migrationBuilder.AlterColumn<int>(
                name: "RateLimit",
                table: "providers",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldDefaultValue: 1);

            migrationBuilder.AddCheckConstraint(
                name: "CK_providers_RateLimit_Positive",
                table: "providers",
                sql: "\"RateLimit\" > 0");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
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

            migrationBuilder.Sql("""
                INSERT INTO provider_rate_limits (\"ProviderId\", \"RateLimit\")
                SELECT \"Id\", \"RateLimit\"
                FROM providers;
                """);

            migrationBuilder.DropCheckConstraint(
                name: "CK_providers_RateLimit_Positive",
                table: "providers");

            migrationBuilder.DropColumn(
                name: "RateLimit",
                table: "providers");
        }
    }
}
