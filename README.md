# Forum Backend

Backend API for the Modern Community Forum Platform.

Built with Node.js, Express, Prisma ORM and PostgreSQL.

## Live API

https://forum-backend-5r3y.onrender.com/

## Frontend Repository

https://github.com/andrei-db/forum-frontend

## Tech Stack

- Node.js
- Express
- PostgreSQL
- Prisma ORM
- JWT Authentication
- Cookie Parser
- CORS

## Features

- JWT authentication
- Protected routes
- Staff-only admin routes
- Group-based permissions
- Forum permission system
- Topic and post management
- Forum management
- Group management
- Settings system
- Maintenance mode support
- Analytics dashboard API
- Online users tracking

## Main Models

- User
- Group
- Category
- Forum
- Topic
- Post
- GroupForumPermission
- Setting

## API Features

- REST API architecture
- Prisma relations
- Transaction-based operations
- Middleware-based permissions
- Forum access control
- Validation and error handling

## Project Structure

```txt
src/
 ├── db/
 ├── middleware/
 ├── prisma/
 ├── routes/
 ├── utils/
 └── server.js
 ```

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file:

```env
DATABASE_URL=
JWT_SECRET=
CLIENT_URL=
```

## Prisma Setup

```bash
npx prisma migrate dev
npx prisma generate
```

## Run Development Server

```bash
npm run dev
```

## Notes

This backend powers a custom-built community forum platform with a full admin control panel, analytics system and scalable forum permission architecture.