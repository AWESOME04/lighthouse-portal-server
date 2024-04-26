# Lighthouse Portal - mini project (Backend)

![logo-no-bkgd](https://github.com/AWESOME04/lighthouse-portal-mini-project/assets/102630199/d6dfb45b-f2ec-47d6-a84a-5b8a7f9eeb61)

This repository contains the backend code for a Progressive Web Application (PWA) built with Node.js, Express, and PostgreSQL. The backend provides APIs for user authentication, memo management, hydration tracking, user settings, and user details.

## Features

- User authentication (signup and login)
- Create, read, update, and delete memos
- Track and update user's hydration level
- Fetch and update user settings (theme, language, notifications, font size, dark mode schedule)
- Fetch and update user details (username, email)

## Technologies Used

- Node.js
- Express.js
- PostgreSQL
- JSON Web Tokens (JWT) for authentication
- bcrypt for password hashing
- cors for handling CORS requests

## Getting Started

1. Clone the repository:

```
git clone https://github.com/AWESOME04/lighthouse-portal-server.git
```

2. Install dependencies:

```
cd lighthouse-portal-server
npm install
```

3. Set up the PostgreSQL database and update the connection string in `index.js`. Make sure to use the remote postgresqll server:
```
postgresql://neondb_owner:0cOxDdLE8KSY@ep-holy-cake-a5lsl8iz.us-east-2.aws.neon.tech/neondb?sslmode=require
```

5. Start the server:

```
npm start
```

The server will start running on `http://localhost:5001`.

## API Endpoints

### Authentication

- `POST /api/auth/login`: Log in a user
- `POST /api/auth/signup`: Sign up a new user

### Memos

- `POST /api/auth/memos`: Create a new memo
- `GET /api/auth/memos`: Get all memos for the authenticated user
- `PUT /api/auth/memos/:id`: Update a memo
- `DELETE /api/auth/memos/:id`: Delete a memo

### Hydration

- `GET /api/auth/hydration`: Get the user's hydration level
- `PUT /api/auth/hydration`: Update the user's hydration level

### Settings

- `GET /api/auth/settings`: Get the user's settings
- `PUT /api/auth/settings`: Update the user's settings

### User Details

- `GET /api/auth/user-details`: Get the user's details
- `PUT /api/auth/user-details`: Update the user's details

## License

This project is licensed under the [progress never stops](https://www.progressneverstops.com/).
