const { TableClient, TableServiceClient } = require("@azure/data-tables");
const { v4: uuidv4 } = require("uuid");

const tableName = "Announcements";

async function getTableClient() {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error("AZURE_STORAGE_CONNECTION_STRING is not set");
  }

  const serviceClient = TableServiceClient.fromConnectionString(connectionString);
  await serviceClient.createTableIfNotExists(tableName);

  return TableClient.fromConnectionString(connectionString, tableName);
}

module.exports = async function (context, req) {
  try {
    const tableClient = await getTableClient();

    if (req.method === "GET") {
      const announcements = [];
      const entities = tableClient.listEntities({
        queryOptions: { filter: "PartitionKey eq 'family'" },
      });

      for await (const entity of entities) {
        announcements.push({
          id: entity.rowKey,
          text: entity.text,
          createdAt: entity.createdAt,
        });
      }

      announcements.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

      context.res = {
        status: 200,
        body: announcements,
      };
      return;
    }

    if (req.method === "POST") {
      const text = req.body?.text?.trim();
      if (!text) {
        context.res = {
          status: 400,
          body: { message: "Text is required." },
        };
        return;
      }

      const item = {
        partitionKey: "family",
        rowKey: uuidv4(),
        text,
        createdAt: new Date().toISOString(),
      };

      await tableClient.createEntity(item);

      context.res = {
        status: 201,
        body: {
          id: item.rowKey,
          text: item.text,
          createdAt: item.createdAt,
        },
      };
      return;
    }

    context.res = { status: 405 };
  } catch (error) {
    context.log.error(error);
    context.res = {
      status: 500,
      body: { message: error.message || "Server error" },
    };
  }
};
