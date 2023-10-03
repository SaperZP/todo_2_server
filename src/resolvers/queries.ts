import {QueryResolvers, User} from "../../resolvers-types";
import {DbTodo, DbUser} from "../../types";
import {ObjectId} from "mongodb";

const queries: QueryResolvers = {
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
};

export default queries;
