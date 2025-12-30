const { TableClient, TableServiceClient } = require("@azure/data-tables");
const { v4: uuidv4 } = require("uuid");

const tableName = "Chores";

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
      const chores = [];
      const entities = tableClient.listEntities({
        queryOptions: { filter: "PartitionKey eq 'family'" },
      });

      for await (const entity of entities) {
        chores.push({
          id: entity.rowKey,
          title: entity.title,
          assignee: entity.assignee,
          isDone: entity.isDone,
          createdAt: entity.createdAt,
          completedAt: entity.completedAt || null,
        });
      }

      chores.sort((a, b) => {
        if (a.isDone === b.isDone) {
          return a.createdAt < b.createdAt ? 1 : -1;
        }
        return a.isDone ? 1 : -1;
      });

      context.res = {
        status: 200,
        body: chores,
      };
      return;
    }

    if (req.method === "POST") {
      const title = req.body?.title?.trim();
      const assignee = req.body?.assignee?.trim();

      if (!title || !assignee) {
        context.res = {
          status: 400,
          body: { message: "Title and assignee are required." },
        };
        return;
      }

      const item = {
        partitionKey: "family",
        rowKey: uuidv4(),
        title,
        assignee,
        isDone: false,
        createdAt: new Date().toISOString(),
      };

      await tableClient.createEntity(item);

      context.res = {
        status: 201,
        body: {
          id: item.rowKey,
          title: item.title,
          assignee: item.assignee,
          isDone: item.isDone,
          createdAt: item.createdAt,
          completedAt: null,
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
