using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Farsight.Rpc.Api.Persistence.Migrations;

/// <inheritdoc />
[Migration("20260424120000_RenameRpcStructures")]
public partial class RenameRpcStructures : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
        => migrationBuilder.Sql("""
            UPDATE "ConsumerApplications"
            SET "Structures" = array_replace(array_replace("Structures", 'Basic', 'RealtimeOnly'), 'RoleSplit', 'RealtimeArchiveTracing')
            WHERE 'Basic' = ANY("Structures") OR 'RoleSplit' = ANY("Structures");
            """);

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
        => migrationBuilder.Sql("""
            UPDATE "ConsumerApplications"
            SET "Structures" = array_replace(array_replace("Structures", 'RealtimeOnly', 'Basic'), 'RealtimeArchiveTracing', 'RoleSplit')
            WHERE 'RealtimeOnly' = ANY("Structures") OR 'RealtimeArchiveTracing' = ANY("Structures");
            """);
}
