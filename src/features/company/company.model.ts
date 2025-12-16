import { DataTypes, Model, Optional } from "sequelize";
import { db } from "../../db";

export interface CompanyAttributes {
  id: number;
  alias: string;
  name: string;
}

export interface CompanyCreationAttributes extends Optional<
  CompanyAttributes,
  "id"
> {}

export interface CompanyInstance
  extends
    Model<CompanyAttributes, CompanyCreationAttributes>,
    CompanyAttributes {}

const Company = db.define<CompanyInstance>(
  "Company",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    alias: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "companies",
    timestamps: true,
  },
);

export { Company };
