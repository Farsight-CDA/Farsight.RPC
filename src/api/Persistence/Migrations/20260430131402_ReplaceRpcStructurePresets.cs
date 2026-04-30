using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Farsight.Rpc.Api.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ReplaceRpcStructurePresets : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Structure",
                table: "ConsumerApplications",
                type: "jsonb",
                nullable: false,
                defaultValue: """
                    {"realtime":{"mode":"AtLeast","count":0},"archive":{"mode":"AtLeast","count":0},"tracing":{"mode":"AtLeast","count":0}}
                    """);

            migrationBuilder.Sql("""
                UPDATE "ConsumerApplications"
                SET "Structure" = CASE
                    WHEN "Structures" = ARRAY['RealtimeOnly']::text[] THEN '{"realtime":{"mode":"Fixed","count":1},"archive":{"mode":"Fixed","count":0},"tracing":{"mode":"Fixed","count":0}}'::jsonb
                    WHEN "Structures" = ARRAY['RealtimeArchive']::text[] THEN '{"realtime":{"mode":"Fixed","count":1},"archive":{"mode":"Fixed","count":1},"tracing":{"mode":"Fixed","count":0}}'::jsonb
                    WHEN "Structures" = ARRAY['RealtimeArchiveTracing']::text[] THEN '{"realtime":{"mode":"Fixed","count":1},"archive":{"mode":"Fixed","count":1},"tracing":{"mode":"Fixed","count":1}}'::jsonb
                    ELSE "Structure"::jsonb
                END;
                """);

            migrationBuilder.DropColumn(
                name: "Structures",
                table: "ConsumerApplications");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Structure",
                table: "ConsumerApplications");

            migrationBuilder.AddColumn<string[]>(
                name: "Structures",
                table: "ConsumerApplications",
                type: "text[]",
                nullable: false,
                defaultValue: new string[0]);
        }
    }
}
