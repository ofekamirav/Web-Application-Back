const Comments = require('../models/comment_model');

const updateComment = async (req, res) => {
    const { id } = req.params;
    const { content, owner } = req.body;

    try {
        const updatedComment = await Comments.findByIdAndUpdate(
            id,
            { content, owner },
            { new: true, runValidators: true }
        );

        if (!updatedComment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        res.status(200).json(updatedComment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getAllCommentsBySpecificUser = async (req, res) => {
    const { owner } = req.params;

    try {
        const comments = await Comments.find({ owner });

        if (!comments.length) {
            return res.status(404).json({ message: 'No comments found for this user' });
        }

        res.status(200).json(comments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    updateComment,
    getAllCommentsBySpecificUser
};