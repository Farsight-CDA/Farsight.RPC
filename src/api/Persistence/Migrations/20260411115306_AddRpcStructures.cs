using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Farsight.Rpc.Api.Persistence.Migrations;

/// <inheritdoc />
public partial class AddRpcStructures : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
        => migrationBuilder.AddColumn<string[]>(
            name: "Structures",
            table: "ConsumerApplications",
            type: "text[]",
            nullable: false,
            defaultValue: Array.Empty<string>()
        );

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
        => migrationBuilder.DropColumn(
            name: "Structures",
            table: "ConsumerApplications"
        );
}
