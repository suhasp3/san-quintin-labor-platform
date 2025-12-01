# Mexico Labor Project

Mobile-based employment system for agricultural day laborers in San Quintín, Baja California.

## Project Overview

This project creates a low-text, icon-based, voice-enabled mobile application to formalize hiring practices and connect workers with growers. The system uses a Poisson process to model job arrivals and provides analytics for labor demand forecasting.

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: FastAPI (Python)
- **Data Generation**: Poisson process for job arrivals
- **Styling**: Tailwind CSS

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the backend server:
```bash
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
   - Create a `.env` file in the root directory (same level as `package.json`)
   - Add your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```
   - **Note**: These are the same values from `backend/.env` but with `VITE_` prefix so Vite can expose them to the frontend
   - You can copy the values from `backend/.env` and add the `VITE_` prefix

3. Run the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Features

- **Authentication**: Secure login and signup using Supabase Auth
- **Job Discovery**: Browse available agricultural jobs with icon-based navigation
- **Voice Applications**: Apply to jobs using voice recordings (low-literacy support)
- **Digital Contracts**: Track job applications and contract status (protected routes)
- **Admin Dashboard**: View statistics, labor demand forecasts, and job analytics
- **Poisson Process Modeling**: Realistic job arrival simulation for research
- **Protected Routes**: Contracts, Dashboard, and Admin pages require authentication

## API Endpoints

See `backend/README.md` for detailed API documentation.

## Project Structure

```
├── backend/          # FastAPI backend with Poisson process data generation
├── src/              # React frontend application
│   ├── components/   # Reusable UI components
│   ├── pages/        # Page components
│   └── utils/        # Utility functions
└── README.md         # This file
```

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
