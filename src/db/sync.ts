import { logger } from "../utils/logger";
import { db } from "./index";

if (String(process.env.NODE_ENV).toUpperCase() !== "PRODUCTION") {
  db.sync({ alter: true })
    .then(() => logger.info("DB tables created"))
    .catch((err) => {
      logger.error({ message: "DB tables creation failed.", ...err });
    });
}
