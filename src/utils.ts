import jwt from "jsonwebtoken";
import {Db, ObjectId} from "mongodb";
import {DbUser} from "../types";

export const getToken = (id: string, secret: string) => {
  return jwt.sign({ id }, secret, {
    expiresIn: "12h",
  });
};

export const getUserFromToken = async (token: string, db: Db, secret: string) => {
  if (!token) {
    return null;
  }

  const TokenData = jwt.verify(token, secret);

  if (!TokenData["id"]) {
    return null;
  }

  return await db
      .collection<DbUser>("Users")
      .findOne({ _id: new ObjectId(TokenData["id"]) });
};

