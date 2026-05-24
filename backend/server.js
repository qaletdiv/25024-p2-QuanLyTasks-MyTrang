import express from "express";
import fs from "fs";
import cors from "cors";

const app = express();

const rawData = fs.readFileSync('./db.json', 'utf-8');
const db = JSON.parse(rawData);

//middleware line
app.use(express.json());
app.use(cors());

app.post('/api/login', (req, res)=>{
    const {email, password} = req.body;
    const users = db.users;
    const currE = users.find(u => u.email == email);
    if(!currE){
        res.status(401).json({message: "Email not existed!"});
    }
    else {
        if(currE.password == password){
            const token = "fake-token"+ String(currE.id) + String(currE.name);
            res.status(200).json({message: "Log in successfully!", token: token, userId: currE.id});
        }
        else{
            res.status(401).json({message: "Password incorrect!"});
        }
    }
});

app.post('/api/register', (req,res)=>{
    const {email, password, name} = req.body;
    const users = db.users;
    const currE = users.find(u => u.email == email);
    const currN = users.find(u =>u.name == name);
    if(currE){
        return res.status(400).json({message: "Email already existed!"});
    }
    if (currN){
        return res.status(400).json({message: "Name already existed!"});
    }
    const newU = {
        "id": users.length + 1,
        "email": email,
        "password": password,
        "name": name,
        "avatar": null,
    }
    users.push(newU);
    db.users = users;
    fs.writeFileSync('./db.json', JSON.stringify(db, null, 2));
    const token = "fake-token"+ String(newU.id) + String(name);
    res.status(200).json({message: "Register successfully!", token: token, userId: newU.id});
})

app.get('/api/boards', (req, res) => {
    const userId = Number(req.headers['x-user-id']);
    
    if (!userId) {
        return res.status(401).json({ message: "Invalid!" });
    }

    const boards = db.boards;
    const users = db.users;
    const tasks = db.tasks || [];

    let userBoards = [];

    boards.forEach(board => {
        if (board.ownerId === userId || board.members.includes(userId)) {

            const ownerInfo = users.find(u => u.id === board.ownerId);

            const membersInfo = board.members.map(memId => {
                const mem = users.find(u => u.id === memId);

                return {
                    id: mem.id,
                    name: mem.name,
                    avatar: mem.avatar
                };
            }).filter(Boolean);

            const boardTasksCount = tasks.filter(t => t.boardId === board.id).length;

            userBoards.push({
                ...board,
                ownerName: ownerInfo ? ownerInfo.name : "Unknown",
                ownerAvatar: ownerInfo ? ownerInfo.avatar : null,
                membersData: membersInfo,
                tasksCount: boardTasksCount
            });
        }
    });

    res.status(200).json({
        message: "Retrieve data successfully!",
        userBoards: userBoards
    });
});

app.get('/api/user', (req, res)=>{
    const userId = req.headers['x-user-id'];
    if(!userId){
        return res.status(401).json({message: "Invalid!"});
    }
    const users = db.users;
    const currU = users.find(e => e.id == Number(userId));
    res.status(200).json({message: "Retrieve user successfully!", currU: currU});
})


app.post('/api/boards',(req, res)=>{
    const userID = Number(req.headers['x-user-id']);
    const {title} = req.body;
    if(!userID){
        return res.status(401).json({message: "Invalid!"});
    }
    const newB = {
      "id": db.boards.length + 101,
      "title": title,
      "ownerId": userID,
      "members": []
    }
    let boards = db.boards;
    boards.push(newB);
    db.boards = boards;
    fs.writeFileSync('./db.json', JSON.stringify(db, null, 2));
    res.status(200).json({message: "Create successfully!", newB: newB});
});


app.listen(5000, ()=> console.log('Server is running!'));