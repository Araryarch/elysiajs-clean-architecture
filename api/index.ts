import { createApp } from "../src/presentation/http/create-app.ts";

// Vercel serverless function handler
const app = await createApp();

export default app;
