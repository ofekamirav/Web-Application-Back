const express = require('express');
const router = express.Router();
const postsController = require('../controllers/posts_controller');

router.get('/', postsController.getAllPosts);
router.post('/', postsController.createPost);
router.put('/:id',postsController.UpdatePost);
router.delete('/:id', postsController.deletePost);
//routing all the posts requests to the relevant handler
router.get('/:id',postsController.getPostById);

module.exports = router;