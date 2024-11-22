const mongoose = require('mongoose');
const postSchema = new mongoose.Schema({
    title: {
      type: String,
      required: true,
    },
    content: String,
    owner: {
      type: String,
      required: true,
    },
  });

  const Posts = mongoose.model('Posts', postSchema);
  module.exports = Posts;