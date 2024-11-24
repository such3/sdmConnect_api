# API Documentation

This document describes the available endpoints for interacting with the **sdmConnect** API.

## Authentication Routes

### `POST /api/v1/users/register`

- **Description**: Registers a new user. Users can upload an avatar and cover image as part of the registration.
- **Body**:
  - `avatar`: Image file for avatar,required.
  - `coverImage`: Image file for cover (optional).
  - `username`: String, required.
  - `email`: String, required.
  - `password`: String, required.
  - `role`: String (`admin`, `user`), optional (defaults to `user`).
- **Response**:
  - `200 OK`: User successfully registered.
  - `400 Bad Request`: Validation error (missing fields, invalid data).

---

### `POST /api/v1/users/login`

- **Description**: Logs in a user and returns a JSON Web Token (JWT) for authentication.
- **Body**:
  - `email`: String, required.
  - `password`: String, required.
- **Response**:
  - `200 OK`: Successful login with access and refresh tokens.
  - `401 Unauthorized`: Incorrect credentials.

---

### `POST /api/v1/users/logout`

- **Description**: Logs out the user by clearing their authentication token.
- **Headers**:
  - `Authorization`: Bearer token.
- **Response**:
  - `200 OK`: User successfully logged out.
  - `401 Unauthorized`: If the token is not valid or missing.

---

### `POST /api/v1/users/refresh-token`

- **Description**: Refreshes the user's access token using the refresh token.
- **Body**:
  - `refreshToken`: String, required (in cookies or body).
- **Response**:
  - `200 OK`: New access token.
  - `401 Unauthorized`: If the refresh token is invalid.

---

## Resource Routes

### `POST /api/v1/users/resource`

- **Description**: Allows a logged-in user to create a new resource.
- **Headers**:
  - `Authorization`: Bearer token.
- **Body**:
  - `title`: String, required.
  - `description`: String, required.
  - `semester`: Number (1-8), required.
  - `branch`: String (`ISE`, `CSE`, `ECE`, `MECH`, `CIVIL`, `EEE`, `AIML`, `CHEMICAL`), required.
  - `url`: String (URL of the resource file), required.
  - `fileSize`: Number, required.
- **Response**:
  - `201 Created`: Resource created successfully.
  - `400 Bad Request`: Missing or invalid fields.

---

### `GET /api/v1/users/resources`

- **Description**: Retrieves all resources, optionally filtered by semester, branch, and other query parameters.
- **Headers**:
  - `Authorization`: Bearer token.
- **Query Parameters**:
  - `semester`: Filter by semester (optional).
  - `branch`: Filter by branch (optional).
  - `isBlocked`: Filter by blocked status (optional).
- **Response**:
  - `200 OK`: List of resources.
  - `404 Not Found`: If no resources are found.

---

### `GET /api/v1/users/resource/:resourceId`

- **Description**: Retrieves a single resource by ID.
- **Headers**:
  - `Authorization`: Bearer token.
- **Params**:
  - `resourceId`: Resource ID.
- **Response**:
  - `200 OK`: Resource found.
  - `404 Not Found`: If the resource does not exist.

---

### `PUT /api/v1/users/resource/:resourceId`

- **Description**: Updates the title and description of a resource. Only the owner or admin can update the resource.
- **Headers**:
  - `Authorization`: Bearer token.
- **Params**:
  - `resourceId`: Resource ID.
- **Body**:
  - `title`: String, required.
  - `description`: String, required.
- **Response**:
  - `200 OK`: Resource updated successfully.
  - `403 Forbidden`: If the user is neither the owner nor an admin.
  - `404 Not Found`: If the resource does not exist.

---

### `DELETE /api/v1/users/resource/:resourceId`

- **Description**: Deletes a resource. Only the owner or admin can delete the resource.
- **Headers**:
  - `Authorization`: Bearer token.
- **Params**:
  - `resourceId`: Resource ID.
- **Response**:
  - `200 OK`: Resource deleted successfully.
  - `403 Forbidden`: If the user is neither the owner nor an admin.
  - `404 Not Found`: If the resource does not exist.

---

## Admin Routes

### `PATCH /api/v1/admin/block-user/:userId`

- **Description**: Blocks a user, preventing them from logging in and interacting with the platform.
- **Headers**:
  - `Authorization`: Bearer token (admin required).
- **Params**:
  - `userId`: User ID to block.
- **Response**:
  - `200 OK`: User blocked successfully.
  - `404 Not Found`: If the user does not exist.
  - `401 Unauthorized`: If the user is not an admin.

---

### `PATCH /api/v1/admin/unblock-user/:userId`

- **Description**: Unblocks a user, restoring their ability to log in and interact with the platform.
- **Headers**:
  - `Authorization`: Bearer token (admin required).
- **Params**:
  - `userId`: User ID to unblock.
- **Response**:
  - `200 OK`: User unblocked successfully.
  - `404 Not Found`: If the user does not exist.
  - `401 Unauthorized`: If the user is not an admin.

---

### `DELETE /api/v1/admin/delete-user/:userId`

- **Description**: Deletes a user from the system. All resources owned by the user will also be deleted.
- **Headers**:
  - `Authorization`: Bearer token (admin required).
- **Params**:
  - `userId`: User ID to delete.
- **Response**:
  - `200 OK`: User and their resources deleted successfully.
  - `404 Not Found`: If the user does not exist.
  - `401 Unauthorized`: If the user is not an admin.

---

### `PATCH /api/v1/admin/block-resource/:resourceId`

- **Description**: Blocks a resource, making it unavailable for other users.
- **Headers**:
  - `Authorization`: Bearer token (admin required).
- **Params**:
  - `resourceId`: Resource ID to block.
- **Response**:
  - `200 OK`: Resource blocked successfully.
  - `404 Not Found`: If the resource does not exist.
  - `401 Unauthorized`: If the user is not an admin.

---

### `PATCH /api/v1/admin/unblock-resource/:resourceId`

- **Description**: Unblocks a resource, making it available for other users again.
- **Headers**:
  - `Authorization`: Bearer token (admin required).
- **Params**:
  - `resourceId`: Resource ID to unblock.
- **Response**:
  - `200 OK`: Resource unblocked successfully.
  - `404 Not Found`: If the resource does not exist.
  - `401 Unauthorized`: If the user is not an admin.

---

### `GET /api/v1/admin/dashboard`

- **Description**: Fetches an overview of the system, including statistics about users, resources, and other key metrics.
- **Headers**:
  - `Authorization`: Bearer token (admin required).
- **Response**:
  - `200 OK`: Overview data.
  - `401 Unauthorized`: If the user is not an admin.

---

## Error Handling

For all API responses, errors are handled uniformly. The following are common error responses:

- `400 Bad Request`: Invalid request format or missing required parameters.
- `401 Unauthorized`: If the user is not authenticated or their access token has expired.
- `403 Forbidden`: If the user does not have sufficient permissions to access the resource.
- `404 Not Found`: If the requested resource does not exist.
- `500 Internal Server Error`: If an unexpected error occurs on the server side.
