import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
export const getToken = (id, secret) => {
    return jwt.sign({ id }, secret, {
        expiresIn: "6h",
    });
};
export const getUserFromToken = async (token, db, secret) => {
    let TokenData;
    if (!token) {
        return null;
    }
    try {
        TokenData = jwt.verify(token, secret);
    }
    catch (e) {
        console.error(e);
        return null;
    }
    if (!TokenData["id"]) {
        return null;
    }
    return await db
        .collection("Users")
        .findOne({ _id: new ObjectId(TokenData["id"]) });
};
