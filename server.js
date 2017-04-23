var http = require('http');
var io = require('socket.io');
var uuid = require('uuid/v4');


var userBase = [];
var tokenBase = [];

function createServer() {
    return new Promise((resolve, reject) => {
        var server = http.createServer();
        server.on('listening', () => resolve(server));
        server.on('error', reject);
        server.listen(3001)
    });
}

function createUserObject(name, password, socketId) {
    return {id: name, password: password, socketId: socketId};
}

function isUserInBase(user) {
    return userBase.find((el)=> {
        return el.id === user.id
    })
}


function onListening(server) {
    console.log('started!');
    var socket = io(server);

    socket.on('connection', socket => {
        console.log(`new user: ${socket.id}`);

        socket.on('disconnect', function() {
            var user = userBase.find((el) => {
                return el.socketId === socket.id;
            })
            var index = tokenBase.findIndex((el) => {
                return el.id === el.user;
            })
            console.log(tokenBase);
            tokenBase.splice(index,1);
            console.log(tokenBase);
        })

        socket.emit('hello', 'hello!!!');
        socket.broadcast.emit('startMessage', 'Welcome!');
        socket.on('helloNewUser', function(nick) {
            console.log(`New user ${nick}`);
            socket.broadcast.emit('welcomeUser', `Hello my name is ${nick}`);
        });
        socket.on('sendMessage', function(message) {
            console.log(message.line);
            var line = message.line;
            var token = message.token;

            console.log("message token", token);
            if (line.slice(0,1) === '/') {


                var arguments = line.split(" ");
                var command = arguments[0];
                console.log(`user used command ${command}`);

                if (command === "/register") {
                    var userName = arguments[1];
                    var password = arguments[2];
                    console.log(`registering userName: ${userName}, password: ${password}`);

                    registerNewUser(createUserObject(userName, password, socket.id));
                    console.log(userBase);

                    function registerNewUser(user) {

                        if (!isUserInBase(user)) {
                            userBase.push(user);
                            socket.emit('registrationMessage', "Registration succesful.")
                        } else {
                            console.log(`Registration error. User ${user.id} already exists`);
                            socket.emit('registrationMessage', 'This user name already exists. Try with different one.')
                        }
                    }
                }

                else if(command === "/login") {
                    var userName = arguments[1];
                    var password = arguments[2];
                    var user = createUserObject(userName, password, socket.id);

                    var hasSession = tokenBase.find((el) => {
                        return el.user === userName;
                    });


                    if (isUserInBase(user) && !hasSession) {
                        var token = uuid();
                        console.log(`user ${user.id} logged`);
                        tokenBase.push({user: user.id, token: token});
                        socket.emit('userLogged', {token: token, userName: user.id});
                    } else if (isUserInBase(user) && hasSession) {
                        socket.emit('loginError', `User ${user.id} is already logged`);
                    } else {
                        socket.emit('loginError', 'Register first.');
                    }
                } else if(command === "/logout") {
                    var userName = arguments[1];
                    var index = tokenBase.findIndex((el) => {
                        return el.user === userName && el.token === token;
                    })
                    tokenBase.splice(index,1);
                    socket.emit('logoutSuccesful', "You logged out.");
                }

            } else {

                var isValidToken = tokenBase.find((el) => {
                    return token === el.token;
                });

                if (isValidToken) {
                    line = message.userName + "> " + line;
                    socket.broadcast.emit('getNewLine', line);
                } else {
                    socket.emit('invalidToken', 'You have to register in order to send messages.')
                }

            }

        })
    })
}
function onError() {
    console.log('error!');
}


createServer().then(onListening).catch(onError);
