Here’s the updated **README** with the requested changes:

```markdown
# sdmConnect: Resource Management API

## Overview

The **Resource Management API** is a RESTful web service that allows users to manage educational resources, rate resources, comment on them, and manage their profiles. It also provides administrative routes to manage users and system resources. The API uses JWT (JSON Web Tokens) for authentication and authorization, ensuring secure access to protected routes. The system is designed to help educational platforms manage resource sharing and interactions between users.

## Key Features

- **User Management**: Users can register, log in, log out, and manage their profiles.
- **Resource Management**: Users can upload, view, update, and delete resources such as notes, study guides, and other materials.
- **Rating and Reviews**: Users can rate resources on a scale of 1 to 5 and add comments to share feedback with others.
- **Administrative Features**: Admins have the ability to delete users, block/unblock resources, and view system statistics.
- **Search Functionality**: Users can search for resources based on keywords in the title or description.
- **File Uploads**: Currently, users can only provide URLs for resources instead of directly uploading files. This feature is planned for future upgrades to handle direct file uploads, which will reduce server load.

## Features

### 1. **User Routes**
   - **Register**: Allows users to sign up with an avatar and cover image.
   - **Login/Logout**: Enables users to log into the platform using email and password and log out to invalidate the session.
   - **Update Profile**: Users can update their profile information such as username, email, and images.

### 2. **Resource Routes**
   - **Create Resource**: Authenticated users can upload new resources by providing a URL pointing to the resource (currently file upload support via URL only). 
   - **View Resources**: Users can view a list of their uploaded resources and individual resource details.
   - **Update Resource**: Users can update their uploaded resources, including metadata such as the title, description, and file URL.
   - **Delete Resource**: Users can delete their own uploaded resources.

### 3. **Rating and Commenting**
   - **Rate Resources**: Users can rate resources between 1 and 5 stars.
   - **Add/Remove Comments**: Users can add, edit, or delete comments on resources.
   - **View Ratings**: Users can view the average rating of a resource.

### 4. **Admin Routes**
   - **Delete Users**: Admins can delete any user from the system.
   - **Block/Unblock Resources**: Admins can block or unblock resources to control access.
   - **Dashboard**: Admins can view system-wide statistics such as the number of users, resources, active users, and blocked resources.

### 5. **Search and Analytics**
   - **Search Resources**: Users can search for resources based on a query (e.g., title or description).
   - **View Statistics**: Both admins and users can view different types of statistics (e.g., total resources uploaded, active users).

### 6. **File Uploads**
   - **Current Uploads**: At present, users are only able to upload resources by providing a **URL** link to the file (e.g., PDF, image) hosted elsewhere.
   - **Future Upgrade**: The ability to upload files directly to the server will be rolled out in a future upgrade. This upgrade is planned to improve user experience by allowing file uploads directly to the server, however, it was postponed for now due to the potential server load that it would impose.

---

## Technologies Used

- **Node.js**: The backend is built using Node.js.
- **Express.js**: A lightweight web framework used to build the API.
- **MongoDB**: The database used for storing user information, resources, ratings, and comments.
- **JWT (JSON Web Tokens)**: Used for authenticating users and providing secure access to protected routes.

---

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```

2. Navigate to the project folder:
   ```bash
   cd <project-folder>
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Set up environment variables:
   - Create a `.env` file and set up necessary variables such as database URL, JWT secret, etc.

5. Run the server:
   ```bash
   npm start
   ```

6. The API will be running at `http://localhost:5000` by default.

---

## Usage

### Authentication

Most routes require authentication via JWT tokens. After logging in, users will receive an access token, which must be included in the `Authorization` header of requests:

```text
Authorization: Bearer <token>
```

---

## Project Background

We built **sdmConnect** as part of our **Software Engineering** course. The course required us to create a project to understand and apply the Software Development Life Cycle (SDLC), create Data Flow Diagrams (DFD), Sequence Diagrams, Requirements Gathering, Testing, and other key aspects of software development. 

This project allowed us to dive deep into backend development, API design, user management, and resource handling, helping us gain hands-on experience in building robust applications for real-world use cases.

---

## Conclusion

The **Resource Management API** is designed to help manage educational content, encourage interaction through ratings and comments, and offer administrative tools for maintaining system integrity. This API can be used as a foundation for building robust educational platforms where users can contribute and access valuable resources. While file upload functionality is currently limited to URLs, we plan to support direct file uploads in the next upgrade to enhance the overall experience.
```
