const express = require('express');
const router = express.Router();
const commentsController=require('../controllers/comments_controller');

//routing all the comments requests to the relevant handler
router.post('/',commentsController.CreateComment);
router.delete('/:id',commentsController.DeleteComment);
router.get('/:id',commentsController.GetAllCommentsOfPost);
router.put('/:id',commentsController.updateComment);
router.get('/:owner',commentsController.getAllCommentsBySpecificUser);




module.exports = router;

