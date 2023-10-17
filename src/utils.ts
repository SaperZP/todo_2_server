import jwt from "jsonwebtoken";
import {Db, ObjectId} from "mongodb";
import {DbUser} from "../types";

export const getToken = (id: string, secret: string) => {
  return jwt.sign({ id }, secret, {
    expiresIn: "6h",
  });
};

export const getUserFromToken = async (token: string, db: Db, secret: string) => {
  let TokenData;

  if (!token) {
    return null;
  }

  try {
    TokenData = jwt.verify(token, secret);
  } catch (e) {
    console.error(e)
    return null
  }

  if (!TokenData["id"]) {
    return null;
  }

  return await db
      .collection("Users")
      .findOne<DbUser>({_id: new ObjectId(TokenData["id"])});
};

