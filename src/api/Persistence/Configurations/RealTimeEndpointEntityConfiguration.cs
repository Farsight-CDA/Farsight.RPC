using Farsight.Rpc.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Farsight.Rpc.Api.Persistence.Configurations;

internal sealed class RealTimeEndpointEntityConfiguration : IEntityTypeConfiguration<RealTimeEndpointEntity>
{
    public void Configure(EntityTypeBuilder<RealTimeEndpointEntity> entity)
    {
        entity.HasKey(x => x.Id);

        entity.Property(x => x.Id)
            .IsRequired()
            .ValueGeneratedNever();

        entity.Property(x => x.Environment)
            .IsRequired();

        entity.Property(x => x.ApplicationId)
            .IsRequired();

        entity.Property(x => x.ChainId)
            .IsRequired();

        entity.Property(x => x.ProviderId)
            .IsRequired();

        entity.Property(x => x.Address)
            .IsRequired()
            .HasConversion(x => x.ToString(), x => new Uri(x))
            .HasMaxLength(2000);

        entity.Property(x => x.UpdatedUtc)
            .IsRequired();

        entity.HasOne(x => x.Application)
            .WithMany()
            .HasForeignKey(x => x.ApplicationId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired();

        entity.HasOne(x => x.Chain)
            .WithMany()
            .HasForeignKey(x => x.ChainId)
            .OnDelete(DeleteBehavior.Cascade)
            .IsRequired();

        entity.HasOne(x => x.Provider)
            .WithMany()
            .HasForeignKey(x => x.ProviderId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired();

        entity.HasIndex(x => new { x.ApplicationId, x.Environment, x.ChainId });

        entity.ToTable("rpc_realtime_endpoints", tableBuilder =>
        {
            tableBuilder.HasCheckConstraint("CK_rpc_realtime_endpoints_Address_Scheme", "\"Address\" ~* '^(http|https|ws|wss)://'");
        });
    }
}
