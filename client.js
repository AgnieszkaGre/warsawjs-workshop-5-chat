var io = require('socket.io-client');
var readline = require('readline');
var os = require('os');
var colors = require('colors/safe');


var socket = io('http://localhost:3001');
var userName = "";
var sessionToken;


socket.on('startMessage', (message) => {
    writeLine(message);
})

socket.on('welcomeUser', (message) => {
    writeLine(message);
})

function writeLine(line) {
    //process.stdout.clearLine();
    process.stdout.cursorTo(0);
    cli.setPrompt(userName + "> ");
    process.stdout.write(line + os.EOL);

    cli.prompt(true);
}

var cli = readline.createInterface( {
    input: process.stdin,
    output: process.stdout
})

cli.setPrompt('> ');
cli.prompt();
cli.on('line', line => {
    cli.prompt();
    socket.emit('sendMessage', {token: sessionToken, userName: userName, line: line});
});

socket.on('getNewLine', (line) => {
    writeLine(colors.rainbow(line));
})

socket.on('userLogged', (session) => {
    sessionToken = session.token;
    userName = session.userName;
    writeLine(`Logged successfully as ${userName}! Your token: ${sessionToken}`);
    socket.emit('helloNewUser', userName);
})

socket.on('registrationMessage', (line) => {
    writeLine(line);
})

socket.on('loginError', (line) => {
    writeLine(colors.red.underline(line));
})

socket.on('invalidToken', (line) => {
    writeLine(line);
})
