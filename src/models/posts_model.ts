import mongoose from 'mongoose';

export interface iPost{
    title: string;
    content: string;
    owner: string;
}

const postSchema = new mongoose.Schema<iPost>({
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

  const Post = mongoose.model<iPost>('Posts', postSchema);

export default Post;