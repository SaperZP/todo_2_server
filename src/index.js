import {readFileSync} from "node:fs";
import {ApolloServer} from "@apollo/server";
import {startStandaloneServer} from "@apollo/server/standalone";
import {MongoClient, ServerApiVersion} from "mongodb";
import {DB_NAME, DB_URI, JWT_SECRET, PORT} from "./environment.js";
import {getUserFromToken} from "./utils.js";
import resolvers from "./resolvers/index.js";

const typeDefs = readFileSync("./schema.graphql", "utf-8");
const start = async () => {
  try {
    const mongoClient = new MongoClient(DB_URI, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });
    await mongoClient.connect();
    const db = mongoClient.db(DB_NAME);
    const server = new ApolloServer({
      typeDefs,
      resolvers,
    });
    const {url} = await startStandaloneServer(server, {
      listen: {port: +PORT || 4000},
      context: async ({req}) => {
        const user = await getUserFromToken(req.headers.authorization, db, JWT_SECRET);
        return {db, user};
      },
    });
    console.log(`🚀  Server is ready at: ${url}`);
  } catch (error) {
    console.error("Error during server startup:", error);
    process.exit(1); // Exit with a non-zero code to indicate failure
  }
};
start();
