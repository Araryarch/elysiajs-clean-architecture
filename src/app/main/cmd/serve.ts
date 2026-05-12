import { createApp } from "../create-app";
import { appConfig } from "../config/app.config";

export async function serve(): Promise<void> {
  const app = await createApp();

  app.listen(appConfig.port);

  console.log(
    `Event Ticketing API running at http://localhost:${appConfig.port}`,
  );
  console.log(`Swagger docs at http://localhost:${appConfig.port}/swagger`);
  console.log(`Environment: ${appConfig.env}`);
}
