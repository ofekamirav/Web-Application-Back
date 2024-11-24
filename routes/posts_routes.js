const express = require('express');
const router = express.Router();
const postsController = require('../controllers/posts_controller');

//routing all the posts requests to the relevant handler
router.get('/', (req, res, next) => {
    if (req.query.owner) {
        return postsController.getPostsByOwner(req, res, next);
    } else {
        return postsController.getAllPosts(req, res, next);
    }
});
router.post('/', postsController.createPost);
router.put('/:id',postsController.UpdatePost);
router.delete('/:id', postsController.deletePost);
router.get('/:id',postsController.getPostById);

module.exports = router;