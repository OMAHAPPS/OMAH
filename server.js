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
const LikedPost = require('./models/userPostLikes')
const LikedReply = require('./models/userReplyLikes')
const Following = require('./models/following')
const Chat = require('./models/dmBucket')

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

// AUTHENTICATION MIDDLEWARE FOR IO
io.use((socket, next) => {

  const userId = socket.handshake.auth.userId;

  // 1. Reject if no userId is provided
  if (!userId) {
    console.log('Authentication error: user Login is required')
    return next(new Error("Authentication error: user Login is required"));
  }

  // 3. Store the userId on the socket instance for future use
  socket.userId = userId;
  next();
});

io.on('connection', (socket) => {
    console.log(`New Socket ${socket.userId} Mounted on port ${PORT}`)
    
    //  Join a private room dedicated to this specific user
    socket.join(`user-room-${socket.userId}`);

    //DISconnect instance
    socket.on('disconnect', () => {
        console.log(`${socket.userId} Disconnected`)
    })

    socket.on('update-likes', async (data, ack) => {

        
         try {

             if (!data || typeof data !== 'object' || Array.isArray(data)) {

                     ack({ success: false, error: 'Invalid Payload Datatype' })
               }

            const userLikingId = socket.userId
            const userHasLikedBefore = await LikedPost.findOne({ parentId: userLikingId } )

            // if user has never liked anything ever before
            if (!userHasLikedBefore) {

                const newLikeInstanceForUser = new LikedPost({
                     parentId: userLikingId, count: 1, posts: [data.postId] 
                    }).save().then( async (newBucket) => {

                        console.log(`new Bucket Created For User: ${newBucket.parentId}`)

                        const updatedPostFirst = await Post.findByIdAndUpdate(data.postId, { $inc: { likes: 1, interactions: 2 } }, { returnDocument: 'after' })

                        ack({ success: true, newLikesCount: updatedPostFirst.likes, UIStatus: 'like' })
                    })    
                    .catch((err) => {

                        console.log(err)
                        ack({ success: false, UIStatus: 'unlike', error: 'New like Instance failed' })
                    })
                
            } else {

                const userLikedPostBefore = await LikedPost.findOne({ parentId: userLikingId, posts: data.postId }).select('_id count')
             
              if (!userLikedPostBefore) {

                  const updatedPost = await Post.findByIdAndUpdate(data.postId, { $inc: { likes: 1, interactions: 2 } }, { returnDocument: 'after' } )
                  const UpdatedUserLiked = await LikedPost.findOneAndUpdate({ parentId: userLikingId, count: { $lt: 500 } }, { $push: { posts: data.postId }, $inc: { count: 1 } }, { upsert: true })

                ack({ success: true, newLikesCount: updatedPost.likes, UIStatus: 'like' })
            
              } else {

                 if(userLikedPostBefore.count === 1) {
                      
                       await LikedPost.deleteOne({ _id: userLikedPostBefore._id })
                       const updatedPost = await Post.findByIdAndUpdate(data.postId, { $inc: { likes: -1 } }, { returnDocument: 'after' })

                       ack({ success: true, newLikesCount: updatedPost.likes, UIStatus: 'unlike' })

                 } else {
                    const pulledLikesByUser = await LikedPost.findOneAndUpdate({ _id: userLikedPostBefore._id }, { $pull: { posts: data.postId }, $inc: { count: -1 } })
                    const updatedPost = await Post.findByIdAndUpdate(data.postId, { $inc: { likes: -1 } }, { returnDocument: 'after' })   
                     
                    ack({ success: true, newLikesCount: updatedPost.likes, UIStatus: 'unlike'})
                 }

              }
                
            }
        
            
         } catch (error) {
            console.log(error)
            ack({ success: false, UIStatus: 'unlike', error: 'DataBase Update Failed' })
            
         }
    })

    socket.on('update-reply-likes', async (data, ack) => {
        
         try {

             if (!data || typeof data !== 'object' || Array.isArray(data)) {

                     ack({ success: false, error: 'Invalid Payload Datatype' })
               }

            const userLikingId = socket.userId
            const userHasLikedBefore = await LikedReply.findOne({ parentId: userLikingId } )

            // if user has never liked anything ever before
            if (!userHasLikedBefore) {

                const newLikeInstanceForUser = new LikedReply({
                     parentId: userLikingId, count: 1, posts: [data.replyId] 
                    }).save().then( async (newBucket) => {

                        console.log(`new Bucket Created For User: ${newBucket.parentId}`)

                        const updatedReplyFirst = await Reply.findByIdAndUpdate(data.replyId, { $inc: { likes: 1, interactions: 2 } }, { returnDocument: 'after' })
                        const updateMainPost = await Post.findByIdAndUpdate(data.mainPostId, { $inc: { interactions: 2 } }, { returnDocument: 'after' })

                        ack({ success: true, newLikesCount: updatedReplyFirst.likes, UIStatus: 'like' })
                    })    
                    .catch((err) => {

                        console.log(err)
                        ack({ success: false, UIStatus: 'unlike', error: 'New like Instance failed' })
                    })
                
            } else {

                const userLikedReplyBefore = await LikedReply.findOne({ parentId: userLikingId, replies: data.replyId }).select('_id count')
             
              if (!userLikedReplyBefore) {

                  const updatedReply = await Reply.findByIdAndUpdate(data.replyId, { $inc: { likes: 1, interactions: 2 } }, { returnDocument: 'after' } )
                  const updateMainPost = await Post.findByIdAndUpdate(data.mainPostId, { $inc: { interactions: 2 } }, { returnDocument: 'after' })
                  const UpdatedUserLiked = await LikedReply.findOneAndUpdate({ parentId: userLikingId, count: { $lt: 500 } }, { $push: { replies: data.replyId }, $inc: { count: 1 } }, { upsert: true })

                ack({ success: true, newLikesCount: updatedReply.likes, UIStatus: 'like' })
            
              } else {

                 if(userLikedReplyBefore.count === 1) {
                      
                       await LikedReply.deleteOne({ _id: userLikedReplyBefore._id })
                       const updatedReply = await Reply.findByIdAndUpdate(data.replyId, { $inc: { likes: -1 } }, { returnDocument: 'after' })

                       ack({ success: true, newLikesCount: updatedReply.likes, UIStatus: 'unlike' })

                 } else {
                    const pulledLikesByUser = await LikedReply.findOneAndUpdate({ _id: userLikedReplyBefore._id }, { $pull: { replies: data.replyId }, $inc: { count: -1 } })
                    const updatedReply = await Reply.findByIdAndUpdate(data.replyId, { $inc: { likes: -1 } }, { returnDocument: 'after' })   
                     
                    ack({ success: true, newLikesCount: updatedReply.likes, UIStatus: 'unlike'})
                 }

              }
                
            }
        
            
         } catch (error) {
            console.log(error)
            ack({ success: false, UIStatus: 'unlike', error: 'DataBase Update Failed' })
            
         }
    

    })

    socket.on('follow-request', async (data, ack) => {

        try {

              if (!data || typeof data !== 'object' || Array.isArray(data)) {

                     ack({ success: false, error: 'Invalid Payload Datatype', UIStatus: 'follow' })
               }

               const userReqId = socket.userId
               const userHasEverFollowedBefore = await Following.findOne({ parentId: userReqId })

            // CREATE NEW FOLLOWING INSTANCE/BUCKET
            if (!userHasEverFollowedBefore) {

                const newUserFollowBucket = new Following({
                    parentId: userReqId, count: 1, following: [data.recipientId]
                }).save().then((newBucket) => {
                    //  UPDATE BOTH FOLLOWING TOTAL FOR REQUSER AND FOLLOWERS TOTAL FOR RECIPIENT
                    console.log(`New Bucket crated for ${userReqId}`)
                    return newBucket._id
                }).then( async (update) => {

                     const updatedRecientFollowers = await Omaruser.findByIdAndUpdate(data.recipientId, { $inc: { totalFollowers: 1 } })
                     const updateReqUserFollowing = await Omaruser.findByIdAndUpdate(userReqId, { $inc: { totalFollowing: 1 } })

                    ack({ success: true, UIStatus: 'following' })
                })
                .catch((err) => {

                    ack({ success: false, UIStatus: 'follow', error: 'Failed to create Bucket/updateFailure' })
                })

            } else {          // REQUSER HAS A BUCKET ALREADY
                   
                const updatedReqUserbucket = await Following.findOneAndUpdate({ parentId: userReqId, count: { $lt: 500 } }, { $push: { following: data.recipientId }, $inc: { count: 1 } }, { upsert: true })
                const updatedReqUserFCount = await Omaruser.findByIdAndUpdate(userReqId, { $inc: { totalFollowing: 1 } })
                const updatedRecipientFollwers = await Omaruser.findByIdAndUpdate(data.recipientId, { $inc: { totalFollowers: 1 } })

                ack({ success: true, UIStatus: 'following' })

            }    

            
        } catch (error) {
             console.log(error)
             ack({ success: false, UIStatus: 'follow', error: 'ACK timeout/MongoDB error' })            
        }

    })

    socket.on('unfollow-request', async (data, ack) => {

           try {

            if (!data || typeof data !== 'object' || Array.isArray(data)) {

                ack({ success: false, error: 'Invalid Payload Datatype', UIStatus: 'following' })
            }

            const userReqId = socket.userId

            const userReqTargetBucket = await Following.findOne({ parentId: userReqId, following: data.recipientId })

            if (!userReqTargetBucket) {
                // USER NEVER FOLLOWED RECIPIENT
                ack({ success: false, UIStatus: 'follow', message: 'User Never followed this recipient before' })
               
            } else {
               
                 if (userReqTargetBucket.count === 1) {  // Delete the Bucket found
                    
                     const bucketDeleted = await Following.deleteOne({ _id: userReqTargetBucket._id })
                     const updatedReqUser = await Omaruser.findByIdAndUpdate(userReqId, { $inc: { totalFollowing: -1 } })
                     const updatedRecipient = await Omaruser.findByIdAndUpdate(data.recipientId, { $inc: { totalFollowers: -1 } } )

                     ack({ success: true, UIStatus: 'follow', message: 'Deleted Bucket and Updated both req/rec' })

                 } else {
                     
                     const updateTargetBucketCount = await Following.findByIdAndUpdate(userReqTargetBucket._id, { $pull: { following: data.recipientId }, $inc: { count: -1 } })
                     const updatedReqUser = await Omaruser.findByIdAndUpdate(userReqId, { $inc: { totalFollowing: -1 } })
                     const updatedRecipient = await Omaruser.findByIdAndUpdate(data.recipientId, { $inc: { totalFollowers: -1 } })

                     ack({ success: true, UIStatus: 'follow', message: 'Normal bucket, req, rec Updates' })
                 }

            }
            
           } catch (error) {
              
                   console.log(error)
                   ack({ success: false, UIStatus: 'following', error: 'ACKTimeout/MongoDB error' })
           }
    })

    socket.on('joinRoom', async (data) => {
        // 1. Move this socket thread connection inside the target room channel boundary
        socket.join(data.roomId)
        console.log(`👤 User ${data.userId} joined room sandbox channel: ${data.roomId}`)

        const readerId = data.roomId.replace('dm_', '').split('_').find(uid => uid !== data.userId) 

        // 2. Update All unseen/Delivered bck msgs to status seen since user has opened chat window
        try {

              const UpdateAllMsgToSeen = await Chat.updateMany({ roomId: data.roomId, "messages.senderId": { $ne: data.userId } }, { $set: { "messages.$[elem].status": 'seen' } }, { arrayFilters: [{ "elem.senderId": { $ne: data.userId } }] })

           
              const emitPayload = { roomId: data.roomId, readerId: readerId }

              socket.to(data.roomId).emit('messages_marked_seen', emitPayload);
            
            
        } catch (error) {
            
                  console.error("Failed handling database sync upon room entry:", error);

        }
    })

    socket.on('sendMessage', async (newMessage, ack) => {

        if (!newMessage || typeof newMessage !== 'object' || Array.isArray(newMessage)) {

                ack({ success: false, newStatus: 'failed', error: 'Invalid Payload' })
           }
        
        const senderId = newMessage.senderId
        const recipientId = newMessage.receiverId.replace('dm_', '').split('_').find(uid => uid !== senderId)
        const updatedMessage = {...newMessage, status: 'sent' }

        try {  // THIS BLOCK SHOULD CARRY ALL UPDATES SUCCESS TO TRIGGER ack(success, with newStatus) 

             
             const ChatBucketExists = await Chat.findOne({ roomId: newMessage.receiverId })  // Check if these people have ever chatted before 
            
             if (!ChatBucketExists) {  // if not create a new chat Bucket instance

                               
                   const createNewBucket = new Chat({
                        roomId: newMessage.receiverId, userAId: senderId, userBId: recipientId, count: 1, messages: [updatedMessage]
                  }).save().then((newBucket) => {
                       
                  })

                } else {   //CHAT BUCKET EXISTS

                    // Check if the Sent message already exists in a bucket to avoid double saves

                    const messageExists = await Chat.findOne({ roomId: newMessage.receiverId, "messages.id": newMessage.id })

                    if (messageExists) {
                        console.log('Message already exists in DB NO RESAVES')
                        return;
                        
                    } else {    // Update the bucket with upsert AND emit to receiver_background 

                        const UpdatedLatestBucket = await Chat.findOneAndUpdate({ roomId: newMessage.receiverId, count: { $lt: 500 } }, { $push: { messages: updatedMessage }, $inc: { count: 1 } }, { upsert: true })
                      
                         
                    }

                }

                  // This safely targets only sockets registered inside this room via the step above!
                  socket.to(newMessage.receiverId).timeout(4000).emit('receiveMessage_background', newMessage,  (err, response) => {
                              
                      if(!err) { // recipient Executed its acknowledgement function
     
                         ack({ success: true, newStatus: 'delivered' })        // JOIN ROOM EVENT WILL AUTOMATICALLY UPDATE ALL MSGS TO SEEN Update many
                               
                       }
                          
                         ack({success: true, newStatus: 'sent'})       // IF ERROR THE MESSAGE STATUS REMAINS AS SENT SINGLE TICK

                    })  

                 
                        
                } catch (error) {   // UPDATE BUCKET OR NEW BUCKET CREATION BOTH FAILED

                    console.log(error)

                    ack({ success: false, newStatus: 'failed' })

                }
                 
            

    })

    
    // Updates the one message to status seen to DB FOR PERMANENT STORAGE TO SEEN /FOR TEMPORARY UI CONFIRMATION
    socket.on('message_read', async ({ msgId, roomId, userId }) => {

         const originalSenderId = roomId.replace('dm_', '').split('_').find(uid => uid !== userId)
         const emitPayload = { msgId: msgId, roomId: roomId }
         const newStatus = 'seen'

         const TargetMsgObject = await Chat.findOne({ roomId: roomId, "messages.id": msgId }, { "messages.$": 1 })
         const updatedMsg = TargetMsgObject.messages[0]

         if (updatedMsg.status === newStatus) {

            console.log('SKIPPED MULTIPLE UPDATES')
            return;

         } else {

             try {  // Update message to seen status in db // might fail but emission to sender for Bluetick is essential
                          
                     const result = await Chat.updateOne({ roomId: roomId, "messages.id": msgId }, { $set: { "messages.$[elem].status": newStatus } }, { arrayFilters: [{ "elem.id": msgId }] })
                     
                     socket.to(roomId).emit('message_read_receipt', emitPayload)
                     console.log('Updated My message to seen')
                
             } catch (error) {  // Mongodb failure to modify the Message ststus but receipient still read the message
                
                  console.log('Mongod error to update ' + error)
                  
                  socket.to(roomId).emit('message_read_receipt', emitPayload)
             }


         }
      
    })

    socket.on('message_delivered', async ({ msgId, roomId, userId }) => {

         const originalSenderId = roomId.replace('dm_', '').split('_').find(uid => uid !== userId)
         const emitPayload = { msgId: msgId, roomId: roomId }
         const newStatus = 'delivered'

         const targetUpdateDoc = await Chat.findOne({ roomId, roomId, "messages.id": msgId }, { "messages.$": 1 })
         const acualMsg = targetUpdateDoc.messages[0]

         if (acualMsg.status === newStatus) {

            console.log('SKIPPED MULTIPLE UPDATES')
            return;

         } else {

             try {
    
                await Chat.findOneAndUpdate({ roomId: roomId, "messages.id": msgId }, { $set: { "messages.$[elem].status": newStatus } }, { arrayFilters: [{ "elem.id": msgId }] })
                
                socket.to(roomId).emit('message_delivered_receipt', emitPayload)
                
                console.log('Updated Messages to Delivered Once')
                
             } catch (error) {
    
                console.log('Failed to update a Delivered/ Msg')
    
                socket.to(roomId).emit('message_delivered_receipt', emitPayload)
                
             }

         }

    })

    socket.on('typing', (data) => {
        io.to(data.receiverId).emit('typing-receipt', data.senderId )
    })

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

app.get('/api/dm-history/messages', async (req, res) => {

     const roomId = req.query.roomId

     try {

        const recentHistoryChatBucket = await Chat.findOne({ roomId: roomId, count: { $lt: 500 } })
        const messagesArray = recentHistoryChatBucket.messages
        
        res.json({ success: true, messages: messagesArray })
        
     } catch (error) {

        console.log('Failed to retreive Messages From server')
        res.json({ success: false, error: 'Failed to retrieve server Messages' })

        
     }
})


app.get('/', loginCheck, (req, res) => {
      res.render('arrive')
})

app.get('/main', notLoggedInCheck, (req, res) => {

    const user = req.user

   res.render('pickrealm', { user })

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
             userId: post.userId,
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
    
     function FisheYates (array) {

       
        for(let i = array.length - 1; i > 0; i--) {
            
        const j = Math.floor(Math.random() * (i + 1));

             [array[i], array[j]] = [array[j], array[i]]
        } 
        return array
     }
     
     const sortedPostDataArray = FisheYates(postDataArray)


     const R2BaseUrl = process.env.R2_PUBLIC_BASE_URL 

    res.render('home', { user: userData, posts: sortedPostDataArray, R2BASE: R2BaseUrl, messages: req.flash('error') })


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
    const userLiked = await LikedPost.findOne({ parentId: userid, posts: postId }) // to be reused in like logic
    let likedStatus = 'none'
    if (!userLiked) {
         likedStatus = 'none'
    } else {
        likedStatus = 'present'
        }

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

    res.render('post', { post, user, poster: posterData, replies: replyDataArray, status: likedStatus, R2BASE: R2BaseUrl, query: optionalQuery })

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

        await Post.findByIdAndUpdate(postid,  { $inc: { replies: 1, interactions: 1 } } )
        
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

app.get('/inbox/:id', notLoggedInCheck, async (req, res) => {

    const userMessaging = req.user
    const userMessagingId = req.user._id
    const userMessagedId = req.params.id
    const userMessaged = await Omaruser.findOne({ _id: userMessagedId }).lean()
    const postOriginId = req.query.postOrigin
    const parties = {
        sender: userMessagingId,
        recipient: userMessagedId
    }
    
    const isUserReqFollowing = await Following.findOne({ parentId: userMessagingId, following: userMessagedId })


    const R2BASE = process.env.R2_PUBLIC_BASE_URL

      res.render('inbox', { userReq: userMessaging, userMessaged, followingStatus: isUserReqFollowing,  parties, origin: postOriginId, R2BASE })
})


app.get('/user/:id', notLoggedInCheck,  async (req, res) => {
    
    const userid = req.params.id                    //RECIPIENT
    const postOriginId = req.query.postOrigin
    const userReq = req.user                        //REQUSER

    
    const user = await Omaruser.findOne({ _id: userid })
    const userPosts = await Post.find({ userId: userid }) 
    const R2baseUrl = process.env.R2_PUBLIC_BASE_URL


    const userReqIsFollowingRec = await Following.findOne({ parentId: userReq._id, following: userid })

    res.render('userposts', { userReq, following: userReqIsFollowingRec,  posts: userPosts, user, R2BASE: R2baseUrl, origin: postOriginId } )
})

app.get('/group', notLoggedInCheck, async (req, res) => {

    const user = req.user

      res.render('group', { user })
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