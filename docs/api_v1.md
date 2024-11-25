---
# **API Documentation**

This document provides detailed information about the API endpoints for managing users, resources, ratings, comments, and more. All API routes follow REST conventions and require authentication for most operations.
---

## **1. Admin Routes** (`admin.routes.js`)

These routes are for administrative users to manage system resources, users, and view statistics.

### **1.1. Delete a User**

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

### **1.2. Block a Resource**

- **Endpoint**: `PATCH /api/v1/admin/block-resource/:resourceId`
- **Method**: `PATCH`
- **Description**: Blocks a resource, preventing users from accessing it.
- **Permissions**: Admin-only (authenticated and authorized via JWT token).
- **Parameters**:
  - `resourceId` (required): The ID of the resource to be blocked.
- **Headers**:
  - `Authorization: Bearer <token>` (JWT token for authentication).
- **Response**:
  - **Success**:
    ```json
    {
      "message": "Resource blocked successfully"
    }
    ```
  - **Error**:
    ```json
    {
      "message": "Resource not found"
    }
    ```

---

### **1.3. Unblock a Resource**

- **Endpoint**: `PATCH /api/v1/admin/unblock-resource/:resourceId`
- **Method**: `PATCH`
- **Description**: Unblocks a previously blocked resource, allowing users to access it again.
- **Permissions**: Admin-only (authenticated and authorized via JWT token).
- **Parameters**:
  - `resourceId` (required): The ID of the resource to be unblocked.
- **Headers**:
  - `Authorization: Bearer <token>` (JWT token for authentication).
- **Response**:
  - **Success**:
    ```json
    {
      "message": "Resource unblocked successfully"
    }
    ```
  - **Error**:
    ```json
    {
      "message": "Resource not found"
    }
    ```

---

### **1.4. Admin Dashboard**

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

## **2. User Routes** (`user.routes.js`)

These routes allow users to manage their account, resources, ratings, and comments.

### **2.1. Register a User**

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

### **2.2. Login a User**

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

### **2.3. Logout a User**

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

### **2.4. Refresh Access Token**

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

## **3. Resource Routes**

These routes allow users to manage resources they upload, including creating, updating, deleting, and viewing resources.

### **3.1. Create a Resource**

- **Endpoint**: `POST /api/v1/users/resource`
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

### **3.3. Get a Single Resource**

- **Endpoint**: `GET /api/v1/users/resource/:resourceId`
- **Method**: `GET`
- **Description**: Fetches the details of a specific resource by ID.
- **Permissions**: Authenticated users only.
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

### **3.4. Update a Resource**

- **Endpoint**: `PUT /api/v1/users/resource/:resourceId`
- **Method**: `PUT`
- **Description**: Allows users to update their uploaded resource.
- **Permissions**: Authenticated users only (resource owner).
- **Request Body**:
  - `title` (string, optional): Updated title of the resource.
  - `description` (string, optional): Updated description of the resource.
  - `semester` (number, optional): Updated semester.
  - `branch` (string, optional): Updated branch.
- **Response**:
  - **Success**:
    ```json
    {
      "message": "Resource updated successfully",
      "resource": {
        "title": "Advanced Machine Learning",
        "description": "An in-depth guide to Advanced Machine Learning",
        "url": "/uploads/advanced-ml.pdf"
      }
    }
    ```

---

### **3.5. Delete a Resource**

- **Endpoint**: `DELETE /api/v1/users/resource/:resourceId`
- **Method**: `DELETE`
- **Description**

: Deletes an uploaded resource.

- **Permissions**: Authenticated users only (resource owner).
- **Response**:
  - **Success**:
    ```json
    {
      "message": "Resource deleted successfully"
    }
    ```

---

## **4. Rating Routes**

### **4.1. Rate a Resource**

- **Endpoint**: `POST /api/v1/users/resource/:resourceId/rate`
- **Method**: `POST`
- **Description**: Allows users to rate a resource between 1 and 5.
- **Permissions**: Authenticated users only.
- **Request Body**:
  - `rating` (number, required): Rating between 1 and 5.
- **Response**:
  - **Success**:
    ```json
    {
      "message": "Rating added successfully"
    }
    ```

---

### **4.2. Remove a Rating**

- **Endpoint**: `DELETE /api/v1/users/resource/:resourceId/rating`
- **Method**: `DELETE`
- **Description**: Removes a user's rating for a resource.
- **Permissions**: Authenticated users only.
- **Response**:
  - **Success**:
    ```json
    {
      "message": "Rating removed successfully"
    }
    ```

---

### **4.3. Get Resource Rating**

- **Endpoint**: `GET /api/v1/users/resource/:resourceId/rating`
- **Method**: `GET`
- **Description**: Fetches the average rating of a resource.
- **Permissions**: Authenticated users only.
- **Response**:
  - **Success**:
    ```json
    {
      "averageRating": 4.5
    }
    ```

---

## **5. Comment Routes**

### **5.1. Add a Comment**

- **Endpoint**: `POST /api/v1/users/resource/:resourceId/comment`
- **Method**: `POST`
- **Description**: Allows users to add a comment on a resource.
- **Permissions**: Authenticated users only.
- **Request Body**:
  - `comment` (string, required): The text of the comment.
- **Response**:
  - **Success**:
    ```json
    {
      "message": "Comment added successfully"
    }
    ```

---

### **5.2. Edit a Comment**

- **Endpoint**: `PUT /api/v1/users/resource/:resourceId/comment/:commentId`
- **Method**: `PUT`
- **Description**: Allows users to edit their own comment on a resource.
- **Permissions**: Authenticated users only (comment owner).
- **Request Body**:
  - `comment` (string, required): The updated comment text.
- **Response**:
  - **Success**:
    ```json
    {
      "message": "Comment updated successfully"
    }
    ```

---

### **5.3. Delete a Comment**

- **Endpoint**: `DELETE /api/v1/users/resource/:resourceId/comment/:commentId`
- **Method**: `DELETE`
- **Description**: Allows users to delete their own comment on a resource.
- **Permissions**: Authenticated users only (comment owner).
- **Response**:
  - **Success**:
    ```json
    {
      "message": "Comment deleted successfully"
    }
    ```

---

### **5.4. Get All Comments for a Resource**

- **Endpoint**: `GET /api/v1/users/resource/:resourceId/comments`
- **Method**: `GET`
- **Description**: Retrieves all comments associated with a specific resource.
- **Permissions**: Authenticated users only.
- **Response**:
  - **Success**:
    ```json
    {
      "comments": [
        {
          "user": "john_doe",
          "comment": "This resource is amazing!",
          "createdAt": "2024-10-01T00:00:00Z"
        },
        {
          "user": "jane_doe",
          "comment": "I found this resource helpful.",
          "createdAt": "2024-10-02T00:00:00Z"
        }
      ]
    }
    ```

---

## **6. File Download Route**

### **6.1. Download a Resource**

- **Endpoint**: `GET /api/v1/users/resource/download/:filename`
- **Method**: `GET`
- **Description**: Allows users to download a specific resource file (PDF).
- **Permissions**: Authenticated users only.
- **Parameters**:
  - `filename` (required): The name of the file to be downloaded.
- **Headers**:
  - `Authorization: Bearer <token>` (JWT token for authentication).
- **Response**:
  - **Success**: The file will be downloaded (e.g., `machine-learning.pdf`).
  - **Error** (e.g., file not found):
    ```json
    {
      "message": "File not found"
    }
    ```

---
