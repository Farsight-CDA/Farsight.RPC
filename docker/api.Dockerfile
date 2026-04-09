FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

RUN apt update && apt upgrade -y

WORKDIR /source
COPY . .
RUN dotnet publish "src/api/Farsight.Rpc.Api.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime

RUN apt update && apt install -y libgssapi-krb5-2 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=build /app/publish ./

ENTRYPOINT ["dotnet", "Farsight.Rpc.Api.dll"]
