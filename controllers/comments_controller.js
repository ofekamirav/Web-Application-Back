//Import comment model
const Comment=require('../models/comments_model');
const Post=require('../models/posts_model');


//Handler to create a new Comment for specific post
const CreateComment= async(req,res)=>{
    try{
        const post=await Post.findById(req.params.id);
        if(post==null)
            return res.status(404).json({message:'Post not found,can not create comment'});
        const comment = Comment.create({
            postId: post._id, 
            content: req.body.content,
            sender: req.body.sender
          });
        return res.status(201).json(comment);
}catch(error){
    return res.status(500).json({message:error.message});
}
};
//Handler to delete a comment from specific post
const DeleteComment = async (req, res) => {
    try {
      const post = await Post.findById(req.params.post_id);
      if (post==null) {
        return res.status(404).json({ message: `Post: ${postId} not found` });
      }
  
      const comment = await Comment.findOneAndDelete({ _id: req.params.id, post_id: req.params.post_id});
  
      if (comment==null) {
        return res.status(404).json({ message: 'Comment not found' });
      }
  
      return res.status(200).json({ message: 'Comment deleted' });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  };
module.exports={CreateComment, DeleteComment};