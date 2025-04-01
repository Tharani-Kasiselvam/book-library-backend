
import User from "../models/user.model.js";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import Book from "../models/book.model.js";
import { v2 as cloudinary } from "cloudinary";


cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
  });

export const signup = async (req, res) => {
    const {username, email, password} = req.body

    try {
        if(!username || !email || !password)
            throw new Error("All fields required")

        const emailExists = await User.findOne({email})

        if(emailExists)
            return res.status(400).json({message: "User already exists"})

        const usrnameExists = await User.findOne({username})

        if(usrnameExists)
            return res.status(400).json({message: "User name is already available, try another Name"})

        //Hash the password
        const hashedPwd = await bcrypt.hash(password, 2)

        const userData = await User.create({
            username,
            email,
            password : hashedPwd
        })

        //JWT
        if(userData){
            const token = jwt.sign({id : userData._id}, 
                process.env.JWT_SECRET, {expiresIn:'7d'})

            res.cookie("token", token, {
                httpOnly : true,
                secure : process.env.MODE_ENV === "production",
                sameSite : "strict",
                maxAge : 7 * 24 * 60 * 60 * 1000
            })
        }

        return res.status(200).json({user : userData, message: "User created successfully"})

    } catch (error) {
        res.status(400).json({message: error.message})
    }
}

export const login = async (req,res)=>{
    const {email, password} = req.body

    try {
       const userData = await User.findOne({email})
       
       if(!userData)
            return res.status(400).json({message:"Invalid Credentatials"})
       
       const usrPwd = userData.password
       console.log(userData)

       //compare the Hash password
       const isPasswordValid = await bcrypt.compareSync(password,usrPwd)

       console.log(isPasswordValid)

       if(!isPasswordValid){
        return res.status(400).json({message: "Invalid credentails"})
       }

       //jwt
       if (userData) {
        const token = jwt.sign({ id: userData._id }, process.env.JWT_SECRET, {
          expiresIn: "7d",
        });
  
        res.cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          // sameSite: "strict",
          sameSite: "None",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
      }

      return res.status(200)
      .json({user : userData,
        message:"Logged in successfully"})

    } catch (error) {
        return res.send(400).json({message:error.message})
    }
}

export const fetchUser = async (req,res)=>{
    const {token} = req.cookies

    if(!token)
        return res.status(400).json({message:"No token provided"})

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        if(!decoded)
            return res.status(400).json({message:"Invalid Token"})

        const userData = await User.findById(decoded.id)

        if(!userData)
            return res.status(400).json({message:"User not Found"})

        return res.status(200).json({user : userData})

    } catch (error) {
        return res.status(400).json({message: error.message})
    }
}

export const logout = async (req,res) =>{
    res.clearCookie("token")
    res.status(200).json({message:"Logged out successfully"})
}

//********Book Functionalities******
export const addBook = async (req,res)=>{
    const { image, title, subtitle, author, link, review } = req.body;
    const { token } = req.cookies;
    console.log(req.body)
    if (!token) {
      return res.status(401).json({ message: "No token provided." });
    }
    try {
      // Image processes
      const imageResponse = await cloudinary.uploader.upload(image, {
        folder: "/BookLib",
      });
  
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
      if (!decoded) {
        return res.status(401).json({ message: "Invalid token" });
      }
  
      const userData = await User.findById(decoded.id)
  
      const book = await Book.create({
        image: imageResponse.secure_url,
        title,
        subtitle,
        author,
        link,
        review,
        user: userData,
      });
      return res.status(200).json({ book, message: "Book added successfully." });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
}

export const fetchBooks = async (req,res)=>{
  try {
    const books = await Book.find().sort({ createdAt: -1 });

    return res.status(200).json({ books });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export const fetchBookById = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.findById(id).populate("user", ["username"]);
    return res.status(200).json({ book });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export const searchBook = async (req, res) => {
  try {
    const searchTerm = req.query.searchTerm || "";
    console.log("Search: ", searchTerm);
    const books = await Book.find({
      title: { $regex: searchTerm, $options: "i" },
    }).sort({ createdAt: -1 });

    return res.status(200).json({ books });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export const deleteBook = async (req, res) => {
  const { id } = req.params;
  const { token } = req.cookies;
  if (!token) {
    return res.status(401).json({ message: "No token provided." });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const book = await Book.findById(id);

    // Delete the image first
    const parts = book.image.split("/");
    const fileName = parts[parts.length - 1]; // Extract the last part: "ihwklaco9wt2d0kqdqrs.png"
    const imageId = fileName.split(".")[0];
    cloudinary.uploader
      .destroy(`BookLib/${imageId}`)
      .then((result) => console.log("result: ", result));

    // Then delete from database
    await Book.findByIdAndDelete(id);

    return res.status(200).json({ message: "Book deleted successfully." });
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ message: error.message });
  }
}

  export const updateBook = async (req, res) => {
    const { image, title, subtitle, author, link, review } = req.body;
  const { token } = req.cookies;
  if (!token) {
    return res.status(401).json({ message: "No token provided." });
  }
  const { id } = req.params;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(401).json({ message: "Invalid token" });
    }
    const book = await Book.findById(id);

    if (image) {
      // Delete the previous one first
      const parts = book.image.split("/");
      const fileName = parts[parts.length - 1]; // Extract the last part: "ihwklaco9wt2d0kqdqrs.png"
      const imageId = fileName.split(".")[0];
      cloudinary.uploader
        .destroy(`BookLib/${imageId}`)
        .then((result) => console.log("result: ", result));

      // Then upload the new one
      const imageResponse = await cloudinary.uploader.upload(image, {
        folder: "/BookLib",
      });

      const updatedBook = await Book.findByIdAndUpdate(id, {
        image: imageResponse.secure_url,
        title,
        subtitle,
        author,
        link,
        review,
      });

      return res
        .status(200)
        .json({ book: updatedBook, message: "Book updated successfully." });
    }

    const updatedBook = await Book.findByIdAndUpdate(id, {
      title,
      subtitle,
      author,
      link,
      review,
    });

    return res
      .status(200)
      .json({ book: updatedBook, message: "Book updated successfully." });
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ message: error.message });
  }
}


