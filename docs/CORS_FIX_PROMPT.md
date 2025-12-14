# Prompt for LLM to Fix CORS Issue

Copy and paste this prompt to an LLM to fix the CORS issue in your backend:

---

## Prompt:

I'm getting a CORS error when my frontend tries to connect to my FastAPI backend. The error is:

```
Request URL: http://13.215.215.232:8000/api/v1/auth/login
Request Method: OPTIONS
Status Code: 400 Bad Request
Referrer Policy: strict-origin-when-cross-origin
```

**My Setup:**
- **Frontend**: Running on `http://13.215.215.232:3000` (Vite dev server on EC2)
- **Backend**: FastAPI running in Docker on `http://13.215.215.232:8000`
- **Backend code location**: `../stock-prediction`

**What I need:**

1. Find the CORS middleware configuration in my FastAPI backend (likely in `app/main.py` or similar)

2. Update the CORS configuration to allow these origins:
   - `http://localhost:3000` (local development)
   - `http://13.215.215.232:3000` (EC2 development server)
   - `http://13.215.215.232` (production on port 80)

3. The CORS configuration should look something like this:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://13.215.215.232:3000",
        "http://13.215.215.232",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

4. Show me exactly which file(s) to modify and what changes to make

5. Tell me how to restart the Docker container after making the changes

**Please:**
- Search for the CORS configuration in the backend code
- Show me the exact file path and line numbers
- Provide the complete updated code
- Include instructions for restarting the backend

---

## Alternative Shorter Prompt:

I need to fix a CORS error in my FastAPI backend located at `../stock-prediction`. 

The frontend at `http://13.215.215.232:3000` is getting a 400 Bad Request on OPTIONS requests to `http://13.215.215.232:8000/api/v1/auth/login`.

Please:
1. Find the CORS middleware configuration in the backend
2. Update it to allow origins: `http://localhost:3000`, `http://13.215.215.232:3000`, and `http://13.215.215.232`
3. Show me which files to modify and how to restart the Docker container

The backend is running in Docker (container name: `stock-prediction-api`).
