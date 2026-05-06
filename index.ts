import { Elysia } from "elysia";
import { createApp } from "./src/presentation/http/create-app.js";

// Wrap createApp with error handling
async function initApp() {
  try {
    const app = await createApp();
    console.log("✅ App initialized successfully");
    return app;
  } catch (error) {
    console.error("❌ Failed to initialize app:", error);
    
    // Return minimal error app
    return new Elysia()
      .get("/", () => ({
        error: "Failed to initialize application",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }))
      .get("/health", () => ({
        status: "error",
        message: "App initialization failed",
      }));
  }
}

export default await initApp();
