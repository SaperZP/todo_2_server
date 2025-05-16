# Todo 2 API Server

A GraphQL API server for managing todo items. This backend powers the Todo 2 web application and is built using Node.js, Express, Apollo Server, and MongoDB.

## 🌐 Live Demo

[https://todo2-api.bilous.info](https://todo2-api.bilous.info)

## 🚀 Tech Stack

- **Node.js**
- **Express.js**
- **GraphQL**
- **Apollo Server**
- **MongoDB**
- **TypeScript**

## 📦 Features

- GraphQL schema for todos (create, read, update, delete)
- MongoDB for persistent data storage
- Modular structure with clean TypeScript code
- Environment-based configuration
- Deployed and publicly accessible API

## 🛠 Installation

```bash
git clone https://github.com/SaperZP/todo_2_server.git
cd todo_2_server
npm install
```

## ⚙️ Environment Variables

Create a `.env` file in the root directory and add the following:

```env
PORT=4000
MONGO_URI=your_mongodb_connection_string
```

## ▶️ Running the Server

```bash
npm run dev
```

By default, the server will run at `http://localhost:4000/graphql`.

## 🧪 Example Queries

### Get all todos

```graphql
query {
  todos {
    id
    title
    completed
  }
}
```

### Create a new todo

```graphql
mutation {
  createTodo(title: "Learn GraphQL") {
    id
    title
    completed
  }
}
```

### Toggle completion

```graphql
mutation {
  toggleTodo(id: "your_todo_id") {
    id
    completed
  }
}
```

## 📁 Project Structure

```
todo_2_server/
│
├── src/
│   ├── schema/         # GraphQL schema definitions
│   ├── resolvers/      # GraphQL resolvers
│   ├── models/         # Mongoose models
│   └── index.ts        # Server entry point
│
├── .env                # Environment variables
├── package.json
└── tsconfig.json
```

## 📄 License

This project is licensed under the MIT License.

---

> Created by [Andriy Bilous](https://github.com/SaperZP)
