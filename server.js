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

function createUserObject(name, password) {
    return {id: name, password: password};
}

function isUserInBase(user) {
    return userBase.find((el)=> {
        return el.id === user.id
    })
}



function logUserIn (user) {
    if (isUserInBase(user)) {

    };
}


function onListening(server) {
    console.log('started!');
    var socket = io(server);

    socket.on('connection', socket => {
        console.log(`new user: ${socket.id}`);

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

                    registerNewUser(createUserObject(userName, password));
                    console.log(userBase);

                    function registerNewUser(user) {

                        if (!isUserInBase(user)) {
                            userBase.push(user);
                        } else {
                            console.log(`Registration error. User ${user.id} already exists`);
                            socket.emit("registrationError", "This user name already exists. Try with different one.")
                        }
                    }
                }

                else if(command === "/login") {
                    var userName = arguments[1];
                    var password = arguments[2];
                    var user = createUserObject(userName, password);

                    var hasSession = tokenBase.find((el) => {
                        return el.user === userName;
                    });


                    if (isUserInBase(user) && !hasSession) {
                        var token = uuid();
                        console.log(`user ${user.id} logged`);
                        tokenBase.push({user: user.id, token: token});
                        socket.emit('userLogged', {token: token, userName: user.id});
                    } else {
                        socket.emit('loginError', 'User is already logged');
                    }
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
