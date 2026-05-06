import { Elysia } from "elysia";

async function initApp() {
  try {
    console.log("🚀 Starting app initialization...");
    
    // Step 1: Test basic Elysia
    console.log("✅ Step 1: Elysia loaded");
    
    // Step 2: Try loading swagger
    console.log("📦 Step 2: Loading swagger...");
    const swaggerModule = await import("@elysiajs/swagger").catch(err => {
      console.error("❌ Failed to load swagger:", err.message);
      return null;
    });
    console.log("✅ Step 2: Swagger loaded");
    
    // Step 3: Try loading response helpers
    console.log("📦 Step 3: Loading response helpers...");
    const responseModule = await import("./src/presentation/http/response.js").catch(err => {
      console.error("❌ Failed to load response helpers:", err.message);
      return null;
    });
    console.log("✅ Step 3: Response helpers loaded");
    
    // Step 4: Try loading database
    console.log("📦 Step 4: Loading database...");
    const dbModule = await import("./src/infrastructure/database/connection.js").catch(err => {
      console.error("❌ Failed to load database:", err.message);
      return null;
    });
    console.log("✅ Step 4: Database loaded");
    
    // Step 5: Create minimal app
    console.log("📦 Step 5: Creating app...");
    const app = new Elysia()
      .get("/", () => ({
        status: "ok",
        message: "Event Ticketing & Booking API",
        version: "1.0.0",
        steps: {
          elysia: "✅",
          swagger: swaggerModule ? "✅" : "❌",
          response: responseModule ? "✅" : "❌",
          database: dbModule ? "✅" : "❌",
        },
        env: {
          NODE_ENV: process.env.NODE_ENV,
          DATABASE_URL: process.env.DATABASE_URL ? "✅ Set" : "❌ Not set",
        }
      }))
      .get("/health", () => ({
        status: "ok",
        timestamp: new Date().toISOString(),
      }));
    
    console.log("✅ Step 5: App created successfully");
    
    // Step 6: Try loading full app if all dependencies loaded
    if (swaggerModule && responseModule && dbModule) {
      console.log("📦 Step 6: Loading full app...");
      try {
        const { createApp } = await import("./src/presentation/http/create-app.js");
        const fullApp = await createApp();
        console.log("✅ Step 6: Full app loaded");
        return fullApp;
      } catch (err) {
        console.error("❌ Step 6 failed:", err);
        return app.get("/error", () => ({
          error: "Failed to load full app",
          message: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
        }));
      }
    }
    
    return app;
    
  } catch (error) {
    console.error("❌ Fatal error during initialization:", error);
    
    // Return absolute minimal app
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
