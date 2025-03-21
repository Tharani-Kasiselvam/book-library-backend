import express from "express"
import dotenv from 'dotenv'
import { connecToDB } from "./config/db.js"
import cors from 'cors'
import cookieParser from "cookie-parser"
import morgan from "morgan"
import booklibRoutes from './routes/booklibRoutes.js'

dotenv.config()


const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({origin: process.env.CLIENT_URL, credentials: true }))
app.use(cookieParser())
app.use(express.json({ limit: "20mb" }))
app.use(morgan('dev'))

app.get("/", (req, res)=>{
    res.send("Hello World")
})

//routes
app.use('/api/v1',booklibRoutes)

app.listen(PORT, async()=>{
    await connecToDB()
    console.log(`Server started at : http://localhost:${PORT}`)
})