var _ = require('lodash');
module.exports = function(sequelize, DataTypes) {
  var Event = sequelize.define('event', {
    title: DataTypes.TEXT,
    description: DataTypes.TEXT,
    imageId: DataTypes.INTEGER,
  }, {
    timestamps: false,
    tableName: 'event',
    instanceMethods: {
      toJSON: function () {
          var values = this.get();
          if(values.posts){
            values.posts = _.map(values.posts, function(post){
              return post.toJSON();
            });
          }
          values.name = values.title;

          return values;
      }
    }
  });

  return Event;

};
