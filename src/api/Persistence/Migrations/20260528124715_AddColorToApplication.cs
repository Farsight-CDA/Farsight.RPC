using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Farsight.Rpc.Api.Persistence.Migrations;

/// <inheritdoc />
public partial class AddColorToApplication : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
        => migrationBuilder.AddColumn<string>(
            name: "Color",
            table: "ConsumerApplications",
            type: "character varying(7)",
            maxLength: 7,
            nullable: false,
            defaultValue: "#6B7280"
        );

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
        => migrationBuilder.DropColumn(
            name: "Color",
            table: "ConsumerApplications"
        );
}
