import express from "express";
import bodyParser from "body-parser";
import { Server } from "socket.io";

const io = new Server({
  cors: true,
});
const app = express();
app.use(bodyParser.json());

const emailToSocketMapping = new Map();
const socketToEmailMapping = new Map();

io.on("connection", (socket) => {
  socket.on("join-room", (data) => {
    const { roomId, emailId } = data;
    emailToSocketMapping.set(emailId, socket.id);
    socketToEmailMapping.set(socket.id, emailId);
    socket.join(roomId);
    socket.emit("joined-room", { roomId, emailId });
    socket.broadcast.to(roomId).emit("user-joined", { emailId });
  });

  socket.on("call-user", (data) => {
    const { emailId, offer } = data;
    const from = socketToEmailMapping.get(socket.id);
    const callerSocketId = emailToSocketMapping.get(emailId);
    io.to(callerSocketId).emit("incoming-call", {
      from,
      offer,
    });
  });

  socket.on("call-accepted", (data) => {
    const { emailId, answer } = data;
    const callerSocketId = emailToSocketMapping.get(emailId);
    io.to(callerSocketId).emit("call-accepted", { answer });
  });
});

// App listen
app.listen(8000, () => {
  console.log("Server is running 8000");
});
io.listen(8090);
