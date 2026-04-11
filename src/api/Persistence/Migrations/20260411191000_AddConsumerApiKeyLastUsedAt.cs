using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Farsight.Rpc.Api.Persistence.Migrations;

/// <inheritdoc />
public partial class AddConsumerApiKeyLastUsedAt : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
        => migrationBuilder.AddColumn<DateTimeOffset>(
            name: "LastUsedAt",
            table: "ConsumerApiKeys",
            type: "timestamp with time zone",
            nullable: true
        );

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
        => migrationBuilder.DropColumn(
            name: "LastUsedAt",
            table: "ConsumerApiKeys"
        );
}
