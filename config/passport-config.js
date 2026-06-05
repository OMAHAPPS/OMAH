require('dotenv').config()

const passport = require('passport')
const Omahuser = require('../models/omahUsers')

const GoogleStrategy = require('passport-google-oauth20').Strategy

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.OMAH_DOMAIN}/auth/google/redirect`

}, (accessToken, refreshToken, profile, done ) => {

    // check if user is already in DB

    Omahuser.findOne({ googleId: profile.id }).then((currentUser) => {

        if (currentUser) {

            return done(null, currentUser)
        } else {

          new Omahuser({
                
                userName: profile.name.givenName,
                googleId: profile.id
            }).save()
            .then((newUser) => {
                
                console.log('New user saved')
                return done(null, newUser)
                
            })
        }
    })

}))

passport.serializeUser((user, done) => {
      if(user) {

        return done(null, user.id)

      } else {
      
        return done(error, false)     

      }
})

passport.deserializeUser((id, done) => {

      Omahuser.findById(id).then((user) => {

          return done(null, user) 
      })
})
