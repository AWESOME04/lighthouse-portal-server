# Lighthouse Portal - mini project (Backend)

![logo-no-bkgd](https://github.com/AWESOME04/lighthouse-portal-mini-project/assets/102630199/d6dfb45b-f2ec-47d6-a84a-5b8a7f9eeb61)

This repository contains the backend code for a Progressive Web Application (PWA) built with Node.js, Express, and PostgreSQL. The backend provides APIs for user authentication, memo management, hydration tracking, user settings, and user details.

## Features

    User authentication (signup, login, token refresh)
    User profile management (view, update, delete account)
    Hydration tracking
    Calorie calculation based on user metrics
    Memo management (CRUD operations)
    User settings management
    Profile picture uploads

## Technologies Used

    Node.js
    Express.js
    PostgreSQL (with pg library)
    JSON Web Tokens (JWT) for authentication
    bcrypt for password hashing
    multer for file uploads
    sharp for image processing
    CORS for handling cross-origin requests

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

    POST /api/auth/signup: User registration
    POST /api/auth/login: User login
    POST /api/auth/refresh-token: Refresh JWT token

### User Routes

    GET /api/users/: Get user email
    GET /api/users/details: Get user details
    PUT /api/users/details: Update user details
    DELETE /api/users/delete-account: Delete user account
    PUT /api/users/change-password: Change user password

### Memo Routes

    POST /api/memos: Create a memo
    GET /api/memos: Get all memos
    PUT /api/memos/:id: Update a memo
    PUT /api/memos/:id/done: Update memo completion status
    DELETE /api/memos/:id: Delete a memo

#### Hydration Routes

    GET /api/hydration: Get hydration data
    PUT /api/hydration: Update hydration data

#### Calories Routes

    POST /api/calories/calculate: Calculate calories

#### Settings Routes

    GET /api/settings: Get user settings
    PUT /api/settings: Update user settings

### User Measurements Routes

    GET /api/measurements: Get user measurements

## Contributing

Contributions to the LHP application are welcome! If you find any bugs or have suggestions for improvements, please open an issue or submit a pull request.

## License

This project is licensed under the [progress never stops](https://www.progressneverstops.com/).
