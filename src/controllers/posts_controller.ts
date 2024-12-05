import Post from "../models/posts_model"
import { Request,Response} from 'express';

const getAllPosts = async (req:Request, res:Response) => {
    try {
        const posts = await Post.find();
        console.log(posts);
        res.status(200).json(posts);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

const createPost = async (req:Request, res:Response) => {
    const post = new Post({
        title: req.body.title,
        content: req.body.content,
        owner: req.body.owner
    });

    try {
        const newPost = await post.save();
        res.status(201).json(newPost);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};


const deletePost = async (req:Request, res:Response) => {
    try {
        const deletedPost = await Post.findByIdAndDelete(req.params.id);
        if (!deletedPost) {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.status(200).json({ message: 'Post deleted' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

//Handler to get a specific post by id
const getPostById= async (req:Request,res:Response)=>{
    const id= req.params.id;
    try{
        const post=await Post.findById(id);
        console.log(post); 
        if(post==null)
            return res.status(404).json({message:'Post not found'});
        return res.status(200).json(post);
    }
    catch(error: any){
        return res.status(500).json({message:error.message});   
    }
};

//Handler to get all the posts that published by the same owner
const getPostsByOwner= async (req:Request,res:Response)=>{
    try{
        const owner = req.query.owner;
        if (!owner) {
            return res.status(400).json({ message: 'Owner ID is required' });
        }
        const posts=await Post.find({owner: owner});
        if(posts==null)
            return res.status(404).json({message:'No posts found'});
        return res.status(200).json(posts);
    }catch(error: any)
    {
        return res.status(500).json({message:error.message});
    }
};



//Handler to update a specific post and we will find the post by id
const UpdatePost=async(req:Request,res:Response)=>{
    try{
        const post=await Post.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true});
        console.log(req.body);
        if(post==null)
            return res.status(404).json({message:'Post not found'});
        return res.status(200).json(post);
    } catch(error: any){
        return res.status(500).json({message:error.message});   
    }
};


export default {getPostById,
    UpdatePost, 
    getAllPosts,
    createPost,
    deletePost,
    getPostsByOwner};