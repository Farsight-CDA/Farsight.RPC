using Farsight.Rpc.Api.Persistence.Entities.Rpc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Farsight.Rpc.Api.Persistence.Configurations.Rpc;

internal sealed class TracingRpcEFConfiguration : IEntityTypeConfiguration<RpcEndpoint.Tracing>
{
    public void Configure(EntityTypeBuilder<RpcEndpoint.Tracing> entity)
    => entity.Property(x => x.TracingMode);
}
