import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String, 
      required: true
    },
    owner: {
      type: String,
      required: true,
    },
  });

  const Post = mongoose.model('Posts', postSchema);

export default Post;