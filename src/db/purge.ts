import { env } from "../config/env";
import { db } from "../models";
import { logger } from "../utils/logger";

const drop = async () => {
  try {
    await db.drop();
    logger.info("Database tables deleted");

    process.exit(0);
  } catch (error) {
    logger.error("Error deleting database tables:", error);
    process.exit(1);
  }
};

if (env.NODE_ENV !== "production") {
  drop();
}
