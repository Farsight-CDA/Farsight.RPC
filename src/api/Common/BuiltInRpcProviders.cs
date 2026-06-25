namespace Farsight.Rpc.Api.Common;

internal static class BuiltInRpcProviders
{
    public static readonly Guid PublicRpcProviderId = Guid.Parse("00000000-0000-0000-0000-000000000001");
    public const string PUBLICRPCPROVIDERNAME = "Public RPC";
    public const int PUBLICRPCPROVIDERRATELIMIT = 5;
}
