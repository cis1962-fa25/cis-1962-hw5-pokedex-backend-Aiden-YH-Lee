# HW5 Backend Study Notes & Questions

## Project Structure

**Q: How should I organize my files? It feels messy putting everything in one file.**
**A:** Standard Express pattern is "Controller-Service-Model" (or similar).

- `src/routes/`: Defines the URLs (endpoints) and points them to controllers.
- `src/controllers/`: Handles the HTTP stuff (req/res, status codes, validation errors).
- `src/services/`: The actual "business logic". Talks to the DB (Redis) or external APIs (PokeAPI).
- `src/models/`: TypeScript interfaces and Zod schemas.
- `src/middleware/`: Functions that run *before* the controller (like Auth).

**Why?** Separation of concerns. If I want to change from Redis to SQL later, I only change the Service. If I want to change the URL, I only change the Route.

**Q: Why do we have both `app.ts` and `index.ts`?**
**A:** Separation of concerns and testability.

- **`src/app.ts` (Configuration)**: Sets up middleware, routes, and error handling. It exports the `app` instance but *does not* listen on a port.
- **`src/index.ts` (Entry Point)**: Imports the configured `app`, decides which port to use, and starts the server (`app.listen()`).

**Why?**

1. **Testing**: You can import `app` in tests (like Supertest) to make requests without starting a real server on a network port.
2. **Cleanliness**: Separates "what the app does" from "how the app starts".

## Middleware

**Q: What exactly is "middleware"?**
**A:** It's a function that sits in the middle of the request flow.
`Request -> Middleware -> Route Handler -> Response`

**Q: Why do we need it for this homework?**
**A:** For **Authentication**.
Instead of checking `if (token_is_valid)` inside *every single* box route (create, delete, update, list), we write one middleware function `authenticateJWT`.
We tell Express: "Run this check before ANY box route". If it fails, return 401 immediately. If it passes, go to the next step.

**Q: How do I pass data from middleware to the controller?**
**A:** Attach it to the `req` object!
In `authMiddleware.ts`: `req.user = { pennkey: '...' }`
In `boxController.ts`: `const user = req.user.pennkey`

## Authentication (JWT)

**Q: What is a JWT (JSON Web Token) and why do we use it?**
**A:** It's a secure way to transmit information between parties as a JSON object.
**Why?** HTTP is stateless. The server doesn't remember who you are between requests.
Instead of storing a "session" on the server (which takes up memory), we give the client a "badge" (the token) when they log in.
They show this badge with every request. The server verifies the badge's signature to know it's real.

**Q: How does it work?**
**A:** A JWT has 3 parts:

1. **Header**: Algorithm used.
2. **Payload**: The data (e.g., `{ "pennkey": "user1" }`).
3. **Signature**: A hash of the Header + Payload + a Secret Key only the server knows.

If a hacker tries to change the payload (e.g., change "user1" to "admin"), the signature won't match anymore because they don't have the Secret Key to generate a new valid signature.

**Q: How do we use it in this app?**
**A:**

1. **Login**: User sends credentials. We create a token: `jwt.sign({ pennkey }, SECRET)`.
2. **Client**: Stores the token and sends it in the header: `Authorization: Bearer <token>`.
3. **Server**: Middleware checks the header, verifies the token: `jwt.verify(token, SECRET)`.

## Redis & Data

**Q: What is Redis and how is it different from a normal database?**
**A:** Redis is an **in-memory** key-value store.

- **Normal DB (SQL)**: Saves to hard drive (slow but safe). Good for complex relationships.
- **Redis**: Saves to RAM (super fast but can lose data if power goes out). Good for caching and simple lookups.

Think of it like a giant JavaScript Object `{}` shared by the whole app.

**Q: Redis is just key-value. How do I store a complex object like a Box Entry?**
**A:** `JSON.stringify()` it before saving, and `JSON.parse()` it after reading.

**Q: How do I stop users from seeing each other's pokemon?**
**A:** Namespacing keys!
Don't just use `id` as the key. Use `${pennkey}:pokedex:${id}`.
When listing, search for `${pennkey}:pokedex:*`. This guarantees isolation.

## PokeAPI "Synthesis"

**Q: The requirements say I need to fetch move details for EVERY move. Isn't that slow?**
**A:** Yes, if done one by one (`await` inside a loop).
**Solution:** `Promise.all()`.
Map the array of moves to an array of Promises (fetch requests), then await them all at once. This runs them in parallel.

```typescript
// Slow
for (const move of moves) { await fetch(move); }

// Fast
await Promise.all(moves.map(move => fetch(move)));
```

## Common Gotchas & Debugging

**Q: Why is `req.body` undefined when I send a POST request?**
**A:** You probably forgot `app.use(express.json())` in your main `index.ts`.
Express doesn't parse JSON bodies by default. You have to tell it to.

**Q: I get `Error: connect ECONNREFUSED 127.0.0.1:6379`. What gives?**
**A:** Your Redis server isn't running!
The code is trying to talk to a database that doesn't exist. Open a new terminal and run `redis-server`.

## How `app.use()` in Express Works

`app.use()` is Express's way of registering **middleware** - functions that process requests before they reach your route handlers.

### Basic Concept

When a request comes in, Express passes it through a chain of middleware functions in the order they're registered with `app.use()`. Each middleware can:

- Process the request
- Modify the request/response objects
- Call `next()` to pass control to the next middleware
- Send a response and stop the chain

### Syntax

```javascript
app.use([path], callback)
```

- **path** (optional): A route pattern. If omitted, the middleware runs on ALL requests
- **callback**: A function that receives `(req, res, next)` or `(err, req, res, next)` for error handlers

### Common Examples

**Run on all routes:**

```typescript
app.use(express.json()); // Parse JSON bodies
app.use(logger); // Custom middleware
```

**Run on specific path:**

```typescript
app.use('/api', authMiddleware); // Only requests to /api
```

**Order matters!** Middleware runs in registration order.

### Key Gotcha

If middleware doesn't call `next()`, the request chain stops and subsequent middleware won't run. Always call `next()` unless you're intentionally sending a response.

## Express Router

**Q: What is \`Router()\`?**
**A:** \`Router()\` creates a new "mini-application" object. It's an isolated instance of middleware and routes.
Think of it as a way to group related routes together (like all auth routes, all pokemon routes) into their own modules.

**Q: Why do we use it?**
**A:** To keep \`app.ts\` clean and modular.
Instead of having 50 routes in one file:
\`\`\`typescript
app.get('/auth/login', ...);
app.get('/auth/register', ...);
app.get('/pokemon/list', ...);
\`\`\`
We split them into files:

- \`authRoutes.ts\` handles \`/auth\`
- \`pokemonRoutes.ts\` handles \`/pokemon\`

**Q: How does \`router.use()\` work?**
**A:** It works exactly like \`app.use()\`, but only for that specific router.
If you add middleware to a router:
\`\`\`typescript
const router = Router();
router.use(authenticateJWT); // 1. Apply middleware
router.get('/', controller.list); // 2. Define routes
\`\`\`
The \`authenticateJWT\` middleware will ONLY run for routes defined on *this* router object. It acts as a gatekeeper for this specific group of routes.

## Using Redis in a TypeScript Backend

### Installation

```typescript
npm install redis
npm install --save-dev @types/redis
```

### Basic Setup

```typescript
import { createClient } from 'redis';

const redisClient = createClient({
    host: '127.0.0.1',
    port: 6379,
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
await redisClient.connect();

export default redisClient;
```

### Common Operations

**Set a key:**

```typescript
await redisClient.set('key', 'value');
await redisClient.setEx('key', 3600, 'value'); // with expiry (seconds)
```

**Get a key:**

```typescript
const value = await redisClient.get('key');
```

**Delete a key:**

```typescript
await redisClient.del('key');
```

**Pattern matching (find all keys):**

```typescript
const keys = await redisClient.keys('user:*');
```

### Working with JSON

```typescript
// Save
const obj = { id: 1, name: 'Pikachu' };
await redisClient.set('pokemon:1', JSON.stringify(obj));

// Retrieve and parse
const data = await redisClient.get('pokemon:1');
const parsed = JSON.parse(data!);
```

### Namespacing Example

```typescript
const key = `${pennkey}:pokedex:${pokemonId}`;
await redisClient.set(key, JSON.stringify(pokemonData));

// Get all user's pokemon
const userKeys = await redisClient.keys(`${pennkey}:pokedex:*`);
```

### Cleanup

```typescript
await redisClient.disconnect();
```

## Using the `jsonwebtoken` Library

### Installation

```bash
npm install jsonwebtoken
npm install --save-dev @types/jsonwebtoken
```

### Importing

```typescript
import jwt from 'jsonwebtoken';
```

### 1. Signing a Token (Creating it)

Used when a user logs in. You create a "badge" for them.

```typescript
const payload = { pennkey: 'ash_ketchum' };
const secret = process.env.JWT_TOKEN_SECRET!; // Make sure this is in .env
const options = { expiresIn: '1h' }; // Token dies in 1 hour

const token = jwt.sign(payload, secret, options);
// Returns a string: "eyJhbGciOiJIUzI1NiIsInR..."
```

### 2. Verifying a Token (Checking it)

Used in middleware to check if the "badge" is real.

```typescript
try {
    const decoded = jwt.verify(token, secret);
    // Returns the payload object: { pennkey: 'ash_ketchum', iat: ..., exp: ... }
    console.log((decoded as any).pennkey);
} catch (err) {
    // Throws error if token is invalid, expired, or tampered with
    console.error('Invalid token');
}
```

### 3. Decoding a Token (Reading it without verifying)

**Warning:** This does NOT check if the signature is valid. Only use for debugging or if you just need to read the data and verify it later.

```typescript
const decoded = jwt.decode(token);
```
