import "dotenv/config";
import stoppable from "stoppable";
import { app } from "./app";
import { env } from "./config/env";
import { logger } from "./utils/logger";

const PORT = Number(env.PORT);
const WAIT_TIME_TILL_FORCE_STOP = 60 * 1000;

const server = stoppable(
  app.listen(PORT, () => logger.info(`API server is running on port: ${PORT}`)),
  WAIT_TIME_TILL_FORCE_STOP,
);

process.on("uncaughtException", (err) => {
  console.log("An uncaught exception occurred.\n", err);
});

process.on("SIGTERM", () => {
  logger.debug("Got SIGTERM signal. Terminating...");
  shutDown();
});

process.on("SIGINT", () => {
  logger.info("Got SIGINT signal. Terminating...");
  shutDown();
});

function shutDown() {
  server.close((err) => {
    if (err) {
      logger.error("Error shutting down server");
      logger.error(err.message);
      process.exitCode = 1;
    }
    logger.info("Server terminated successfully");
    process.exit();
  });
}
