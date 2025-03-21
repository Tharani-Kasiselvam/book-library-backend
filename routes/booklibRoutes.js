import { addBook, deleteBook, fetchBookById, fetchBooks, fetchUser, login, logout, searchBook, signup, updateBook } from "../contorllers/ModuleControllers.js"
import express from 'express'

const router = express.Router()

router.post('/signup',signup)
router.post('/login',login)
router.get('/fetch-user',fetchUser)

router.post("/add-book",addBook)
router.get("/fetch-books",fetchBooks)
router.get("/fetch-book/:id",fetchBookById)
router.get("/search",searchBook)

router.post("/update-book/:id",updateBook)

router.delete("/delete-book/:id",deleteBook)

router.post('/logout',logout)

export default router