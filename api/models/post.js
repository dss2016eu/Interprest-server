module.exports = function(sequelize, DataTypes) {
  var Post = sequelize.define('post', {
    data: DataTypes.TEXT,
    imageId: DataTypes.INTEGER,
    eventId: DataTypes.INTEGER,
    status: DataTypes.INTEGER
  }, {
    timestamps: true,
    tableName: 'post',
    instanceMethods: {
        toJSON: function () {
          var values = this.get();
          if(values.data && typeof values.data === 'string'){
            values.data = JSON.parse(values.data);
          }
          delete values.createdAt;
          var d = new Date(values.updatedAt);
          values.updatedAt = d.getTime();

          return values;
        }
    }
  });

  return Post;
};
