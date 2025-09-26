'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Campaign extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Campaign.hasMany(models.CampaignCategory, {foreignKey: 'CampaignId'}),
      Campaign.belongsTo(models.User, {foreignKey: 'UserId'})
    }

    get startDates(){
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Jakarta'
      }).format(this.startDate).toLowerCase();
    }

    get endDates(){
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Jakarta'
      }).format(this.endDate).toLowerCase();
    }
  }
  Campaign.init({
    UserId: DataTypes.INTEGER,
    title: {
      type: DataTypes.STRING,
    allowNull: false,
    validate:{
      notEmpty:{
        msg: `Title is Required`
      },
      notNull:{
        msg: `Title is required!`
      }
    }
    },
    description: {
      type: DataTypes.TEXT,
    allowNull: false,
    validate:{
      notEmpty:{
        msg: `Description is Required`
      },
      notNull:{
        msg: `Description is required!`
      }
    }
    },
    goalAmount: {
      type: DataTypes.INTEGER,
    allowNull: false,
    validate:{
      notEmpty:{
        msg: `Goal Amount is Required`
      },
      notNull:{
        msg: `Goal Amount is required!`
      },
      min:{
        args: 1000000,
        msg: `Minimal Goal Amount is IDR 1.000.000`
      }
    }
    },
    currentAmount: DataTypes.INTEGER,
    startDate: {
      type: DataTypes.DATE,
    allowNull: false,
    validate:{
      notEmpty:{
        msg: `Start Date is Required`
      },
      notNull:{
        msg: `Start Date is required!`
      },
      isDate:{
        msg: `Format Date is Invalid`
      }
    }
    },
    endDate: {
      type: DataTypes.DATE,
    allowNull: false,
    validate:{
      notEmpty:{
        msg: `End Date is Required`
      },
      notNull:{
        msg: `End Date is required!`
      },
      isDate:{
        msg: `Format Date is Invalid`
      }
    }
    },
    status: DataTypes.STRING
  }, {
    hooks:{
      beforeCreate: (instance) => {
        instance.currentAmount = 0
        instance.status = 'On Going'
      }
    },
    sequelize,
    modelName: 'Campaign',
  });
  return Campaign;
};