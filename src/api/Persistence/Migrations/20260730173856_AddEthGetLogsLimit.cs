using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Farsight.Rpc.Api.Persistence.Migrations;

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
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "EthGetLogsLimit",
            table: "Rpcs");
    }
}
