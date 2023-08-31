const express = require('express')
const cors = require('cors')
const app = express()
const http = require('http').createServer(app)
const bodyParser = require('body-parser')


const jsonParser = bodyParser.json()

http.listen(8080, () => {
    console.log(`listening on port 8080`)
})

app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:4200", "http://localhost:8080"]
}))

var users = []

app.post('/addUser', jsonParser, (request, response) => {
    const newUser = request.body.username
    // console.log(users)
    // console.log(newUser)
    if (users.includes(newUser)) {
        response.status(500).send({ error: 'User already exists' })
    } else {
        const success = {
            status: 200,
            message: "New user connected..."
        }
        users.push(newUser)
        response.send(success)
    }
    // res.send('Hello world')
})

const io = require('socket.io')(http)

io.on("connection", (socket) => {
    console.log("connected...")
    socket.on("join", ({ name, room }) => {
        // Emit will send message to the user
        // who had joined

        socket.emit('message', {
            username: 'admin', message:
                `${name},
            welcome to room ${room}.`,
            room: room
        });

        // Broadcast will send message to everyone
        // in the room except the joined user
        socket.broadcast.to(room)
            .emit('message', {
                username: "admin",
                message: `${name}, has joined`,
                room: room
            });

        socket.join(room);
    })

    socket.on('send-message', ({ username, activeRoom, message }) => {
        // messages.push(message)
        // console.log(message)
        // socket.broadcast.emit('recieve-message',(message))
        io.sockets.in(activeRoom).emit('message', { username: username, message: message, room: activeRoom });
    })

    socket.on('leaveRoom', ({ name, activeRoom }) => {
        // console.log("test")
        socket.broadcast.to(activeRoom).emit('message',
            {
                username: 'admin', message:
                    `${name} had left ${activeRoom}`,
                room: activeRoom
            });
        socket.leave(activeRoom)
    })
})