import { createApp } from "@/presentation/http/create-app";

// Export default untuk Vercel serverless
const app = await createApp();

export default app;
