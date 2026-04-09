using Farsight.Rpc.Api.Persistence.Entities.Rpc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Farsight.Rpc.Api.Persistence.Configurations.Rpc;

internal sealed class TracingRpcEFConfiguration : IEntityTypeConfiguration<TracingRpc>
{
    public void Configure(EntityTypeBuilder<TracingRpc> entity)
    => entity.Property(x => x.TracingMode);
}
