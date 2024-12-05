import Comment from "../models/comment_model"
import Post from '../models/posts_model';
import { Request, Response } from 'express';

const updateComment = async (req:Request, res:Response) => {
    const { id } = req.params;
    const { content, owner } = req.body;

    try {
        const updatedComment = await Comment.findByIdAndUpdate(
            id,
            { content, owner },
            { new: true, runValidators: true }
        );

        if (!updatedComment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        res.status(200).json(updatedComment);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

const getAllCommentsBySpecificUser = async (req:Request, res:Response) => {
    const { owner } = req.params;

    try {
        const comments = await Comment.find({ owner });

        if (!comments.length) {
            return res.status(404).json({ message: 'No comments found for this user' });
        }

        res.status(200).json(comments);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

//Handler to create a new Comment for specific post
const CreateComment= async(req:Request,res:Response)=>{
    try{
        const comment = await Comment.create({
            post_id: req.body.post_id, 
            content: req.body.content,
            owner: req.body.owner,
            date: new Date(),
        });

        console.log("Comment created:", comment);

        const post=await Post.findById(comment.post_id);
        if(post==null)
            return res.status(404).json({message:'Post not found,can not create comment'});
        return res.status(201).json(comment);
}catch(error: any){
    return res.status(500).json({message:error.message});
}
};

//Handler to delete a comment from specific post
const DeleteComment = async (req:Request, res:Response) => {
    try {
      const comment = await Comment.findOneAndDelete({ _id: req.params.id});
  
      if (comment==null) {
        return res.status(404).json({ message: 'Comment not found' });
      }
  
      return res.status(200).json({ message: 'Comment deleted' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  };

  //Handler to get all comments of a specific post
const GetAllCommentsOfPost= async (req:Request,res:Response)=>{
    try{
        const post=await Post.findById(req.params.id);
        if(post==null)
            return res.status(404).json({message:'Post not found'});
        const comments=await Comment.find({post_id: post.id});
        if(comments==null)
            return res.status(404).json({message:'No comments found'});
        return res.status(200).json(comments);
    }catch(error: any){
        return res.status(500).json({message:error.message});
    }
};



export default {CreateComment,DeleteComment,GetAllCommentsOfPost,updateComment,getAllCommentsBySpecificUser};