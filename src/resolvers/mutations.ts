import {MutationResolvers} from "../../resolvers-types";
import bcrypt from "bcryptjs";
import {getToken} from "../utils";
import {DbTodo, DbUser} from "../../types";
import {ObjectId} from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const {JWT_SECRET} = process.env;

const mutations: MutationResolvers = {
  signUp: async (_, {input}, {db}) => {
    const emailExists = Boolean(
        await db.collection("Users").findOne({email: input.email})
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

    const token = getToken(user.id, JWT_SECRET);

    return {user, token};
  },
  signIn: async (_, {input}, {db}) => {
    const dbUser = await db
        .collection("Users")
        .findOne<DbUser>({email: input.email});

    const isPasswordCorrect = dbUser?.password && input.password
        && bcrypt.compareSync(
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

    const token = getToken(user.id, JWT_SECRET);

    return {user, token};
  },

  createToDo: async (_, {input}, {db, user}) => {
    if (!user) {
      throw new Error("Authentication error. Please sign in!");
    }

    const resp = await db
        .collection("Todos")
        .insertOne({...input, ownerId: user._id});

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
  updateToDo: async (_, {input, id}, {db, user}) => {
    if (!user) {
      throw new Error("Authentication error. Please sign in!");
    }

    const result = await db
        .collection<DbTodo>("Todos")
        .findOneAndUpdate(
            {_id: new ObjectId(id)},
            {$set: input},
            {returnDocument: "after"}
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
  deleteToDo: async (_, {id}, {db, user}) => {
    if (!user) {
      throw new Error("Authentication error. Please sign in!");
    }

    const result = await db
        .collection("Todos")
        .deleteOne({_id: new ObjectId(id)});

    return result.acknowledged;
  },
};

export default mutations;
