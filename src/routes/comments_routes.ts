import express from "express";
const router = express.Router();
import commentsController from "../controllers/comments_controller"
//routing all the comments requests to the relevant handler
router.post('/', (req,res)=>{
    commentsController.CreateComment(req,res);  
});
router.delete('/:id', (req,res) => {
    commentsController.DeleteComment(req,res);
});
router.get('/:id', (req,res)=>{
    commentsController.GetAllCommentsOfPost(req,res);
});
router.put('/:id', (req,res)=>{
    commentsController.updateComment(req,res);
});
router.get('/:owner', (req,res)=>{  
    commentsController.getAllCommentsBySpecificUser(req,res);
});


export default router;
