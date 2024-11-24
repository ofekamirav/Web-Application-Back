const express = require('express');
const router = express.Router();
const postsController = require('../controllers/posts_controller');

//routing all the posts requests to the relevant handler
router.get('/', postsController.getAllPosts);
router.post('/', postsController.createPost);
router.put('/:id',postsController.UpdatePost);
router.delete('/:id', postsController.deletePost);
router.get('/:id',postsController.getPostById);
router.get('/:owner',postsController.getPostsByOwner)

module.exports = router;