import "sequelize";

declare module "sequelize" {
  interface BaseError {
    entity?: string;
  }
}
