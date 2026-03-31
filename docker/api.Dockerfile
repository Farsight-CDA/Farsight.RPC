FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

RUN apt update && apt upgrade -y

WORKDIR /source
COPY . .
RUN dotnet publish "Farsight.RPC.Providers/Farsight.RPC.Providers.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime

RUN apt update && apt install -y libgssapi-krb5-2 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=build /app/publish ./

ENV ASPNETCORE_HTTP_PORTS=8080

ENTRYPOINT ["dotnet", "Farsight.RPC.Providers.dll"]
