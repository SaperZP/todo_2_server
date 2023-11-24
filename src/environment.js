import dotenv from "dotenv";
dotenv.config();
export const { DB_NAME, DB_URI, JWT_SECRET, PORT } = process.env;
