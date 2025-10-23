# String Analyzer Service

A RESTful API service that analyzes strings and stores their computed properties including length, palindrome detection, unique character count, word count, SHA-256 hash, and character frequency mapping.

## Features

- ✅ Analyze strings with multiple computed properties
- ✅ SHA-256 hash generation for unique identification
- ✅ Palindrome detection (case-insensitive)
- ✅ Character frequency mapping
- ✅ Advanced filtering with query parameters
- ✅ Natural language query support
- ✅ Full CRUD operations

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Storage:** In-memory (Map data structure)

## API Endpoints

### 1. Create/Analyze String

```
POST /strings
Content-Type: application/json

{
  "value": "string to analyze"
}
```

**Responses:**

- `201 Created` - String analyzed successfully
- `409 Conflict` - String already exists
- `400 Bad Request` - Missing or invalid request body
- `422 Unprocessable Entity` - Invalid data type for value

### 2. Get Specific String

```
GET /strings/{string_value}
```

**Responses:**

- `200 OK` - String found
- `404 Not Found` - String does not exist

### 3. Get All Strings with Filtering

```
GET /strings?is_palindrome=true&min_length=5&max_length=20&word_count=2&contains_character=a
```

**Query Parameters:**

- `is_palindrome` - boolean (true/false)
- `min_length` - integer (minimum string length)
- `max_length` - integer (maximum string length)
- `word_count` - integer (exact word count)
- `contains_character` - string (single character)

**Responses:**

- `200 OK` - Returns filtered results
- `400 Bad Request` - Invalid query parameters

### 4. Natural Language Filtering

```
GET /strings/filter-by-natural-language?query=all%20single%20word%20palindromic%20strings
```

**Supported Queries:**

- "all single word palindromic strings"
- "strings longer than 10 characters"
- "palindromic strings that contain the first vowel"
- "strings containing the letter z"

**Responses:**

- `200 OK` - Returns filtered results with interpreted query
- `400 Bad Request` - Unable to parse query
- `422 Unprocessable Entity` - Conflicting filters

### 5. Delete String

```
DELETE /strings/{string_value}
```

**Responses:**

- `204 No Content` - String deleted successfully
- `404 Not Found` - String does not exist

## Installation & Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Local Setup

1. **Clone the repository**

```bash
git clone https://github.com/Al-ameen24434/stage-1-backend.git
cd string-analyzer-service
```

2. **Install dependencies**

```bash
npm install
```

3. **Run the server**

```bash
npm start
```

The server will start on `http://localhost:3000` by default.

### Development Mode

Run with auto-reload on file changes:

```bash
npm run dev
```

## Environment Variables

Create a `.env` file in the root directory (optional):

```env
PORT=3000
```

## Testing

## Example Usage

### Using cURL

**Create a string:**

```bash
curl -X POST http://localhost:3000/strings \
  -H "Content-Type: application/json" \
  -d '{"value": "racecar"}'
```

**Get a specific string:**

```bash
curl http://localhost:3000/strings/racecar
```

**Filter strings:**

```bash
curl "http://localhost:3000/strings?is_palindrome=true&word_count=1"
```

**Natural language query:**

```bash
curl "http://localhost:3000/strings/filter-by-natural-language?query=single%20word%20palindromic%20strings"
```

**Delete a string:**

```bash
curl -X DELETE http://localhost:3000/strings/racecar
```

### Using JavaScript (fetch)

```javascript
// Create a string
const response = await fetch("http://localhost:3000/strings", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ value: "hello world" }),
});
const data = await response.json();
console.log(data);
```

## Deployment

### Recommended Platforms

- **Railway** - Simple deployment with automatic HTTPS
- **Heroku** - Classic PaaS platform
- **AWS EC2/Elastic Beanstalk** - Full control
- **DigitalOcean App Platform** - Easy deployment
- **Fly.io** - Global edge deployment

### Example: Deploying to Railway

1. Create a `railway.json` file:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

2. Push to GitHub
3. Connect repository to Railway
4. Deploy!

### Example: Deploying to Heroku

1. Create a `Procfile`:

```
web: node server.js
```

2. Deploy:

```bash
heroku create your-app-name
git push heroku main
```

## Response Format

All successful responses follow this structure:

```json
{
  "id": "sha256_hash_value",
  "value": "analyzed string",
  "properties": {
    "length": 15,
    "is_palindrome": false,
    "unique_characters": 10,
    "word_count": 2,
    "sha256_hash": "abc123...",
    "character_frequency_map": {
      "a": 2,
      "n": 1
      // ...
    }
  },
  "created_at": "2025-10-22T10:00:00.000Z"
}
```

## Error Handling

All errors return appropriate HTTP status codes with error messages:

```json
{
  "error": "Error message description"
}
```

## Notes

- Data is stored in-memory and will be lost when the server restarts
- For production use, consider integrating a database (MongoDB, PostgreSQL, etc.)
- The service handles duplicate strings by returning a 409 Conflict error
- Palindrome checking is case-insensitive and ignores whitespace
