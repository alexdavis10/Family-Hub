# Family Hub

A minimal family dashboard built for Azure Static Web Apps + Azure Functions + Azure Table Storage.

## Prerequisites

- Azure subscription
- GitHub account
- Node.js 20+

## Azure setup

1. **Create a Storage Account**
   - In the Azure Portal, create a Storage Account (Standard/LRS).
   - Copy its connection string.
2. **Create an Azure Static Web App**
   - Deployment source: GitHub.
   - App location: `frontend`
   - API location: `api`
   - Output location: *(leave blank)*
3. **Configure application settings**
   - In the Static Web App, open **Configuration**.
   - Add `AZURE_STORAGE_CONNECTION_STRING` with the storage connection string value.

## Run locally

```bash
npm i -g @azure/static-web-apps-cli
cd api && npm install
swa start ./frontend --api-location ./api
```

## Troubleshooting

- **Missing `AZURE_STORAGE_CONNECTION_STRING`**: Ensure the app setting is defined in the Static Web App configuration and in your local environment.
- **Table permissions**: Make sure the connection string has permissions to create tables and read/write entities.
