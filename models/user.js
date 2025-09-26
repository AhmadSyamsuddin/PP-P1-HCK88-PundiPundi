'use strict';
const bcrypt = require('bcryptjs')
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      User.hasOne(models.Profile, {foreignKey: 'UserId'})
      User.hasMany(models.Donation, {foreignKey: 'UserId'})
      User.hasMany(models.Campaign, {foreignKey: 'UserId'})
    }
  }
  User.init({
    userName: {
      type: DataTypes.STRING,
    allowNull: false,
    validate:{
      notEmpty:{
        msg :`User Name required!`
      },
      notNull:{
        msg: `User Name required!`
      }
    }
    },
    email: {
      type: DataTypes.STRING,
    allowNull: false,
    validate:{
      notEmpty:{
        msg :`Email required!`
      },
      notNull:{
        msg: `Email required!`
      },
      isEmail:{
        msg: `Invalid Email format!`
      }
    }
    },
    password: {
      type: DataTypes.STRING,
    allowNull: false,
    validate:{
      notEmpty:{
        msg :`Password required!`
      },
      notNull:{
        msg: `Password required!`
      },
      len:{
        args: [8,20],
        msg: `Password Minimal 8 characters and Maximal 20 characters!`
      }
    }
    },
    role: DataTypes.STRING
  }, {
    hooks:{
      beforeCreate: (instance) => {
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(instance.password, salt);

        instance.password = hash
      }
    },
    sequelize,
    modelName: 'User',
  });
  return User;
};