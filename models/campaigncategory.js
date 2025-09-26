'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CampaignCategory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      CampaignCategory.belongsTo(models.Campaign, {foreignKey: 'CampaignId'})
      CampaignCategory.belongsTo(models.Category, {foreignKey: 'CategoryId'})
    }
  }
  CampaignCategory.init({
    CampaignId: DataTypes.INTEGER,
    CategoryId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'CampaignCategory',
  });
  return CampaignCategory;
};