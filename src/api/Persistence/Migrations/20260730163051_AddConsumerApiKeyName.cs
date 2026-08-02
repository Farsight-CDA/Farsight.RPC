using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Farsight.Rpc.Api.Persistence.Migrations;

/// <inheritdoc />
public partial class AddConsumerApiKeyName : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "Name",
            table: "ConsumerApiKeys",
            type: "text",
            nullable: true);

        migrationBuilder.Sql(
            """
            UPDATE "ConsumerApiKeys"
            SET "Name" = 'API Key ' || LEFT("Id"::text, 8);
            """);

        migrationBuilder.AlterColumn<string>(
            name: "Name",
            table: "ConsumerApiKeys",
            type: "text",
            nullable: false,
            oldClrType: typeof(string),
            oldType: "text",
            oldNullable: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "Name",
            table: "ConsumerApiKeys");
    }
}
