//Import Post Model
const Post = require('../models/posts_model');

//Handler to get a specific post by id
const getPostById= async (req,res)=>{
    try{
        const post=await Post.findById(req,params.id);
        if(post==null)
            return res.status(404).json({message:'Post not found'});
        return res.status(200).json(post);
    }
    catch(error){
        return res.status(500).json({message:error.message});   
    }
};
//Handler to update a specific post and we will find the post by id
const UpdatePost=async(req,res)=>{
    try{
        const post=await Post.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true});
        if(post==null)
            return res.status(404).json({message:'Post not found'});
        return res.status(200).json(post);
    } catch(error){
        return res.status(500).json({message:error.message});   
    }
};







module.exports={getPostById, UpdatePost};