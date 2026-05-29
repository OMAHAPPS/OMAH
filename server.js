require('dotenv').config()

const express = require('express')
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
    app.listen(PORT, () => { 
        console.log(`Server is running on port ${PORT}`)
    })
})
.catch(err => console.log(err))

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


     res.render('home', { user: userData, posts: allPosts, messages: req.flash('error') })
})

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/uploads')
    },
    filename: (req, file, cb) => {
        cb(null, `${path.basename(file.originalname, path.extname(file.originalname))}-${Date.now()}${path.extname(file.originalname)}`)
    }
})

const upload = multer({storage: storage })

app.post('/post/upload', upload.single('image'), (req, res) => {

     // console.log(req.file)
        res.json(req.file)
})


app.post('/post/cancel', (req, res) => {
     
      const { file } = req.body
      
      const filePath = path.join(__dirname, 'public', 'uploads', file.filename)
      fs.unlink(`${filePath}`, (err) => {
            if (err) {
                console.log(err)
                res.json({ success: false})
                return;
            } else {
                res.json({ success: true })
                console.log('File deleted successfully')
            }
      })
 
})

app.post('/post/cancel', (req, res) => {
     
      const { file } = req.body
      
      const filePath = path.join(__dirname, 'public', 'uploads', file.filename)
      fs.unlink(`${filePath}`, (err) => {
            if (err) {
                console.log(err)
                res.json({ success: false})
                return;
            } else {
                res.json({ success: true })
                console.log('File deleted successfully')
            }
      })
 
})


app.post('/post', async (req, res) => {

     const { userid, userrealm, poststring } = req.body
     
     const userData = await Omaruser.findOne({ _id: userid })
     const username = userData.userName

     const post =  new Post({
         userId: userid,
         userName: username,
         userRealm: userrealm,
         post: poststring
     }).save().then((post) => {
         
         res.redirect('/home')
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


