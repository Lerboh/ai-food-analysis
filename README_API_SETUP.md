# AI Food Analysis API Setup Guide

## Environment Variables

You need to set the `OPENAI_API_KEY` environment variable for the API to work.

### For Vercel Deployment:

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add a new variable:
   - **Name:** `OPENAI_API_KEY`
   - **Value:** Your OpenAI API key
   - **Environment:** Production, Preview, Development (select all)

### For Local Development:

Create a `.env.local` file in the project root:

```
OPENAI_API_KEY=your_openai_api_key_here
```

## API Endpoint

The API endpoint is located at: `/api/analyze`

### Request Format:

```json
POST /api/analyze
Content-Type: application/json

{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

### Response Format:

**Success (200):**
```json
{
  "ingredients": ["Chicken breast", "Rice", "Broccoli"],
  "macros": {
    "calories": 620,
    "protein": 42,
    "carbs": 55,
    "fat": 18
  }
}
```

**Error (400/500):**
```json
{
  "error": "Unable to analyze image. Please try a clearer photo."
}
```

**Rate Limit (429):**
```json
{
  "error": "Sorry — you've reached today's limit (3). Come back tomorrow."
}
```

## Rate Limiting

- **Limit:** 3 analyses per IP address per day
- **Reset:** Daily at midnight UTC
- **Storage:** In-memory (resets on server restart)

For production, consider using Redis or a database for persistent rate limiting.

## Testing Locally

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel dev`
3. The API will be available at `http://localhost:3000/api/analyze`

## Notes

- The API uses `gpt-4o-mini` model (gpt-5-mini doesn't exist yet)
- Image must be sent as base64 encoded string
- Maximum image size is limited by OpenAI API (typically 20MB)
- Processing time: ~5-15 seconds depending on image complexity

