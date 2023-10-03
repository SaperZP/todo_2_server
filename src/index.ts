import { readFileSync } from "node:fs";
import { Resolvers, User } from "../resolvers-types";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { Db, MongoClient, ObjectId, ServerApiVersion } from "mongodb";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { DbTodo, DbUser, MyContext } from "../types";

dotenv.config();

const typeDefs = readFileSync("./schema.graphql", "utf-8");

const { DB_NAME, DB_URI, JWT_SECRET } = process.env;

const getToken = (id: string) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: "12h",
  });
};

const getUserFromToken = async (token: string, db: Db) => {
  if (!token) {
    return null;
  }

  const TokenData = jwt.verify(token, JWT_SECRET);

  if (!TokenData["id"]) {
    return null;
  }

  return await db
    .collection<DbUser>("Users")
    .findOne({ _id: new ObjectId(TokenData["id"]) });
};

const resolvers: Resolvers = {
  Query: {
    myTodos: async (_, __, { db, user }) => {
      if (!user) {
        throw new Error("Authentication error. Please sign in!");
      }

      const resp = await db
        .collection<DbTodo>("Todos")
        .find({ ownerId: user._id })
        .toArray();

      const owner = Object.fromEntries(
        Object.entries(user).map(([key, value]) => [
          key.replace(/^_/, ""),
          value instanceof ObjectId ? value.toString() : value,
        ])
      ) as User;

      return resp.map(({ _id, ownerId, ...rest }) => ({
        ...rest,
        id: _id.toString(),
        ownerId: ownerId.toString(),
        owner,
      }));
    },
    getTodo: async (_, { id }, { db, user }) => {
      if (!user) {
        throw new Error("Authentication error. Please sign in!");
      }

      const todo = await db
        .collection<DbTodo>("Todos")
        .findOne({ _id: new ObjectId(id) });
      const owner = await db
        .collection<DbUser>("Users")
        .findOne({ _id: todo.ownerId });

      return {
        id: todo._id.toString(),
        title: todo.title,
        description: todo.description,
        dueDate: todo.dueDate,
        priority: todo.priority,
        categoryId: todo.categoryId,
        isDone: todo.isDone,
        ownerId: todo.ownerId.toString(),
        owner: {
          id: owner._id.toString(),
          name: owner.name,
          email: owner.email,
          avatar: owner.avatar,
        },
      };
    },
  },

  Mutation: {
    signUp: async (_, { input }, { db }) => {
      const emailExists = Boolean(
        await db.collection("Users").findOne({ email: input.email })
      );

      if (emailExists) {
        throw new Error("The email is used!");
      }

      const hashedPassword = bcrypt.hashSync(input.password);
      const newUser = {
        ...input,
        password: hashedPassword,
      };
      const resp = await db.collection("Users").insertOne(newUser);

      const user = {
        id: resp.insertedId.toString(),
        name: newUser.name,
        email: newUser.email,
        avatar: newUser.avatar,
      };

      const token = getToken(user.id);

      return { user, token };
    },
    signIn: async (_, { input }, { db }) => {
      const dbUser = await db
        .collection("Users")
        .findOne({ email: input.email });
      const isPasswordCorrect = bcrypt.compareSync(
        input.password,
        dbUser.password
      );

      if (!dbUser || !isPasswordCorrect) {
        throw new Error("Invalid credentials!");
      }

      const user = {
        id: dbUser._id.toString(),
        name: dbUser.name,
        email: dbUser.email,
        avatar: dbUser.avatar,
      };

      const token = getToken(user.id);

      return { user, token };
    },

    createToDo: async (_, { input }, { db, user }) => {
      if (!user) {
        throw new Error("Authentication error. Please sign in!");
      }

      const resp = await db
        .collection("Todos")
        .insertOne({ ...input, ownerId: user._id });

      return {
        id: resp.insertedId.toString(),
        ...input,
        ownerId: user._id.toString(),
        owner: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          avatar: user.avatar,
        },
      };
    },
    updateToDo: async (_, { input, id }, { db, user }) => {
      if (!user) {
        throw new Error("Authentication error. Please sign in!");
      }

      const result = await db
        .collection<DbTodo>("Todos")
        .findOneAndUpdate(
          { _id: new ObjectId(id) },
          { $set: input },
          { returnDocument: "after" }
        );

      return {
        id: result._id.toString(),
        title: result.title,
        description: result.description,
        dueDate: result.dueDate,
        priority: result.priority,
        categoryId: result.categoryId,
        isDone: result.isDone,
        ownerId: result.ownerId.toString(),
        owner: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          avatar: user.avatar,
        },
      };
    },
    deleteToDo: async (_, { id }, { db, user }) => {
      if (!user) {
        throw new Error("Authentication error. Please sign in!");
      }

      const result = await db
        .collection("Todos")
        .deleteOne({ _id: new ObjectId(id) });

      return result.acknowledged;
    },
  },
};

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

  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
    context: async ({ req }) => {
      const user = await getUserFromToken(req.headers.authorization, db);

      return { db, user };
    },
  });

  return url;
};

start().then((url) => console.log(`🚀  Server is ready at: ${url}`));
