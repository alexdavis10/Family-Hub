const { TableClient, TableServiceClient } = require("@azure/data-tables");

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
    const id = context.bindingData.id;

    if (!id) {
      context.res = {
        status: 400,
        body: { message: "Chore id is required." },
      };
      return;
    }

    const entity = await tableClient.getEntity("family", id);
    if (entity.isDone) {
      context.res = {
        status: 200,
        body: {
          id: entity.rowKey,
          title: entity.title,
          assignee: entity.assignee,
          isDone: true,
          createdAt: entity.createdAt,
          completedAt: entity.completedAt || null,
        },
      };
      return;
    }

    const updated = {
      ...entity,
      isDone: true,
      completedAt: new Date().toISOString(),
    };

    await tableClient.updateEntity(updated, "Merge");

    context.res = {
      status: 200,
      body: {
        id: updated.rowKey,
        title: updated.title,
        assignee: updated.assignee,
        isDone: updated.isDone,
        createdAt: updated.createdAt,
        completedAt: updated.completedAt,
      },
    };
  } catch (error) {
    context.log.error(error);
    if (error.statusCode === 404) {
      context.res = {
        status: 404,
        body: { message: "Chore not found." },
      };
      return;
    }

    context.res = {
      status: 500,
      body: { message: error.message || "Server error" },
    };
  }
};
