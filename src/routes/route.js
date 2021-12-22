const express = require('express');
const userController = require('../controllers/userController')
const bookController = require('../controllers/bookController')
const reviewController = require('../controllers/reviewController')
const mid = require('../middleware/mid.js')
const router = express.Router();

module.exports = router;

//User Routes
router.post("/register", userController.registerUser)
router.post("/login", userController.loginUser)

//Book Routes
router.post("/createbook", mid.userAuth, bookController.createbook)

router.post("/write-file-aws", bookController.coverBook)

router.get("/books", mid.userAuth, bookController.getBooksByFilter)
router.get("/books/:bookId", mid.userAuth, bookController.getBooksByID)
router.put("/books/:bookId", mid.userAuth, bookController.updateBookWithNewFeatures)
router.delete("/books/:bookId", mid.userAuth, bookController.deleteBookById)

//Review Routes
router.post("/books/:bookId/review", reviewController.newReview)
router.put("/books/:bookId/review/:reviewId", reviewController.updateReview)
router.delete("/books/:bookId/review/:reviewId", reviewController.deleteReview)