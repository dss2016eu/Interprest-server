module.exports = function(sequelize, DataTypes) {
  return sequelize.define('language', {
    name: DataTypes.TEXT,
    code: DataTypes.TEXT,
    nativeName: DataTypes.TEXT,
    eventId: DataTypes.INTEGER
  }, {
    timestamps: false,
    tableName: 'language'
  });
};
