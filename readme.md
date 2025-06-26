## Features

- User registration, login, logout, and profile management
- Role-based authorization (`admin`, `manager`, `employee`)
- Project CRUD (Create, Read, Update, Delete)
- Client CRUD
- JWT authentication with secure cookies
- MongoDB (Mongoose) models for Users, Projects, Clients, Sales, Tasks, and Roles
- Centralized error handling middleware
- Environment-based configuration
- Cloudinary integration (for file uploads, if configured)

-----------------------------------

API Endpoints

Users
POST /api/v1/users/register — Register a new user (admin only)
POST /api/v1/users/login — Login
GET /api/v1/users/logout — Logout
GET /api/v1/users/me — Get current user profile
GET /api/v1/users/ — Get all users (admin only)
GET /api/v1/users/:id — Get user by ID (admin only)
PUT /api/v1/users/:id — Update user (admin only)
DELETE /api/v1/users/:id — Delete user (admin only)

-----------------------------------

Clients
POST /api/v1/clients/add — Add client (admin/manager)
DELETE /api/v1/clients/:id — Delete client (admin/manager)
PUT /api/v1/clients/:id — Update client (admin/manager)
GET /api/v1/clients/ — Get all clients (admin/manager)
GET /api/v1/clients/:id — Get client by ID (admin/manager)

-----------------------------------

Projects
GET /api/v1/projects/ — Get all projects (admin/manager)
GET /api/v1/projects/:id — Get project by ID (admin/manager)
POST /api/v1/projects/ — Create project (admin)
PUT /api/v1/projects/:id — Update project (admin)
DELETE /api/v1/projects/:id — Delete project (admin)


-----------------------------------------

Tasks

GET /api/v1/tasks/ — Get all tasks (admin/manager)
GET /api/v1/tasks/my-tasks —  Get my tasks (for logged in user)
GET /api/v1/tasks/project/:projectId —  // Get tasks by project (only admin,manager)
GET /api/v1/tasks/:id — Get task by ID (admin/manager)/(assign employee)
POST /api/v1/tasks/ — Create task (admin/manager)
PUT /api/v1/tasks/:id — Update task (admin/manager)
PATCH /api/v1/tasks/:id/status — Update task status (admin/manager)
DELETE /api/v1/tasks/:id — Delete task (admin/manager)