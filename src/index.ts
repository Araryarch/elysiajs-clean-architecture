import { createApp } from "@/presentation/http/create-app";

// Export app untuk digunakan oleh api/index.ts
export const app = await createApp();

export default app;
