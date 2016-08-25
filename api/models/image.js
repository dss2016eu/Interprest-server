module.exports = function(sequelize, DataTypes) {
  var Image = sequelize.define('image', {
    // id: DataTypes.INTEGER,
    title: DataTypes.TEXT,
    type: DataTypes.TEXT,
    file: DataTypes.BLOB
  }, {
    timestamps: false,
    tableName: 'image',
    instanceMethods: {
        toJSON: function () {
            var values = this.get();
            var url = '/images/' + values.title;
            return url;
        }
    }
  });

  return Image;

};
