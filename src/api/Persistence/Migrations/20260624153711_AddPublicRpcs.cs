using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Farsight.Rpc.Api.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPublicRpcs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "EnablePublicRpcs",
                table: "ApplicationEnvironments",
                type: "boolean",
                nullable: false,
                defaultValue: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EnablePublicRpcs",
                table: "ApplicationEnvironments");
        }
    }
}
