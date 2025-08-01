# Bitzer Internship Project

**Design and implementation of a new system for production logs and data analysis.**

---

## 📋 Overview

This repository contains a full-stack application developed during an internship at Bitzer (Portugal). It provides a web-based interface for managing production logs and performing data analysis in real time.

- **Frontend:** React, Vite, TypeScript, Nginx
- **Backend:** FastAPI, Uvicorn
- **Database:** PostgreSQL

---

## 🏗️ Architecture

```mermaid
flowchart LR
  Tablet["Web Browser"] --> Frontend["React + Vite (Nginx)"]
  Frontend --> Backend["FastAPI (Uvicorn)"]
  Backend --> Database["PostgreSQL"]
```

---

## 📁 Project Structure

- **backend/**

  - **app/**
    - `main.py` — FastAPI entrypoint
    - **api/** — route definitions
    - **core/** — configurations and utilities
    - **db/** — crud, models, schemas, migrations, and Docker Compose config
  - `requirements.txt` — Python dependencies

- **frontend/**
  - **src/** — React + TypeScript source code
  - `package.json` — npm scripts and dependencies
  - `vite.config.ts` — Vite configuration

---

## ⚙️ Prerequisites

- **Node.js** v22 or above (includes npm)
- **Python** v3.8 or above
- **Docker & Docker Compose**

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone ...
cd ...
```

> 💡 If you prefer to skip local setup and run the entire stack with Docker, jump ahead to the [📦 Deployment](#-deployment) section.

### 2. Database Setup

1. ...

### 3. Backend Setup

1. Navigate to the backend folder:

   ```bash
   cd backend/app
   ```

2. Install Python dependencies:

   ```bash
   pip install -r ../requirements.txt
   ```

3. Start PostgreSQL via Docker Compose:

   ```bash
   docker compose up -d
   ```

4. Run the FastAPI server:

   ```bash
   uvicorn main:app --reload --port 8000
   ```

   - The API will be available at `http://localhost:8000`

### 4. Frontend Setup

1. Open a new terminal and navigate to the frontend folder:

   ```bash
   cd frontend
   ```

2. Install npm dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

   - The app will be available at `http://localhost:5173`

4. To create a production build:

   ```bash
   npm run build
   ```

   - Static files will be generated in the `dist/` directory.

5. (Optional) Preview the production build locally:

   ```bash
   npm run preview
   ```

---

## 🌐 Environment Variables

- **Frontend**: Define your API base URL in an `.env` file:

  ```ini
  VITE_API_URL=http://host_url:8000
  ```

- **Backend**: Configure your database connection in `.env` or environment variables:

  ```ini
  DATABASE_URL=postgresql://user:password@container_name:PORT
  ```

---

## 📦 Deployment

To run the full stack using Docker Compose (frontend + backend + database):

1. Configure ``doker_compose.yml`` and setup [Environment Variables](#-environment-variables).

2. From the root of the project:

   ```bash
   docker compose up --build
   ```

3. Access the application:

   - **Frontend:** [http://localhost:3000](http://localhost:3000)
   - **API (Backend):** [http://localhost:8000](http://localhost:8000)
   - **PostgreSQL Database:** exposed on port `5432` if you need external access

   > 💡 Make sure ports `3000`, `8000`, and `5432` are open and not blocked by your firewall.

4. To stop the containers:

   ```bash
   docker compose down
   ```
