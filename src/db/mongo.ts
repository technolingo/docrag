// import { type Db, MongoClient } from "mongodb";

// export async function connectMongo(uri: string, dbName: string): Promise<{ client: MongoClient; db: Db }> {
//     const client = new MongoClient(uri);
//     await client.connect(); // fail fast at startup, not on first query
//     return { client, db: client.db(dbName) };
// }

// export async function closeMongo()
