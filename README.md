# Stock prediction mockup

A modern web application mockup for stock market prediction and analysis using machine learning pipelines. This application provides an intuitive interface for managing ML workflows, configuring training parameters, and visualizing stock predictions.

## Features

- **Stock Analysis**: View detailed stock information and predictions
- **ML Pipeline Management**: Create, edit, and monitor DAG-based machine learning pipelines
- **Training Configuration**: Configure and manage model training parameters
- **Run History**: Track and analyze pipeline execution history
- **Interactive Dashboard**: Real-time visualization of stock data and model performance

## Tech Stack

- React + TypeScript
- Vite (build tool)
- Tailwind CSS
- shadcn/ui components
- React Router for navigation

## Running the code

### Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

The development server will use `.env.development` and connect to `http://localhost:8000` for the API.

### Production Build

1. Build the production bundle:
   ```bash
   npm run build
   ```

The production build will use `.env.production` and connect to `http://13.215.172.15:8000` for the API.

2. Deploy to EC2:
   ```bash
   ./deploy.sh
   ```

For detailed deployment instructions, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Environment Configuration

The application uses environment variables to configure the API base URL:

- **`.env.development`**: Used during development (`npm run dev`)
  - `VITE_API_BASE_URL=http://localhost:8000`

- **`.env.production`**: Used during production build (`npm run build`)
  - `VITE_API_BASE_URL=http://13.215.172.15:8000`

To override these settings locally, create a `.env.local` file (gitignored).

## Project Structure

```
stock-prediction-ui/
├── src/
│   ├── api/           # API client modules
│   ├── components/    # React components
│   ├── pages/         # Page components
│   ├── types/         # TypeScript type definitions
│   └── vite-env.d.ts  # Vite environment type definitions
├── build/             # Production build output
├── docs/              # Documentation
│   └── DEPLOYMENT.md  # Deployment guide
├── .env.development   # Development environment variables
├── .env.production    # Production environment variables
└── deploy.sh          # Deployment script
```