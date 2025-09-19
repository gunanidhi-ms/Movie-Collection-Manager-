
import express from "express";
import {
  MovieCreate,
  MovieDelete,
  MovieDetail,
  MovieIndex,
  MovieUpdate,
  MovieRecommend,
  MovieStats,
} from "../controllers/movies.controller.js";

const router = express.Router();
// Movie stats endpoint
router.get("/stats", MovieStats);
// Recommendation chatbot endpoint
router.post("/recommend", MovieRecommend);

//C - For creating
router.post("/", MovieCreate);

//R - For Reading
router.get("/", MovieIndex);
//For getting particular id
router.get("/:id", MovieDetail);

//U - For Updating
router.put("/:id", MovieUpdate);

//D - For Deleting
router.delete("/:id", MovieDelete);

export default router;
