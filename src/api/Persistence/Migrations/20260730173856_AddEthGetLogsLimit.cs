using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Farsight.Rpc.Api.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddEthGetLogsLimit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "EthGetLogsLimit",
                table: "Rpcs",
                type: "numeric(20,0)",
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE "Rpcs"
                SET "EthGetLogsLimit" = 1;
                """);

            migrationBuilder.AlterColumn<decimal>(
                name: "EthGetLogsLimit",
                table: "Rpcs",
                type: "numeric(20,0)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(20,0)",
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EthGetLogsLimit",
                table: "Rpcs");
        }
    }
}
