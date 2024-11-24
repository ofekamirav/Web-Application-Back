const Post = require('../models/posts_model');

const getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find();
        console.log(posts);
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createPost = async (req, res) => {
    const post = new Post({
        title: req.body.title,
        content: req.body.content,
        owner: req.body.owner
    });

    try {
        const newPost = await post.save();
        res.status(201).json(newPost);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


const deletePost = async (req, res) => {
    try {
        const deletedPost = await Post.findByIdAndDelete(req.params.id);
        if (!deletedPost) {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.status(200).json({ message: 'Post deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//Handler to get a specific post by id
const getPostById= async (req,res)=>{
    const id= req.params.id;
    try{
        const post=await Post.findById(id);
        console.log(post); 
        if(post==null)
            return res.status(404).json({message:'Post not found'});
        return res.status(200).json(post);
    }
    catch(error){
        return res.status(500).json({message:error.message});   
    }
};

//Handler to get all the posts that published by the same owner
const getPostsByOwner= async (req,res)=>{
    try{
        const owner = req.query.owner;
        if (!owner) {
            return res.status(400).json({ message: 'Owner ID is required' });
        }
        const posts=await Post.find({owner: owner});
        if(posts==null)
            return res.status(404).json({message:'No posts found'});
        return res.status(200).json(posts);
    }catch(error)
    {
        return res.status(500).json({message:error.message});
    }
};



//Handler to update a specific post and we will find the post by id
const UpdatePost=async(req,res)=>{
    try{
        const post=await Post.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true});
        console.log(req.body);
        if(post==null)
            return res.status(404).json({message:'Post not found'});
        return res.status(200).json(post);
    } catch(error){
        return res.status(500).json({message:error.message});   
    }
};


module.exports={
    getPostById,
    UpdatePost, 
    getAllPosts,
    createPost,
    deletePost,
    getPostsByOwner
};