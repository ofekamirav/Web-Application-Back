import express, { Request, Response } from 'express';
const router = express.Router();
import postsController from "../controllers/posts_controller";

//routing all the posts requests to the relevant handler
router.get('/', async (req, res) => {
    if (req.query.owner) {
         postsController.getPostsByOwner(req, res);
    } else {
         postsController.getAllPosts(req, res);
    }
});
router.post('/', postsController.createPost);

router.put('/:id', (req,res)=>{
    postsController.UpdatePost(req,res);
});

router.delete('/:id', (req,res)=>{
    postsController.deletePost(req,res);
});

router.get('/:id', (req,res)=>{
    postsController.getPostById(req,res);
});


export default router;