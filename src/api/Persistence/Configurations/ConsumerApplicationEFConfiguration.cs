using Farsight.Rpc.Api.Persistence.Entities;
using Farsight.Rpc.Types;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Farsight.Rpc.Api.Persistence.Configurations;

internal sealed class ConsumerApplicationEFConfiguration : IEntityTypeConfiguration<ConsumerApplication>
{
    private static readonly JsonSerializerOptions _jsonOptions = new JsonSerializerOptions(JsonSerializerDefaults.Web)
    {
        Converters =
        {
            new JsonStringEnumConverter<RpcRequirementMode>()
        }
    };

    private static readonly ValueComparer<RpcStructureDefinition> _structureComparer = new(
        (left, right) => JsonSerializer.Serialize(left, _jsonOptions) == JsonSerializer.Serialize(right, _jsonOptions),
        value => JsonSerializer.Serialize(value, _jsonOptions).GetHashCode(),
        value => JsonSerializer.Deserialize<RpcStructureDefinition>(JsonSerializer.Serialize(value, _jsonOptions), _jsonOptions)!);

    public void Configure(EntityTypeBuilder<ConsumerApplication> entity)
    {
        entity.HasKey(x => x.Id);
        entity.HasIndex(x => x.Name).IsUnique();

        entity.Property(x => x.Id);

        entity.Property(x => x.Name)
            .UseCollation(AppDbContext.NAME_CASE_INSENSITIVE_COLLATION);

        entity.Property(x => x.Structure)
            .HasConversion(
                value => JsonSerializer.Serialize(value, _jsonOptions),
                value => JsonSerializer.Deserialize<RpcStructureDefinition>(value, _jsonOptions) ?? RpcStructureDefinition.Default,
                _structureComparer)
            .HasColumnType("jsonb");

        entity.HasMany(x => x.ApiKeys)
            .WithOne(x => x.Application)
            .HasForeignKey(x => x.ApplicationId);

        entity.HasMany(x => x.Environments)
            .WithOne(x => x.Application)
            .HasForeignKey(x => x.ApplicationId);

        entity.HasMany(x => x.Rpcs)
            .WithOne(x => x.Application)
            .HasForeignKey(x => x.ApplicationId);

        entity.ToTable("ConsumerApplications");
    }
}
