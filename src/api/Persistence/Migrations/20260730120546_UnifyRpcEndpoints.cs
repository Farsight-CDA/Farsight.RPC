using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Farsight.Rpc.Api.Persistence.Migrations;

/// <inheritdoc />
public partial class UnifyRpcEndpoints : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<int[]>(
            name: "Capabilities",
            table: "Rpcs",
            type: "integer[]",
            nullable: false,
            defaultValue: new int[0]);

        migrationBuilder.AddColumn<int>(
            name: "Order",
            table: "Rpcs",
            type: "integer",
            nullable: true);

        migrationBuilder.Sql("""
            WITH ranked AS
            (
                SELECT
                    "Id",
                    ROW_NUMBER() OVER
                    (
                        PARTITION BY "ApplicationId", "EnvironmentId", "Chain", "Address"
                        ORDER BY "RpcType", "Id"
                    ) AS duplicate_rank
                FROM "Rpcs"
            )
            DELETE FROM "Rpcs" AS rpc
            USING ranked
            WHERE rpc."Id" = ranked."Id"
              AND ranked.duplicate_rank > 1;
            """);

        migrationBuilder.Sql("""
            WITH ordered AS
            (
                SELECT
                    "Id",
                    (ROW_NUMBER() OVER
                    (
                        PARTITION BY "ApplicationId", "EnvironmentId", "Chain"
                        ORDER BY "RpcType", "Id"
                    ) - 1)::integer AS new_order
                FROM "Rpcs"
            )
            UPDATE "Rpcs" AS rpc
            SET "Order" = ordered.new_order
            FROM ordered
            WHERE rpc."Id" = ordered."Id";
            """);

        migrationBuilder.AlterColumn<int>(
            name: "Order",
            table: "Rpcs",
            type: "integer",
            nullable: false,
            oldClrType: typeof(int),
            oldType: "integer",
            oldNullable: true);

        migrationBuilder.DropColumn(
            name: "IndexerBlockOffset",
            table: "Rpcs");

        migrationBuilder.DropColumn(
            name: "IndexerStepSize",
            table: "Rpcs");

        migrationBuilder.DropColumn(
            name: "RpcType",
            table: "Rpcs");

        migrationBuilder.DropColumn(
            name: "TracingMode",
            table: "Rpcs");

        migrationBuilder.DropColumn(
            name: "Structure",
            table: "ConsumerApplications");

        migrationBuilder.CreateIndex(
            name: "IX_Rpcs_ApplicationId_EnvironmentId_Chain_Address",
            table: "Rpcs",
            columns: ["ApplicationId", "EnvironmentId", "Chain", "Address"],
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_Rpcs_ApplicationId_EnvironmentId_Chain_Order",
            table: "Rpcs",
            columns: ["ApplicationId", "EnvironmentId", "Chain", "Order"],
            unique: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_Rpcs_ApplicationId_EnvironmentId_Chain_Address",
            table: "Rpcs");

        migrationBuilder.DropIndex(
            name: "IX_Rpcs_ApplicationId_EnvironmentId_Chain_Order",
            table: "Rpcs");

        migrationBuilder.DropColumn(
            name: "Capabilities",
            table: "Rpcs");

        migrationBuilder.DropColumn(
            name: "Order",
            table: "Rpcs");

        migrationBuilder.AddColumn<decimal>(
            name: "IndexerBlockOffset",
            table: "Rpcs",
            type: "numeric(20,0)",
            nullable: true);

        migrationBuilder.AddColumn<decimal>(
            name: "IndexerStepSize",
            table: "Rpcs",
            type: "numeric(20,0)",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "RpcType",
            table: "Rpcs",
            type: "character varying(13)",
            maxLength: 13,
            nullable: false,
            defaultValue: "Realtime");

        migrationBuilder.AddColumn<int>(
            name: "TracingMode",
            table: "Rpcs",
            type: "integer",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "Structure",
            table: "ConsumerApplications",
            type: "jsonb",
            nullable: false,
            defaultValue: "{\"realtime\":{\"mode\":\"Fixed\",\"count\":0},\"archive\":{\"mode\":\"Fixed\",\"count\":0},\"tracing\":{\"mode\":\"Fixed\",\"count\":0}}");
    }
}
