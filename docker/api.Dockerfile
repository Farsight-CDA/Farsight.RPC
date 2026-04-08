FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

RUN apt update && apt upgrade -y

WORKDIR /source
COPY . .
RUN dotnet publish "Farsight.RPC.Api/Farsight.RPC.Api.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime

RUN apt update && apt install -y libgssapi-krb5-2 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=build /app/publish ./
RUN mkdir -p /var/lib/farsight-rpc-api/data-protection

ENV ASPNETCORE_HTTP_PORTS=8080
ENV DataProtection__KeysDirectory=/var/lib/farsight-rpc-api/data-protection
VOLUME ["/var/lib/farsight-rpc-api/data-protection"]

ENTRYPOINT ["dotnet", "Farsight.RPC.Api.dll"]
