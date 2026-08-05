using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Farsight.Rpc.Api.Persistence.Migrations;

/// <inheritdoc />
public partial class AddRpcRuleChains : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
        => migrationBuilder.AddColumn<string[]>(
            name: "Chains",
            table: "RpcRules",
            type: "text[]",
            nullable: false,
            defaultValue: Array.Empty<string>()
        );

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
        => migrationBuilder.DropColumn(
            name: "Chains",
            table: "RpcRules");
}
