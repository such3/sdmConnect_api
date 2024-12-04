# **API Documentation**

This document provides detailed information about the API endpoints for managing user authentication, account management, and resource management. All API routes follow REST conventions and require authentication for most operations.

---

## **1. User Routes** (`user.routes.js`)

These routes allow users to manage their account, avatar, cover image, and other account-related details.

---

### **1.1. Register a User**

- **Endpoint**: `POST /api/v1/users/register`
- **Method**: `POST`
- **Description**: Registers a new user with an avatar and cover image.
- **Permissions**: Public (no authentication required).
- **Request Body**:
  - `avatar` (file): The user's avatar image.
  - `coverImage` (file): The user's cover image.
  - `username` (string, required): The user's username.
  - `email` (string, required): The user's email.
  - `password` (string, required): The user's password.
- **Response**:
  - **Success**:
    ```json
    {
      "message": "User registered successfully",
      "user": {
        "username": "john_doe",
        "email": "john.doe@example.com"
      }
    }
    ```

---

### **1.2. Login a User**

- **Endpoint**: `POST /api/v1/users/login`
- **Method**: `POST`
- **Description**: Logs a user into the system and generates a JWT access token.
- **Permissions**: Public (no authentication required).
- **Request Body**:
  - `email` (string, required): The user's email.
  - `password` (string, required): The user's password.
- **Response**:
  - **Success**:
    ```json
    {
      "accessToken": "<JWT Access Token>"
    }
    ```

---

### **1.3. Logout a User**

- **Endpoint**: `POST /api/v1/users/logout`
- **Method**: `POST`
- **Description**: Logs the user out and invalidates the JWT token.
- **Permissions**: Authenticated users only.
- **Response**:
  - **Success**:
    ```json
    {
      "message": "Logged out successfully"
    }
    ```

---

### **1.4. Refresh Access Token**

- **Endpoint**: `POST /api/v1/users/refresh-token`
- **Method**: `POST`
- **Description**: Refreshes the JWT access token using the refresh token.
- **Permissions**: Authenticated users only.
- **Request Body**:
  - `refreshToken` (string, required): The user's refresh token.
- **Response**:
  - **Success**:
    ```json
    {
      "accessToken": "<New JWT Access Token>"
    }
    ```

---

### **1.5. Get Current User**

- **Endpoint**: `GET /api/v1/users/me`
- **Method**: `GET`
- **Description**: Fetches the current authenticated user's profile data.
- **Permissions**: Authenticated users only.
- **Response**:
  - **Success**:
    ```json
    {
      "user": {
        "username": "john_doe",
        "email": "john.doe@example.com",
        "avatar": "avatar_url",
        "coverImage": "cover_image_url"
      }
    }
    ```

---

### **1.6. Update Account Details**

- **Endpoint**: `PUT /api/v1/users/me`
- **Method**: `PUT`
- **Description**: Updates the current user's account details (e.g., username, email).
- **Permissions**: Authenticated users only.
- **Request Body**:
  - `username` (string, optional): New username.
  - `email` (string, optional): New email.
- **Response**:
  - **Success**:
    ```json
    {
      "message": "Account updated successfully",
      "user": {
        "username": "john_doe_updated",
        "email": "john.doe.updated@example.com"
      }
    }
    ```

---

### **1.7. Update User Avatar**

- **Endpoint**: `PUT /api/v1/users/me/avatar`
- **Method**: `PUT`
- **Description**: Updates the current user's avatar image.
- **Permissions**: Authenticated users only.
- **Request Body**:
  - `avatar` (file, required): The new avatar image.
- **Response**:
  - **Success**:
    ```json
    {
      "message": "Avatar updated successfully",
      "user": {
        "avatar": "new_avatar_url"
      }
    }
    ```

---

### **1.8. Update User Cover Image**

- **Endpoint**: `PUT /api/v1/users/me/cover-image`
- **Method**: `PUT`
- **Description**: Updates the current user's cover image.
- **Permissions**: Authenticated users only.
- **Request Body**:
  - `coverImage` (file, required): The new cover image.
- **Response**:
  - **Success**:
    ```json
    {
      "message": "Cover image updated successfully",
      "user": {
        "coverImage": "new_cover_image_url"
      }
    }
    ```

---

### **1.9. Change Current Password**

- **Endpoint**: `PUT /api/v1/users/me/password`
- **Method**: `PUT`
- **Description**: Allows users to change their current password.
- **Permissions**: Authenticated users only.
- **Request Body**:
  - `currentPassword` (string, required): The current password.
  - `newPassword` (string, required): The new password.
- **Response**:
  - **Success**:
    ```json
    {
      "message": "Password updated successfully"
    }
    ```

---

## **2. Admin Routes** (`admin.routes.js`)

These routes are for administrative users to manage system resources, users, and view statistics.

---

### **2.1. Delete a User**

- **Endpoint**: `DELETE /api/v1/admin/delete-user/:userId`
- **Method**: `DELETE`
- **Description**: Deletes a user from the system.
- **Permissions**: Admin-only (authenticated and authorized via JWT token).
- **Parameters**:
  - `userId` (required): The ID of the user to be deleted.
- **Headers**:
  - `Authorization: Bearer <token>` (JWT token for authentication).
- **Response**:
  - **Success**:
    ```json
    {
      "message": "User deleted successfully"
    }
    ```
  - **Error**:
    ```json
    {
      "message": "User not found"
    }
    ```

---

### **2.2. Admin Dashboard**

- **Endpoint**: `GET /api/v1/admin/dashboard`
- **Method**: `GET`
- **Description**: Fetches the admin dashboard with system statistics and analytics.
- **Permissions**: Admin-only (authenticated and authorized via JWT token).
- **Headers**:
  - `Authorization: Bearer <token>` (JWT token for authentication).
- **Response**:
  - **Success**:
    ```json
    {
      "usersCount": 120,
      "resourcesCount": 50,
      "blockedUsers": 3,
      "blockedResources": 2,
      "activeUsers": 117
    }
    ```

---

## **3. Resource Routes** (`resource.routes.js`)

These routes allow users to manage resources they upload, including creating, updating, deleting, and viewing resources.

---

### **3.1. Create a Resource**

- **Endpoint**: `POST /api/v1/users/resources`
- **Method**: `POST`
- **Description**: Allows authenticated users to upload a new resource.
- **Permissions**: Authenticated users only.
- **Request Body**:
  - `title` (string, required): The title of the resource.
  - `description` (string, required): The description of the resource.
  - `semester` (number, required): The semester associated with the resource (1-8).
  - `branch` (string, required): The branch (e.g., CSE, ECE).
  - `url` (string, required): The URL to the uploaded resource.
- **Response**:
  - **Success**:
    ```json
    {
      "message": "Resource uploaded successfully",
      "resource": {
        "title": "Machine Learning Notes",
        "description": "A comprehensive guide to Machine Learning",
        "url": "/uploads/machine-learning.pdf"
      }
    }
    ```

---

### **3.2. Get All Resources**

- **Endpoint**: `GET /api/v1/users/resources`
- **Method**: `GET`
- **Description**: Retrieves all resources uploaded by the authenticated user.
- **Permissions**: Authenticated users only.
- **Response**:
  - **Success**:
    ```json
    {
      "resources": [
        {
          "title": "Machine Learning Notes",
          "url": "/uploads/machine-learning.pdf"
        },
        {
          "title": "AI and Deep Learning",
          "url": "/uploads/ai-deep-learning.pdf"
        }
      ]
    }
    ```

---

### **3.3. Update a Resource**

- **Endpoint**: `PUT /api/v1/users/resources/:resourceId`
- **Method**: `PUT`
- **Description**: Allows users to update their uploaded resource.
- \*\*Permissions

\*\*: Authenticated users only.

- **Parameters**:
  - `resourceId` (required): The ID of the resource to be updated.
- **Request Body**:
  - `title` (string, optional): The new title of the resource.
  - `description` (string, optional): The new description of the resource.
  - `url` (string, optional): The new URL to the resource.
- **Response**:
  - **Success**:
    ```json
    {
      "message": "Resource updated successfully",
      "resource": {
        "title": "Updated Machine Learning Notes",
        "url": "/uploads/updated-machine-learning.pdf"
      }
    }
    ```

---

### **3.4. Delete a Resource**

- **Endpoint**: `DELETE /api/v1/users/resources/:resourceId`
- **Method**: `DELETE`
- **Description**: Deletes a resource uploaded by the user.
- **Permissions**: Authenticated users only.
- **Parameters**:
  - `resourceId` (required): The ID of the resource to be deleted.
- **Response**:
  - **Success**:
    ```json
    {
      "message": "Resource deleted successfully"
    }
    ```

---

### **3.5. Get Resource by ID**

- **Endpoint**: `GET /api/v1/users/resources/:resourceId`
- **Method**: `GET`
- **Description**: Fetches a specific resource by its ID.
- **Permissions**: Authenticated users only.
- **Parameters**:
  - `resourceId` (required): The ID of the resource to be fetched.
- **Response**:
  - **Success**:
    ```json
    {
      "resource": {
        "title": "Machine Learning Notes",
        "description": "A comprehensive guide to Machine Learning",
        "url": "/uploads/machine-learning.pdf"
      }
    }
    ```

---
