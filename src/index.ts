import {readFileSync} from "node:fs";
import {ApolloServer} from "@apollo/server";
import {startStandaloneServer} from "@apollo/server/standalone";
import {MongoClient, ServerApiVersion} from "mongodb";
import dotenv from "dotenv";
import {MyContext} from "../types";
import {getUserFromToken} from "./utils";
import resolvers from "./resolvers/index";

dotenv.config();

const typeDefs = readFileSync("./schema.graphql", "utf-8");

const {DB_NAME, DB_URI, JWT_SECRET} = process.env;

const start = async () => {
  const mongoClient = new MongoClient(DB_URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });
  await mongoClient.connect();
  const db = mongoClient.db(DB_NAME);

  const server = new ApolloServer<MyContext>({
    typeDefs,
    resolvers,
  });

  const {url} = await startStandaloneServer(server, {
    listen: {port: 4000},
    context: async ({req}) => {
      console.log(req.headers.authorization, 'authorization');
      const user = await getUserFromToken(req.headers.authorization, db, JWT_SECRET);

      return {db, user};
    },
  });

  return url;
};

start().then((url) => console.log(`🚀  Server is ready at: ${url}`));
