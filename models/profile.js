'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Profile extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Profile.belongsTo(models.User, {foreignKey: 'UserId'})
    }
  }
  Profile.init({
    UserId: DataTypes.INTEGER,
    fullName: DataTypes.STRING,
    avatarUrl: DataTypes.STRING,
    phoneNumber: DataTypes.STRING,
    address: DataTypes.STRING,
    currency : DataTypes.STRING
  }, {
    hooks:{
      beforeCreate: (instance) =>{
        instance.currency = 'IDR'
      }
    },
    sequelize,
    modelName: 'Profile',
  });
  return Profile;
};