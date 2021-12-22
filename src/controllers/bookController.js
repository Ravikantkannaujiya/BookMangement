const userModel = require('../models/userModel')
const bookModel = require('../models/bookModel')
const mongoose = require('mongoose')
const aws = require("aws-sdk");
const reviewModel = require('../models/reviewModel')

aws.config.update({
    accessKeyId: "AKIAY3L35MCRRMC6253G",  // id
    secretAccessKey: "88NOFLHQrap/1G2LqUy9YkFbFRe/GNERsCyKvTZA",  // like your secret password
    region: "ap-south-1" // Mumbai region
  });
  
  
  // this function uploads file to AWS and gives back the url for the file
  let uploadFile = async (file) => {
    return new Promise(function (resolve, reject) { // exactly 
      
      // Create S3 service object
      let s3 = new aws.S3({ apiVersion: "2006-03-01" });
      var uploadParams = {
        ACL: "public-read", // this file is publically readable
        Bucket: "classroom-training-bucket", // HERE
        Key: "RaviKantkannaujiya/Book/" + file.originalname, // HERE    "pk_newFolder/harry-potter.png" pk_newFolder/harry-potter.png
        Body: file.buffer, 
      };
  
      // Callback - function provided as the second parameter ( most oftenly)
      s3.upload(uploadParams , function (err, data) {
        if (err) {
          return reject( { "error": err });
        }
        console.log(data)
        console.log(`File uploaded successfully. ${data.Location}`);
        return resolve(data.Location); //HERE 
      });
    });
  };
  
  
  // let url= await s3.upload(file)
  //  let book = await bookModel.save(bookWithUrl)
  //  let author = await authorModel.findOneandupdate(....)
  
  
  
  // s3.upload(uploadParams , function (err, data) {
  //     if (err) {
  //       return reject( { "error": err });
  //     }
  //     bookModel.save( bookDateWithUrl, function (err, data) {
      //  if (err) return err
              // authorModel.save( bookDateWithUrl, function (err, data) {
          // 
  // }
      // )
  //   });
  
  
  
  const coverBook =async function (req, res) {
    try {
      let files = req.files;
      if (files && files.length > 0) {
        //upload to s3 and return true..incase of error in uploading this will goto catch block( as rejected promise)
        let uploadedFileURL = await uploadFile( files[0] ); // expect this function to take file as input and give url of uploaded file as output 
        res.status(201).send({ status: true, data: uploadedFileURL });
  
      } 
      else {
        res.status(400).send({ status: false, msg: "No file to write" });
      }
  
    } 
    catch (e) {
      console.log("error is: ", e);
      res.status(500).send({ status: false, msg: "Error in uploading file to s3" });
    }
  
  }



const isValid = function(value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true
}

const isValidRequestBody = function(requestBody) {
    return Object.keys(requestBody).length > 0
}

const isValidObjectId = function(objectId) {
    return mongoose.Types.ObjectId.isValid(objectId)
}

// Api 3    **  *************** Create book **************

const createbook = async function(req, res) {
    try {
        let id = req.body.userId
        let decodedId = req.decodedtoken
        if (id == decodedId) {
            const requestBody = req.body;
            if (!isValidRequestBody(requestBody)) {
                res.status(400).send({ status: false, Message: "Invalid request parameters, Please provide book details" })
                return
            }
            let { title, excerpt, userId, ISBN, category, subcategory, releasedAt,coverImage} = requestBody
            //validation start
            if (!isValid(title)) {
                res.status(400).send({ status: false, msg: "tilte is required" })
            }
            // title =title.trim()
            const isTitleAlreadyExsit = await bookModel.findOne({ title })
            if (isTitleAlreadyExsit) {
                res.status(400).send({ msg: "title already exsist" })
                return
            }
            if (!isValid(excerpt)) {
                res.status(400).send({ status: false, msg: "excerpt is required" })
                return
            }
            if (!isValid(userId)) {
                res.status(400).send({ status: false, msg: "userId is required" })
                return
            }
            if (!isValidObjectId(userId)) {
                res.status(400).send({ status: false, msg: "userId is invalid" })
                return
            }
            if (!isValid(ISBN)) {
                res.status(400).send({ status: false, msg: "ISBN is required" })
                return
            }
            //  ISBN = ISBN.trim()
            const isISBNalreadyExsist = await bookModel.findOne({ ISBN })
            if (isISBNalreadyExsist) {
                res.status(400).send({ msg: "ISBN already exsist" })
                return
            }
            if (!isValid(category)) {
                res.status(400).send({ status: false, message: "category is required" })
                return
            }
            if (!isValid(subcategory)) {
                res.status(400).send({ status: false, message: "subcategory is required" })
                return
            }

            if (!isValid(releasedAt)) {
                res.status(400).send({ status: false, message: "releasedAt is required" })
                return
            }
            if (!(/^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/.test(releasedAt))) {
                res.status(400).send({ status: false, message: `${releasedAt} is invalid format, please enter date in YYYY-MM-DD format` })
                return
            }


            //^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$

            const isUserExist = await userModel.findOne({ userId })

            if (!isUserExist) {
                res.status(404).send({ status: false, message: "User doesn't exist" })
            }
            if (!isValid(coverImage)) {
                res.status(400).send({ status: false, message: "coverImage is required" })
                return
            }

            requestBody.releasedAt = new Date(requestBody.releasedAt)
            const reviews = 0
            const bookDetails = { title, excerpt, userId, ISBN, category, subcategory, reviews, releasedAt,coverImage }
            const createBook = await bookModel.create(bookDetails)
            res.status(201).send({ status: true, message: "Success", data: createBook })
        } else {
            res.status(401).send({ status: false, message: "Unauthorized access, Invalid User Id" })
        }
    } catch (err) {
        console.log(err)
        res.status(500).send({ status: false, msg: err.message })

    }
}

//API 4- Get Books

const getBooksByFilter = async function(req, res) {
    try {
        const filterQuery = { isDeleted: false, deletedAt: null }
        const queryParams = req.query

        if (isValidRequestBody(queryParams)) {
            const { userId, category, subcategory } = queryParams


            if (isValid(userId) && isValidObjectId(userId)) {
                filterQuery['userId'] = userId
            }

            if (isValid(category)) {
                filterQuery['category'] = category.trim()
            }

            if (isValid(subcategory)) {
                filterQuery['subcategory'] = subcategory.trim()
            }

        }
        const books = await bookModel.find(filterQuery).select({ _id: 1, title: 1, excerpt: 1, userId: 1, category: 1, subcategory: 1, releasedAt: 1, reviews: 1 }).sort({ title: 1 })

        if (Array.isArray(books) && books.length === 0) {
            res.status(404).send({ status: false, message: 'No books found which matches the filters' })
            return
        }
        // const sortBooks = books.sort(function(a, b) { return a.title - b.title }) // Sorting a-z

        res.status(200).send({ status: true, message: 'Book List', data: books })

    } catch (error) {
        res.status(500).send({ Status: false, Message: error.message })
    }
}

//API 5 - get books by ID along with reviews

let getBooksByID = async function(req, res) {
    try {
        const bookFromParams = req.params.bookId.trim()

        if (!isValidObjectId(bookFromParams)) {
            res.status(400).send({ status: false, Message: "Please provide a valid book id" })
        }

        if (bookFromParams) {
            let Book = await bookModel.findOne({ _id: req.params.bookId, isDeleted: false })
            if (!Book) {
                res.status(404).send({ status: false, msg: 'Book not found ' })
            } else {
                let bookData = {
                    bookId: Book._id,
                    title: Book.title,
                    excerpt: Book.excerpt,
                    userId: Book.userId,
                    category: Book.category,
                    subcategory: Book.subcategory,
                    reviews: Book.reviews,
                    deletedAt: "",
                    reviewsData: []
                }
                let reviewsData = await reviewModel.find({ bookId: Book._id, isDeleted: false }, '-bookId -isDeleted  -releasedAt -createdAt -updatedAt -__v')
                    // console.log(reviewsData)
                if (reviewsData) {
                    bookData.reviewsData = reviewsData
                }
                res.status(201).send({ status: true, data: bookData })
            }
        } else {
            res.status(400).send({ status: false, msg: "BookID must be present in the request parameters" })
        }
    } catch (error) {
        res.status(500).send({ staus: false, msg: error.message })
    }
}

//API 6 Update books by ID (PUT Books)
const updateBookWithNewFeatures = async function(req, res) {
    try {
        let requestBody = req.body
        let bookId = req.params.bookId
        let unchangedBook = await bookModel.find({ _id: bookId }).select({ _id: 1, title: 1, excerpt: 1, userId: 1, category: 1, releasedAt: 1, reviews: 1 })
        let fliterForUpdate = { _id: bookId, userId: req.decodedtoken, isDeleted: false }

        if (!isValidRequestBody(requestBody)) {
            res.status(200).send({ Message: "No updates applied, book data is unchanged", data: unchangedBook })
        }

        let { title, excerpt, releasedAt, ISBN } = requestBody

        if (title) {
            if (!isValid(title)) {
                return res.status(400).send({ status: false, message: 'Please provide a valid title' })
            }
        }

        if (excerpt) {
            if (!isValid(excerpt)) {
                return res.status(400).send({ status: false, message: 'Please provide a valid excerpt' })
            }
        }

        if (ISBN) {
            if (!isValid(ISBN)) {
                return res.status(400).send({ status: false, message: 'Please provide a valid ISBN' })
            }
        }

        if (releasedAt) {
            if (!isValid(releasedAt)) {
                return res.status(400).send({ status: false, message: 'Please provide a valid release date' })
            }

            if (!(/^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/.test(releasedAt))) {
                res.status(400).send({ status: false, message: `${releasedAt} is invalid format, please enter date in YYYY-MM-DD format` })
                return
            }
        }

        let updatedBookData = await bookModel.findOneAndUpdate(fliterForUpdate, requestBody, { new: true }).select({ _id: 1, title: 1, excerpt: 1, userId: 1, category: 1, releasedAt: 1, reviews: 1 })

        if (updatedBookData) {
            res.status(201).send({ status: true, message: "Book updated successfully", data: updatedBookData })
            return
        } else {
            res.status(401).send({ status: false, message: "Either your book is deleted or you are not an authorized user" })
        }
    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message });
    }
};

//API 7 - Delete books by ID

let deleteBookById = async function(req, res) {
    try {
        let bookId = req.params.bookId.trim()

        if (!isValidObjectId(bookId)) {
            res.status(400).send({ status: false, Message: "Please provide a valid book id" })
        }

        let filterForDelete = { _id: bookId, userId: req.decodedtoken, isDeleted: false }
        let deletedBook = await bookModel.findOneAndUpdate(filterForDelete, { isDeleted: true, deletedAt: new Date() }, { new: true })
        if (deletedBook) {
            res.status(200).send({ status: true, Message: "Book deleted successfully", data: deletedBook })
        } else {
            res.status(400).send({ status: false, message: "Cannot find book!, book is deleted already or you are not an authorized user to delete this book" })
        }
    } catch (error) {
        res.status(500).send({ status: false, msg: error.message })
    }
}

module.exports = { createbook, getBooksByFilter, getBooksByID, updateBookWithNewFeatures, deleteBookById,coverBook }