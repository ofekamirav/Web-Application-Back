const Posts = require('../models/posts_model');

const getAllPosts = async (req, res) => {
    try {
        const posts = await Posts.find();
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createPost = async (req, res) => {
    const post = new Posts({
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
        const deletedPost = await Posts.findByIdAndDelete(req.params.id);
        if (!deletedPost) {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.status(200).json({ message: 'Post deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllPosts,
    createPost,
    deletePost
};