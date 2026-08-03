using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Farsight.Rpc.Api.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddWalletAddressFormats : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DELETE FROM "Wallets";
                """);

            migrationBuilder.AddColumn<string>(
                name: "AddressFormat",
                table: "WalletPrivateKeys",
                type: "text",
                nullable: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AddressFormat",
                table: "WalletPrivateKeys");
        }
    }
}
