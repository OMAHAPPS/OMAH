require('dotenv').config()

const express = require('express')
const { createServer } = require('node:http')
const { Server } = require('socket.io')
const passport = require('passport')
const cookieSession = require('cookie-session')
const methodOverride = require('method-override')
const flash = require('connect-flash')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

const passportSetup = require('./config/passport-config')

const { GoogleGenAI } = require('@google/genai')

const Omaruser = require('./models/omahUsers')
const Post = require('./models/posts')

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

    const allUsers = await Omaruser.find()

    const postDataArray = []

    allPosts.forEach((post) => {

        const userId = post.userId

        const posterInfoArray = allUsers.filter((user) => user.id == userId )
         const posterInfo = posterInfoArray[0]

        const newPostObject = {
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
                userDP: posterInfo.userDP
            }

        }

         postDataArray.push(newPostObject)
        
    })
    // console.log(postDataArray)



     res.render('home', { user: userData, posts: postDataArray, messages: req.flash('error') })
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

app.post('/post/upload', (req, res) => {
       
         upload(req, res, function (err) {
        
        // Check if the error was triggered by Multer limits/filters
        if (err instanceof multer.MulterError) {
            
            // Map the specific error code to a readable response
            switch (err.code) {
                case 'LIMIT_FILE_SIZE':
                    return res.status(400).json({ 
                        success: false, 
                        error: 'Size Per File exceeded.. (10MB each File)', 
                        message: 'One or more files are larger than the allowed 10MB limit.' 
                    });
                    
                case 'LIMIT_FILE_COUNT':
                    return res.status(400).json({ 
                        success: false, 
                        error: 'Too many files.. (LIMIT 10 files)', 
                        message: 'You cannot upload more than 10 files at once.' 
                    });
                    
                default:
                    return res.status(400).json({ 
                        success: false, 
                        error: 'Upload error.. Try Again', 
                        message: err.message 
                    });
            }
            
        } else if (err) {
            // This catches non-multer errors (like standard code syntax failures)
            return res.status(500).json({ 
                success: false, 
                error: 'Server Error..', 
                message: 'An unexpected error occurred during processing.' 
            });
        }

        // If no errors occurred, the code continues here safely
        res.status(200).json({
            success: true,
            message: 'All files successfully validated and uploaded!',
            filesCount: req.files.length,
            files: req.files
        });
    });
});
      



app.post('/post/cancel', (req, res) => {
     
      const { filepaths } = req.body

      console.log(filepaths)

      filepaths.forEach((filepath) => {


            fs.unlink(`./public/uploads/${filepath}`, (err) => {
                  if (err) {
                      console.log('No file to delete')
                    //   res.json({ success: false})
                      return;
                  } else {
                      console.log(`${filepath} deleted successfully`)
                    }
                })
                
                
            })
            res.json({ success: true })

})



app.post('/post', async (req, res) => {

     const { userid, userrealm, poststring, imagesrc } = req.body
     
     const userData = await Omaruser.findOne({ _id: userid })
     const username = userData.userName

     const postObject = {
                 userId: userid,
                 userName: username,
                 userRealm: userrealm,
                 images: imagesrc,
                 userHandle: 'none',
                 post: poststring
     }
     }
     
     
     const post =  new Post(postObject).save().then((post) => { 
         
         res.json({ success: true })
     }).catch((err) => {

         req.flash('error', 'Sorry...You cannot send Posts now')
         res.redirect('/home')
     })
     

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
       res.render('settings', { user: User, totalPosts: totalPosts })
})

app.get('/inbox', notLoggedInCheck, async (req, res) => {

      res.render('inbox')
})

app.get('/group', notLoggedInCheck, async (req, res) => {

      res.render('group')
})

app.get('/post', notLoggedInCheck, async (req, res) => {
    
    const userid = req.user._id
    const post = await Post.findOne({ image: { $ne: 'none' } })
    const user = await Omaruser.findOne({ _id: userid })


    res.render('post', { post, user })
})

app.get('/user', notLoggedInCheck,  async (req, res) => {
    
    const userid = req.user._id
    const user = await Omaruser.findOne({ _id: userid })
    const posts = await Post.find() 

    res.render('userposts', { posts, user } )
})
