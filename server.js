require('dotenv').config()

const express = require('express')
const passport = require('passport')
const cookieSession = require('cookie-session')
const methodOverride = require('method-override')
const flash = require('connect-flash')

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





app.get('/', (req, res) => {
      res.render('arrive')
})

app.get('/main', (req, res) => {

   res.render('pickrealm')

})

app.patch('/main', async (req, res) => {

    const userId = req.user._id
    const { realm, rcol, ainame } = req.body

    await Omaruser.findByIdAndUpdate({ _id: userId }, { $set: { userRealm: realm, userColor: rcol, aiName: ainame } })

    res.redirect('/home')
})

app.get('/home', async (req, res) => {

    const id = req.user._id

    const userData = await Omaruser.findOne({ _id: id })

    const allPosts = await Post.find()


     res.render('home', { user: userData, posts: allPosts, messages: req.flash('error') })
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
         
         console.log(post)
         res.redirect('/home')
     }).catch((err) => {

         req.flash('error', 'Sorry...You cannot send Posts now')
         res.json(err)
         res.redirect('/home')
     })
     

})


app.post('/generate', async (req, res) => {

     const { message } = req.body


      const ai = new GoogleGenAI(process.env.GEMINI_API_KEY)

      async function main() {

          const response = await ai.models.generateContent({
             model: "gemini-3-flash-preview",
             contents: message
          })
          const result = response.text
          console.log(response.text)
          res.send(result)
      }

      await main()
       
})



