import { createApp } from "./app/main/create-app";

const port = Number(Bun.env.PORT ?? 3000);
const app = await createApp();

app.listen(port);

console.log(`Event Ticketing & Booking API is running at http://localhost:${port}`);
