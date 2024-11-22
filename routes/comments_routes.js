const express = require('express');
const router = express.Router();
const commentsController=require('../controllers/comments_controller');

//routing all the comments requests to the relevant handler
router.put('/',commentsController.CreateComment);
router.delete('/:id',commentsController.DeleteComment);







module.exports = router;

