import {Db, ObjectId} from "mongodb";

export type DbUser = {
  _id: ObjectId;
  name: string;
  email: string;
  avatar: string;
  password: string;
}

export type DbTodo = {
  _id: ObjectId;
  title: string;
  description: string;
  dueDate: string;
  priority: string;
  categoryId: string;
  isDone: boolean;
  ownerId: ObjectId;
}

export type MyContext = {
  db: Db;
  user: DbUser | null;
}
