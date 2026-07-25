using Microsoft.EntityFrameworkCore.Migrations;
using System;

#nullable disable

namespace Farsight.Rpc.Api.Persistence.Migrations;

/// <inheritdoc />
public partial class AddUserSecurityKeys : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "SecurityKeyChallenges",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                Username = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                ChallengeType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                KeyName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                AssertionOptions = table.Column<string>(type: "jsonb", nullable: true),
                CredentialCreateOptions = table.Column<string>(type: "jsonb", nullable: true),
                ExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_SecurityKeyChallenges", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "UserSecurityKeys",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                Username = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                CredentialId = table.Column<byte[]>(type: "bytea", nullable: false),
                PublicKey = table.Column<byte[]>(type: "bytea", nullable: false),
                UserHandle = table.Column<byte[]>(type: "bytea", nullable: false),
                SignatureCounter = table.Column<long>(type: "bigint", nullable: false),
                AaGuid = table.Column<Guid>(type: "uuid", nullable: false),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                LastUsedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_UserSecurityKeys", x => x.Id);
            });

        migrationBuilder.CreateIndex(
            name: "IX_SecurityKeyChallenges_ExpiresAt",
            table: "SecurityKeyChallenges",
            column: "ExpiresAt");

        migrationBuilder.CreateIndex(
            name: "IX_UserSecurityKeys_CredentialId",
            table: "UserSecurityKeys",
            column: "CredentialId",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_UserSecurityKeys_Username",
            table: "UserSecurityKeys",
            column: "Username");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "SecurityKeyChallenges");

        migrationBuilder.DropTable(
            name: "UserSecurityKeys");
    }
}
