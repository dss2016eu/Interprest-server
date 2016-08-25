module.exports = function(sequelize, DataTypes) {
  return sequelize.define('user', {
    username: DataTypes.TEXT,
    role: DataTypes.TEXT,
    languageId: DataTypes.INTEGER,
    eventId: DataTypes.INTEGER
  }, {
    timestamps: false,
    tableName: 'user',
    instanceMethods: {
      toJSON: function(){
        var values = this.get();
        values.isAdmin = values.role === 'admin' ? true : false;
        values.isTranslator = values.role === 'translator' ? true : false;

        return values;
      }
    }
  });
};
