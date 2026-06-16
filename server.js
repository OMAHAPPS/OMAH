require('dotenv').config()

const express = require('express')
const { createServer } = require('node:http')
const { Server } = require('socket.io')
const passport = require('passport')
const cookieSession = require('cookie-session')
const methodOverride = require('method-override')
const flash = require('connect-flash')
const multer = require('multer')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')

const passportSetup = require('./config/passport-config')

const { GoogleGenAI } = require('@google/genai')

const Omaruser = require('./models/omahUsers')
const Post = require('./models/posts')
const Reply = require('./models/replies')

const googleRoutes = require('./routes/auth-routes')



const app = express()
const server = createServer(app)
const mongoose = require('mongoose')

const PORT = 4000

const dbURI = process.env.MONGODB_URI



// MIDDLEWARE

app.use(express.static('public'))
app.use(express.static('public/uploads'))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cors())
app.set('view engine', 'ejs')

app.use(cookieSession({
      maxAge: 24 * 60 * 60 * 1000,
      keys: [ process.env.COOKIE_KEY ]
}))

app.use(passport.initialize())
app.use(passport.session())

app.use(methodOverride('_method'))

app.use(flash())

const realmCheck = (req, res, next) => {
    if (req.user.userRealm !== 'none') {
        res.redirect('/home')
    } else {
        next()
    }
}


// ROUTES


app.use('/auth', googleRoutes)



// CONNECT TO DB
mongoose.connect(dbURI)
.then(() => {
    console.log('Connected to Database')
    server.listen(PORT, () => { 
        console.log(`Server is running on port ${PORT}`)
    })
})
.catch(err => console.log(err))

const io = new Server(server)

io.on('connection', (socket) => {
    console.log(`New Socket ${socket.id} Mounted on port ${PORT}`)
})

const loginCheck = (req, res, next) => {

     if (req.user) {
        res.redirect('/home')
     } else {
        next()
     }
}

const notLoggedInCheck = (req, res, next) => {

      if (!req.user) {

        res.redirect('/')
      } else {
        next()
      }
}





app.get('/', loginCheck, (req, res) => {
      res.render('arrive')
})

app.get('/main', notLoggedInCheck, (req, res) => {

   res.render('pickrealm')

})

app.patch('/main', async (req, res) => {

    const userId = req.user._id
    const { realm, rcol, ainame } = req.body

    try {
        
        await Omaruser.findByIdAndUpdate({ _id: userId }, { $set: { userRealm: realm, userColor: rcol, aiName: ainame } })
    
        res.redirect('/home')

    } catch (error) {

        req.flash('error', 'Sorry...You cannot update your Realm now')
        res.redirect('/home')
        
    }

})

app.get('/home', notLoggedInCheck, async (req, res) => {

    const id = req.user._id

    const userData = await Omaruser.findOne({ _id: id })

    const allPosts = await Post.find()
    
    // const allPosts = allPostsNS.sort((a, b) =>  b.createdAt - a.createdAt )

    const requiredUsseArray = allPosts.map((post) => post.userId)
    
    const allUsers = await Omaruser.find({ _id: { $in: requiredUsseArray  } }).select('totalFollowers totalFollowing totalPosts userDP userHandle')
    
     const postDataArray = []

     allPosts.forEach((post) => {

          const userId = post.userId

          const posterInfoArray = allUsers.filter((user) => user.id == userId )
          const posterInfo = posterInfoArray[0]
         
         const newPostObject = {
             postId: post._id,
             createdAt: post.createdAt,  
             videoUrl: post.videoUrl,
             images: post.images,
             likes: post.likes,
             interactions: post.interactions,
             replies: post.replies,
             userHandle: post.userHandle,
             post: post.post,
             userName: post.userName,
             poster: {
                 totalFollowers: posterInfo.totalFollowers,
                 totalFollowing: posterInfo.totalFollowing,
                 totalPosts: posterInfo.totalPosts,
                 userDP: posterInfo.userDP,
                 userHandle: posterInfo.userHandle
             }

         }

       postDataArray.push(newPostObject)
        

        
        
     })


     const R2BaseUrl = process.env.R2_PUBLIC_BASE_URL 

    res.render('home', { user: userData, posts: postDataArray, R2BASE: R2BaseUrl, messages: req.flash('error') })


})

app.get('/post/:id', notLoggedInCheck, async (req, res) => {
    
    const postId = req.params.id
    const userid = req.user._id
    const optionalQuery = req.query.post       // to carry userId which was routed from 
    const post = await Post.findOne({ _id: postId })
    const posterId = post.userId
    const posterData = await Omaruser.findOne({ _id: posterId })
    const user = await Omaruser.findOne({ _id: userid })
    const replies = await Reply.find({ postId: postId })

    const requiredUserArray = replies.map((reply) => reply.userId)

  const allUsers = await Omaruser.find({ _id: { $in: requiredUserArray  } }).select('_id totalFollowers totalFollowing totalPosts userName userDP userHandle')
    
     const replyDataArray = []
     

     replies.forEach((reply) => {

          const userId = reply.userId

          const posterInfoArray = allUsers.filter((user) => user.id == userId )
          const posterInfo = posterInfoArray[0]
         
         const newReplyObject = {
             replyId: reply._id,
             createdAt: reply.createdAt,  
             videoUrl: reply.videoUrl,
             images: reply.images,
             likes: reply.likes,
             interactions: reply.interactions,
             reply: reply.replystring,
             author: {
                 totalFollowers: posterInfo.totalFollowers,
                 totalFollowing: posterInfo.totalFollowing,
                 totalPosts: posterInfo.totalPosts,
                 userDP: posterInfo.userDP,
                 userName: posterInfo.userName,
                 userHandle: posterInfo.userHandle,
                 userId: posterInfo._id
             }

         }

       replyDataArray.push(newReplyObject)  
       
    })

    const R2BaseUrl = process.env.R2_PUBLIC_BASE_URL 

    res.render('post', { post, user, poster: posterData, replies: replyDataArray, R2BASE: R2BaseUrl, query: optionalQuery })

})

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/uploads')
    },
    filename: (req, file, cb) => {
        cb(null, `${path.basename(file.originalname, path.extname(file.originalname))}-${Date.now()}${path.extname(file.originalname)}`)
    }
})

const upload = multer({storage: storage, limits : { fileSize: 10 * 1024 * 1024, files: 10 } }).array('files')

// app.post('/post/upload', (req, res) => {
       
//          upload(req, res, function (err) {
        
//         // Check if the error was triggered by Multer limits/filters
//         if (err instanceof multer.MulterError) {
            
//             // Map the specific error code to a readable response
//             switch (err.code) {
//                 case 'LIMIT_FILE_SIZE':
//                     return res.status(400).json({ 
//                         success: false, 
//                         error: 'Size Per File exceeded.. (10MB each File)', 
//                         message: 'One or more files are larger than the allowed 10MB limit.' 
//                     });
                    
//                 case 'LIMIT_FILE_COUNT':
//                     return res.status(400).json({ 
//                         success: false, 
//                         error: 'Too many files.. (LIMIT 10 files)', 
//                         message: 'You cannot upload more than 10 files at once.' 
//                     });
                    
//                 default:
//                     return res.status(400).json({ 
//                         success: false, 
//                         error: 'Upload error.. Try Again', 
//                         message: err.message 
//                     });
//             }
            
//         } else if (err) {
//             // This catches non-multer errors (like standard code syntax failures)
//             return res.status(500).json({ 
//                 success: false, 
//                 error: 'Server Error..', 
//                 message: 'An unexpected error occurred during processing.' 
//             });
//         }

//         // If no errors occurred, the code continues here safely
//         res.status(200).json({
//             success: true,
//             message: 'All files successfully validated and uploaded!',
//             filesCount: req.files.length,
//             files: req.files
//         });
//     });
// });

const s3 = new S3Client({
       region: "auto",  // required by aws sdk not by R2  
       endpoint: process.env.S3CLIENT_ENDPOINT,
       credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
       }
})

// Request PRESIGNED URLS

app.post('/gen-upload-urls', async (req, res) => {

      const files = req.body.files

      try {

        const uploadData = await Promise.all(files.map( async (file) => {

               const uniqueKey = `feed-images/${Date.now()}-${file.name}`
               const command = new PutObjectCommand({
                 Bucket: process.env.R2_BUCKET_NAME,
                 Key: uniqueKey,
                 ContentType: file.type
               })
               const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 })
            

               return {
                  filename: file.name,
                  key: uniqueKey,
                  signedUrl: signedUrl,
                  publicUrl: `${process.env.R2_PUBLIC_BASE_URL}/${uniqueKey}`
               }
        }))

        res.json(uploadData)
        
        
      } catch (error) {
          
         console.log(error)
         res.status(500).json({ error: 'Failed to Generate Urls' })
      }
})
app.post('/gen-upload-url-video', async (req, res) => {

    const file = req.body.file
    const userId = req.user._id

    try {

        const uniqueKey = `feed-images/videos/posts/${userId}/${Date.now()}-${file.name}`
        const command = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: uniqueKey,
            ContentType: file.type
        })
        const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 })

        const uploadData =  {
                     filename: file.name,
                     key: uniqueKey,
                     signedUrl: signedUrl,
                     publicUrl: `${process.env.R2_PUBLIC_BASE_URL}/${uniqueKey}`
                    }

           res.json(uploadData)
        
    } catch (error) {

        res.status(500).json({ error: 'Failed to Generate Urls' })
        
    }

})

app.post('/gen-upload-url-reply-video', async (req, res) => {

     const { file } = req.body
     const userId = req.user._id

     try {
        
         const uniqueKey = `feed-images/videos/replies/${userId}/${Date.now()}-${file.name}`
         const command = new PutObjectCommand({
              Bucket: process.env.R2_BUCKET_NAME,
              Key: uniqueKey,
              ContentType: file.type
         })
         const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 })
    
         const uploadUrl = {
              filename: file.name,
              key: uniqueKey,
              signedUrl: signedUrl,
              publicUrl: `${process.env.R2_PUBLIC_BASE_URL}/${uniqueKey}`
         }

         res.json(uploadUrl)

     } catch (error) {

        res.status(500).json({ error: 'Failed to Gen UploadUrl' })
        
     }


})

app.post('/gen-upload-urls-reply-images', async (req, res) => {

      const files = req.body.files

      try {

        const uploadData = await Promise.all(files.map( async (file) => {

               const uniqueKey = `feed-images/reply-images/${Date.now()}-${file.name}`
               const command = new PutObjectCommand({
                 Bucket: process.env.R2_BUCKET_NAME,
                 Key: uniqueKey,
                 ContentType: file.type
               })
               const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 })
            

               return {
                  filename: file.name,
                  key: uniqueKey,
                  signedUrl: signedUrl,
                  publicUrl: `${process.env.R2_PUBLIC_BASE_URL}/${uniqueKey}`
               }
        }))

        res.json(uploadData)
        
        
      } catch (error) {
          
         console.log(error)
         res.status(500).json({ error: 'Failed to Generate Urls' })
      }

})



app.post('/gen-dp-upload-url', async (req, res) => {

    const { file } = req.body
    const userId = req.user._id

    try {

        const uniqueKey = `feed-images/profile/${userId}/${Date.now()}-${file.name}`
        const command = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: uniqueKey,
            ContentType: file.type
        })
        const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 })
        
        const uploadData = {
             filename: file.name,
             key: uniqueKey,
             signedUrl: signedUrl,
             publicUrl: `${process.env.R2_PUBLIC_BASE_URL}/${uniqueKey}`
        }
        
        res.json(uploadData)

    } catch (error) {

        res.status(500).json({ error: 'Failed to generate Upload Url' })
        
    }

})

app.patch('/update-dp', async (req, res) => {

     const { dpKey } = req.body
     const userId = req.user._id

     try {

        await Omaruser.findByIdAndUpdate({ _id: userId }, { $set: { userDP: dpKey } })

        res.json({ success: true })
        
     } catch (error) {


        res.json({ success: false, error: error.message })
        
     }

})


//  MULTER UNLINK FILES LOGIC ///
// app.post('/post/cancel', (req, res) => {
     
//       const { filepaths } = req.body

//       console.log(filepaths)

//       filepaths.forEach((filepath) => {


//             fs.unlink(`./public/uploads/${filepath}`, (err) => {
//                   if (err) {
//                       console.log('No file to delete')
//                     //   res.json({ success: false})
//                       return;
//                   } else {
//                       console.log(`${filepath} deleted successfully`)
//                     }
//                 })
                
                
//             })
//             res.json({ success: true })

// })



app.post('/post', async (req, res) => {

     const { userid, userrealm, poststring, imagesrc, video } = req.body
     
     const userData = await Omaruser.findOne({ _id: userid })
     const username = userData.userName
     const userHandle = userData.userHandle !== 'none' ? userData.userHandle : 'none'

     const postObject = {
                 userId: userid,
                 userName: username,
                 userRealm: userrealm,
                 videoUrl: video,
                 images: imagesrc,
                 userHandle: userHandle,
                 post: poststring
     }
     
     
     
     const post =  new Post(postObject).save().then((post) => { 
         console.log(`New Post Created By: ${post.userName}`)
         res.json({ success: true, post: post })
     }).catch((err) => {
         console.log(err)
         res.json({ success: false })
     })
     

})

app.patch('/post-update-user', async (req, res) => {

     const { postid } = req.body
     const postCreated = await Post.findOne({ _id: postid })
     const userToUpdateId = postCreated.userId

     try {

        await Omaruser.findByIdAndUpdate({ _id: userToUpdateId }, { $inc: { totalPosts: 1 } })

        res.json({ success: true })
        
     } catch (error) {

      
        res.json({ success: false })
        
     }




})

app.post('/post/reply', async (req, res) => {

    const { replystring, videoUrl, imagesrc, userid, postid } = req.body

    const reply = new Reply({
           userId: userid,
           postId: postid,
           replystring: replystring,
           videoUrl: videoUrl,
           images: imagesrc
    }).save().then((data) => {
         res.json({ success: true })
    }).catch((error) => {
         res.json({ success: false })
    })

})

app.patch('/post-update-reply', async (req, res) => {

      const { postid } = req.body
      const parentPost = await Post.findOne({ _id: postid })
      const currentReplyCount = parentPost.replies
      const currentInteractions = parentPost.interactions
      const newReplyCount = currentReplyCount + 1
      const newInteractions = currentInteractions + 1 

      try {

        await Post.findByIdAndUpdate({ _id: postid }, { $set: { interactions: newInteractions, replies: newReplyCount } })
        
        res.json({ success: true })
        
      } catch (error) {
        console.log(error)

        res.json({ success: false })
        
      }
})

app.get('/ai', notLoggedInCheck, (req, res) => {
    
     const User = req.user

     res.render('ai', { user: User })

})


app.post('/generate', async (req, res) => {

     const { message } = req.body
     
     try {
        
         const ai = new GoogleGenAI(process.env.GEMINI_API_KEY)
    
         async function main() {
    
             const response = await ai.models.generateContent({
                model: `${process.env.GEMINI_MODEL}`,
                contents: message
             })
             const result = response.text
             res.send(result)
         }
    
         await main()

     } catch (error) {

        req.flash('error', 'Sorry...AI is not responding now')
        res.redirect('/home')
        
     }

       
})

app.get('/settings', notLoggedInCheck, async (req, res) => {

       const posts = await Post.find({ userId: req.user._id })
       const totalPosts = posts.length

       const User = req.user
       const R2BASEURL = process.env.R2_PUBLIC_BASE_URL

       res.render('settings', { user: User, R2BASE: R2BASEURL, totalPosts: totalPosts, messages: req.flash('error') })
})

app.get('/inbox', notLoggedInCheck, async (req, res) => {

      res.render('inbox')
})

app.get('/group', notLoggedInCheck, async (req, res) => {

      res.render('group')
})



app.get('/user/:id', notLoggedInCheck,  async (req, res) => {
    
    const userid = req.params.id
    
    const user = await Omaruser.findOne({ _id: userid })
    const userPosts = await Post.find({ userId: userid }) 
    const R2baseUrl = process.env.R2_PUBLIC_BASE_URL

    res.render('userposts', { posts: userPosts, user, R2BASE: R2baseUrl } )
})




app.patch('/handle',  async (req, res) => {

    const { userhandle } = req.body 
    const userId = req.user._id
    console.log(userhandle)
    try {
        
        const updated = await Omaruser.findByIdAndUpdate({ _id: userId }, { $set: { userHandle: userhandle } })
         
        req.flash('error', 'Updated Successful') 
        res.redirect('/settings')

    } catch (error) {

        req.flash('error', 'User Update Failed')
        res.redirect('/settings')
        
    }


})