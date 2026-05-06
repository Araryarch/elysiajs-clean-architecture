import { createApp } from "../src/presentation/http/create-app.js";

// Create app instance once
const app = await createApp();

// Export the fetch handler directly
export default app;

// Also export for named import
export { app };
