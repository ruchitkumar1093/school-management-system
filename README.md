# School Management System

The School Management System is a web-based application developed to manage common school administration and academic activities.

The application follows a role-based architecture:

- **Principal** manages teachers, students, subjects, admission requests, attendance, marks and exams.
- **Teacher** manages academic information assigned to them, including marks and attendance.
- **Student** can view their academic and attendance information and manage their account.

The backend exposes REST APIs using Express and MongoDB, while the frontend provides a React-based user interface.

## Demo Credentials

The following credentials are available for testing the different user roles:

| Role | UID | Password |
|---|---|---|
| Principal | `pri0001` | `12345` |
| Teacher | `tch0001` | `12345` |
| Student | `stu0001` | `12345` |

## Table of Contents

- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Replica Set Requirement](#replica-set-requirement)
- [Running the Migration](#running-the-migration)
- [Feature Testing Guide](#feature-testing-guide)
- [Authentication and Authorization](#authentication-and-authorization)
- [Database Design](#database-design)
- [Quick Reference](#quick-reference)

## Technology Stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Axios
- React Icons

### Backend

- Node.js
- Express
- TypeScript
- Mongoose
- MongoDB
- JWT
- bcrypt

### Development Tools

- Git
- GitHub
- Visual Studio Code
- MongoDB
- MongoDB Compass

## Project Structure

A simplified structure of the project is:

```text
school-management-system/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── services/
│   │   └── assets/
│   ├── package.json
│   └── ...
│
├── server/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── config/
│   │   └── ...
│   │
│   ├── migrations/
│   │   ├── migrate.ts
│   │   ├── 001_seedDemoData.ts
│   │   └── 002_seedClasses.ts
│   │
│   ├── .env
│   └── ...
│
│
│
└── README.md
```

## Installation

### 1. Clone the Repository

```bash
git clone <GITHUB_REPOSITORY_URL>
```

Move into the project directory:

```bash
cd school-management-system
```

### 2. Install Frontend Dependencies

```bash
cd client
npm install
```

### 3. Install Backend Dependencies

Open another terminal or move to the backend:

```bash
cd ../server
npm install
```

## Environment Configuration

Create a `.env` file inside the `server` directory.

Example:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/schoolManagementSystem?replicaSet=rs0
JWT_SECRET=myjwtsecret
```

### Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Port used by the Express backend |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used for signing JWT tokens |

## Replica Set Requirement

The project uses MongoDB transactions for operations that modify multiple related collections atomically.

Therefore, the MongoDB instance must support transactions through a replica set.

The configured connection string uses:

```text
replicaSet=rs0
```

Make sure your local MongoDB instance is configured with a replica set named `rs0`.

## Demo Data

The project includes a migration system that can populate a fresh database with realistic demo data.

The demo seed creates:

- 1 Principal
- 60 Teachers
- 60 Students
- 60 Subjects
- Marks for students
- 12 Classes
- Attendance records
- 5 Admission Requests
- Hashed passwords for all demo users

The successful demo migration currently produces approximately:

```text
Principal: 1
Teachers: 60
Students: 60
Subjects: 60
Classes: 12
Marks: 892
Attendance: 600
Admission Requests: 5
```

All seeded users use the same demo password:

```text
12345
```

The password is stored in the database as a bcrypt hash.

## Running the Migration

Open a terminal in the backend directory:

```bash
cd server
```

Run:

```bash
npm run migrate
```

### Important:

The project previously used a migration system that did not track executed migrations. The current migration system stores executed migrations in the MongoDB `migrations` collection.

If you have an existing database created using an older version of this project then before running the new migration delete old database otherwise the new migration system can cause duplicate-key errors and the migration may fail.

## Feature Testing Guide

At both frontend and backend run:

```bash
npm run dev
```

The following sequence is recommended when demonstrating the project.

### Landing Page and Admission Form:

Landing Page provides an introduction to the school with navigation to the admission form and management portal. Students can submit their details in admission form for admission which is later reviewed by the Principal.

When Principal approve then the default password for every student is the DOB they entered during filling the form, students can later change the password.

### LOGIN AS PRINCIPAL:

Use:

```text
UID: pri0001
Password: 12345
```

Verify that the Principal dashboard opens.

### 1. View Teachers

Open the teacher management section.

Verify:

- Teacher list
- Employee IDs
- Department
- Assigned class
- Filter by class, Sort, Order, Search, Pagination

### 2. Add or Update a Teacher

Create or edit a teacher.

Verify:

- Required fields
- UID uniqueness
- Employee ID uniqueness
- Department/class validation
- Password hashing

### 3. View Students

Open the student management section.

Verify:

- Student list
- Class
- Roll number
- Filter by class, Sort, Order, Search, Pagination
- Edit, delete

### 4. View Attendance

Verify:

- Attendance Summary
- View Attendance Student Wise
- View Attendance Date Wise
- Migration provides attendance data from 01-09-2026 to 12-09-2026

### 5. Admission Requests

Open an admission request and test:

- Pending request
- Approve request
- Reject request
- View request  
- Filter by class and Status, Sort, Order, Search, Pagination

After accepting the request the default password for every student is the DOB they entered during filling the form, students can later change the password. When an admission is approved, the system creates the corresponding user and student records.

### 6. View Subjects

Verify that subjects exist for different classes.

- Check subject codes
- Teacher Assigned
- Add, Edit, delete
- Filter by class, Sort, Order, Search, Pagination

### 7. View Marks

Open the marks section.

Verify:

- Student
- Subject
- Exam Type
- Marks obtained
- Total marks
- Result
- Add, Edit, delete
- Filter by class, filter by exam type, Sort, Order, Search, Pagination

### 8. Class Overview

Open the Class Overview section.

Use the class tabs to switch between classes from 1st to 12th.

Verify:

- Class Info
- Class information updates when switching between classes

### 9. View Exams / Results

Verify that class wise examination information and result calculations are displayed correctly according to the application's implemented rules.

### 10. Password Change

Open the Change Password page.

Test:

1. Enter the current password.
2. Enter a new password.
3. Confirm the new password.
4. Submit.
5. Log in again using the new password.

---

### LOGIN AS TEACHER:

Login with any teacher's UID with password 12345.

### 1. View Students

Open the student management section.

Verify:

- Student list
- Class
- Roll number
- Sort, Order, Search, Pagination
- Edit, delete

### 2. View Attendance

Verify:

- Mark Attendance Page
- Mark All Absent or Present
- View Attendance Student Wise
- View Attendance Date Wise
- Migration provides attendance data from 01-09-2026 to 12-09-2026

### 3. View Assigned Subjects

Verify that subjects exist for different classes.

- Check subject codes
- Check class matches with the teacher class
- Order, Search, Pagination

### 4. View Marks

Open the marks section.

Verify:

- Student
- Subject
- Exam Type
- Marks obtained
- Total marks
- Result
- Add, Edit, delete
- Filter by Exam type, Sort, Order, Search, Pagination

### 5. View Exams / Results

Verify that class examination information and result calculations are displayed correctly and display only logged in teacher class result.

---

### LOGIN AS STUDENT

### 1. View Attendance

Verify:

- Student Info
- Total attendane in percentage
- Present days and absent days
- Migration provides attendance data from 01-09-2026 to 12-09-2026

### 2. View Subjects

Open the subject management section.

Verify:

- Subject list
- Class
- Teacher Assigned
- Order, Search, Pagination

### 3. View Marks

Open the marks section.

Verify:

- Subject
- Exam Type
- Marks obtained
- Total marks
- Result
- Filter by Exam type, Sort, Order, Search, Pagination

## Authentication and Authorization

The application uses JWT-based authentication.

### Login Flow

1. User submits UID and password.
2. Backend searches for the user.
3. bcrypt verifies the submitted password against the stored hash.
4. Backend generates a JWT.
5. JWT contains the authenticated user's ID and role.
6. Frontend stores the authentication information.
7. Protected routes become accessible.

The JWT contains information equivalent to:

```text
userId
role
```

## Protected Routes

Backend routes use authentication middleware to verify the JWT.

Role-based authorization middleware ensures that users cannot access functionality intended for another role.

The frontend also uses protected routes for role-specific pages.

## Database Design

The main MongoDB collections/models are:

### User

Stores authentication and role information.

Important fields include:

- `name`
- `uid`
- `password`
- `role`

### Teacher

Stores teacher-specific information.

Important fields:

- `userId`
- `employeeID`
- `department`
- `classAssigned`

### Student

Stores student-specific information.

Important fields:

- `userId`
- `class`
- `section`
- `rollNumber`

### Subject

Stores school subjects.

Important fields:

- `name`
- `subjectCode`
- `class`

### Mark

Stores examination marks.

Important fields:

- `studentId`
- `teacherId`
- `subjectId`
- `exam`
- `marksObtained`
- `totalMarks`

### Attendance

Stores student attendance.

Important fields:

- `studentId`
- `teacherId`
- `date`
- `status`

### AdmissionRequest

Stores admission applications.

Important fields include:

- Other information
- `status`
- `userId`
- `studentId`
- timestamps

### Class

Stores class-level information and the teacher assigned as the class teacher.

Important fields:

- `class`
- `teacherId`

## Quick Reference

### Backend

```bash
cd server
npm install
npm run migrate
npm run dev
```

### Frontend

```bash
cd client
npm install
npm run dev
```

### Demo Principal

```text
UID: pri0001
Password: 12345
```

### Demo Teacher

```text
UID: tch0001
Password: 12345
```

### Demo Student

```text
UID: stu0001
Password: 12345
```