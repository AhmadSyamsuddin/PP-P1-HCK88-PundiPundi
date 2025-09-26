"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Donation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Donation.belongsTo(models.User, { foreignKey: "UserId" });
      Donation.belongsTo(models.Campaign, { foreignKey: "CampaignId" });
    }

    static async listAllAdmin() {
      const { User, Campaign } = this.sequelize.models;
      return this.findAll({
        include: [
          { model: User, attributes: ["id", "userName", "email", "role"] },
          { model: Campaign, attributes: ["id", "title"] },
        ],
        order: [["createdAt", "DESC"]],
      });
    }
  }
  Donation.init(
    {
      UserId: DataTypes.INTEGER,
      CampaignId: DataTypes.INTEGER,
      amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: {
            msg: `Amount of Donation is required!`,
          },
          notEmpty: {
            msg: `Amount of Donation is required!`,
          },
          min: {
            args: 10000,
            msg: `Minimal Donation Is  IDR 10.000`,
          },
        },
      },
      message: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: "Donation",
    }
  );
  return Donation;
};
