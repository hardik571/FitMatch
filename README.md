# FitMatch AI

A full-stack application built with React/Vite (Frontend) and Python/FastAPI (Backend). 

## Folder Structure
- `/frontend`: React application using Vite, TailwindCSS, and Lucide React.
- `/backend`: Python FastAPI server connected to Supabase.

## Prerequisites
- Python 3.8+
- Node.js (v18+)
- Supabase account and project

## Setup & Running Locally

### Backend (Python/FastAPI)
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the `.env.example` file to `.env` and fill in your Supabase credentials.
5. Start the server:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend (React/Vite)
1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and set `VITE_API_URL=http://localhost:8000`
4. Start the development server:
   ```bash
   npm run dev
   ```
