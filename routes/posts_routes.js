const express = require('express');
const router = express.Router();
const postsController=require('../controllers/posts_controller');

//routing all the posts requests to the relevant handler
router.get('/:id',postsController.getPostById);
router.put('/:id',postsController.UpdatePost);


module.exports = router;
