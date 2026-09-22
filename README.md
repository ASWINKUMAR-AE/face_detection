# Smart Face Recognition Attendance System

A production-ready Desktop Application built with Electron.js, React, and MySQL for managing student attendance via Face Recognition.

## Prerequisites

- Node.js (v16+)
- MySQL Server (v8.0+)

## Setup

1.  **Database Setup:**
    - Open your MySQL client (Workbench, CLI, etc.).
    - Create the database: `CREATE DATABASE smart_attendance;`
    - Run the script `schema.sql` to create tables and seed data.

2.  **Configuration:**
    - Edit `.env` file in the root directory to match your MySQL credentials.
    - Ensure you have a `stud` folder in the root for student images.
    - Ensure you have a `models` folder in the root containing face-api.js models.
      - *Note: Models should be downloaded from face-api.js repo if not present.*

3.  **Install Dependencies:**
    ```bash
    npm install
    ```

## Running the App

- **Development Mode:**
  ```bash
  npm run dev
  ```
- **Production Build:**
  ```bash
  npm run build
  npm start
  ```

## Features

- **Admin Login**: Secure entry to the system.
- **Student Management**: Add/Edit students, sync from `stud` folder.
- **Face Registration**: Capture faces via webcam or upload from disk.
- **Real-time Attendance**: Detects faces and marks attendance automatically.
- **Voice Feedback**: Announces "<Name> present successfully".
- **Reports**: View attendance percentage by class or student.

## Folder Structure

- `src/main`: Electron main process & IPC handlers.
- `src/renderer`: React frontend code.
- `src/db`: Database connection and repositories.
- `src/services`: Face recognition logic.
- `stud`: Directory for storing student face images.
- `models`: Directory for face-api.js models.
