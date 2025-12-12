import "dotenv/config";
import { Sequelize } from "sequelize";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

const { DB_NAME, DB_USER, DB_PASSWORD, DB_HOST_NAME, DB_TYPE } = env;

const db = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST_NAME,
  dialect: DB_TYPE,
  pool: {
    max: 5,
    acquire: 60000,
    idle: 30000,
  },
  define: {
    charset: "utf8mb4",
    collate: "utf8mb4_general_ci",
    dialectOptions: {
      collate: "utf8mb4_general_ci",
    },
  },

  logging: (msg) =>
    process.env.NODE_ENV === "production"
      ? logger.debug(msg)
      : logger.info(msg),
});

db.authenticate()
  .then(() => {})
  .catch((error) => {
    logger.error(
      `Test DB connection failed. Error: ${error.name} - ${error.message}`,
    );
    logger.debug(
      `Test DB connection failed. Host: ${db.config.host}, Port: ${db.config.port}, DatabaseName: ${db.config.database}`,
    );
  });

export { db };
