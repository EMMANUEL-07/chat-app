const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { genMessage, genLocMessage }  = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom }  = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)


const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))


io.on('connection', (socket) => {
    console.log('new Websocket Connection')

    

    socket.on('join', ({username, room}, callback) => {
        
        const {error, user } = addUser({ id:socket.id, username, room} )

        if (error) {
            return callback(error)
        }


        socket.join(user.room)

        socket.emit('message', genMessage( "Admin", 'Welcome') )
        socket.broadcast.to(user.room).emit('message', genMessage( "Admin", `${user.username} has joined`) )
        
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        
        callback()

    })

    socket.on('send', (message, callback) => {
        const user = getUser(socket.id)

        const filter = new Filter()

        if(filter.isProfane(message)){
            return  callback('Profane words not allowed')
        }
        
        io.to(user.room).emit('message', genMessage( user.username, message))
        callback('Delievered')
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if(user){
            io.to(user.room).emit('message', genMessage( "Admin", `${user.username} has left`) )
            
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        
        }
        
       
    })

    socket.on('loc', (location, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('loc-message', genLocMessage( user.username, `https://google.com/maps?q=${location.latitude},${location.longitude}`) )
        callback()
    })

})



server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
})
