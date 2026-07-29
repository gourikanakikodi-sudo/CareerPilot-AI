# CareerPilot AI Backend

## Production-ready platform capabilities

- Secure JWT authentication
- Resume upload, ATS matching, and detailed analysis
- Company-specific mock interviews with feedback
- Personalized learning roadmaps and interview history
- PostgreSQL-ready configuration for production deployment

## Setup

1. Create a virtual environment.
2. Install dependencies: `pip install -r requirements.txt`
3. Apply migrations: `python manage.py migrate`
4. Run the server: `python manage.py runserver`

## Notes

- The backend uses SQLite by default for local development.
- Set `DB_ENGINE=postgres` and the associated environment variables to use PostgreSQL.
- Set `GEMINI_API_KEY` to enable live AI responses.
