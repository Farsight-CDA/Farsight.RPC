using Farsight.Common;
using FluentValidation;

namespace Farsight.Rpc.Api.Configuration;

[ConfigOption<Validator>(SectionName = SECTION_NAME)]
public sealed class SecurityKeyConfiguration
{
    public const string SECTION_NAME = "SecurityKeys";

    public required string ServerDomain { get; init; }
    public string ServerName { get; init; } = "Farsight RPC";
    public required HashSet<string> Origins { get; init; }
    public int ChallengeExpiryMinutes { get; init; } = 1;

    public sealed class Validator : AbstractValidator<SecurityKeyConfiguration>
    {
        public Validator()
        {
            RuleFor(x => x.ServerDomain)
                .NotEmpty()
                .Must(IsValidServerDomain)
                .WithMessage("SecurityKeys:ServerDomain must be a host name without a scheme, path, or port.");

            RuleFor(x => x.Origins)
                .NotEmpty();

            RuleForEach(x => x.Origins)
                .Must(IsValidOrigin)
                .WithMessage("SecurityKeys origins must be HTTPS origins, except for HTTP localhost development origins.");

            RuleFor(x => x)
                .Must(OriginsMatchServerDomain)
                .WithMessage("Every SecurityKeys origin must use ServerDomain or one of its subdomains.");

            RuleFor(x => x.ServerName).NotEmpty();
            RuleFor(x => x.ChallengeExpiryMinutes).Equal(1);
        }

        private static bool IsValidOrigin(string origin)
        {
            if(!Uri.TryCreate(origin, UriKind.Absolute, out var uri)
                || uri.PathAndQuery != "/"
                || !String.IsNullOrEmpty(uri.Fragment)
                || !String.IsNullOrEmpty(uri.UserInfo))
            {
                return false;
            }
            //
            return uri.Scheme == Uri.UriSchemeHttps
                || (uri.Scheme == Uri.UriSchemeHttp && uri.Host == "localhost");
        }

        private static bool IsValidServerDomain(string? domain)
            => !String.IsNullOrWhiteSpace(domain)
                && !domain.Contains("://", StringComparison.Ordinal)
                && !domain.Contains('/')
                && !domain.Contains(':')
                && Uri.CheckHostName(domain) != UriHostNameType.Unknown;

        private static bool OriginsMatchServerDomain(SecurityKeyConfiguration configuration)
        {
            if(String.IsNullOrWhiteSpace(configuration.ServerDomain) || configuration.Origins is null)
            {
                return false;
            }

            string domain = configuration.ServerDomain.TrimEnd('.');
            return configuration.Origins.All(origin =>
            {
                if(!Uri.TryCreate(origin, UriKind.Absolute, out var uri))
                {
                    return false;
                }

                string host = uri.Host.TrimEnd('.');
                return host.Equals(domain, StringComparison.OrdinalIgnoreCase)
                    || host.EndsWith($".{domain}", StringComparison.OrdinalIgnoreCase);
            });
        }
    }
}
