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
    const { email, password, name, avatar } = req.body;
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
        "avatar": avatar || null,
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

app.get('/api/users', (req, res)=>{
    const users = db.users;
    res.status(200).json({message: "Retrieve user successfully!", users: users});
})

app.post('/api/boards',(req, res)=>{
    const userID = Number(req.headers['x-user-id']);
    const {title, deadline} = req.body;
    if(!userID){
        return res.status(401).json({message: "Invalid!"});
    }
    const newB = {
      "id": db.boards.length + 101,
      "title": title,
      "deadline": deadline,
      "ownerId": userID,
      "members": []
    }
    let boards = db.boards;
    boards.push(newB);
    db.boards = boards;
    fs.writeFileSync('./db.json', JSON.stringify(db, null, 2));
    res.status(200).json({message: "Create successfully!", newB: newB});
});

app.get('/api/boards/:id', (req, res) => {
    const boardId = Number(req.params.id);
    const userId = Number(req.headers['x-user-id']);
    if (!userId) {
        return res.status(401).json({ message: "Invalid user!" });
    }
    const board = db.boards.find(b => b.id === boardId);
    if (!board) {
        return res.status(404).json({ message: "Board not found!" });
    }

    if (board.ownerId !== userId && !board.members.includes(userId)) {
        return res.status(403).json({ message: "Access denied!" });
    }

    const tasks = db.tasks || [];
    const users = db.users || [];
    const allMemberIds = [board.ownerId, ...board.members];
    board.membersData = [...new Set(allMemberIds)].map(mId => {
        const u = users.find(user => Number(user.id) === Number(mId));
        return u ? { id: u.id, name: u.name, avatar: u.avatar } : null;
    }).filter(Boolean);
    const boardTasks = tasks.filter(t => t.boardId === boardId).map(t => {
        const assignee = db.users.find(u => u.id == t.assigneeId);
        return {
            ...t,
            assigneeName: assignee ? assignee.name : "Unassigned",
            assigneeAvatar: assignee ? assignee.avatar : null
        };
    });
    
    res.status(200).json({ message: "Retrieve board successfully!", board: board, tasks: boardTasks });
});

app.post('/api/boards/:id/tasks', (req, res) => {
    const boardId = Number(req.params.id);
    const userId = Number(req.headers['x-user-id']);
    const { title } = req.body;

    if (!userId) {
        return res.status(401).json({ message: "Invalid user!" });
    }
    if (!title || !title.trim()) {
        return res.status(400).json({ message: "Task title is required!" });
    }
    if (!db.tasks) db.tasks = [];
    const newId = db.tasks.length > 0
        ? Math.max(...db.tasks.map(t => t.id)) + 1
        : 1;
    const newTask = {
        id: newId,
        boardId: boardId,
        title: title.trim(),
        deadline: req.body.deadline || null,
        status: 'todo',
        assigneeId: null
    };

    db.tasks.push(newTask);
    fs.writeFileSync('./db.json', JSON.stringify(db, null, 2));
    res.status(200).json({ message: "Task created successfully!", task: newTask });
});

app.put('/api/tasks/:taskId/deadline', (req, res) => {
    const task = db.tasks.find(t => t.id === Number(req.params.taskId));
    task.deadline = req.body.deadline;
    fs.writeFileSync('./db.json', JSON.stringify(db, null, 2));
    res.status(200).json({ message: "Deadline updated!" });
});

app.put('/api/tasks/:taskId/status', (req, res) => {
    const taskId = Number(req.params.taskId);
    const { status } = req.body;

    const task = db.tasks.find(t => t.id === taskId);

    if (!task) {
        return res.status(404).json({ message: "Task not found!" });
    }

    task.status = status;
    fs.writeFileSync('./db.json', JSON.stringify(db, null, 2));
    res.status(200).json({ message: "Task moved successfully!", task: task });
});

app.put('/api/tasks/:taskId', (req, res) => {
    const taskId = Number(req.params.taskId);
    const { title } = req.body;

    if (!title || !title.trim()) {
        return res.status(400).json({ message: "Title cannot be empty!" });
    }

    const task = db.tasks.find(t => t.id === taskId);
    if (!task) return res.status(404).json({ message: "Task not found!" });

    task.title = title.trim();
    fs.writeFileSync('./db.json', JSON.stringify(db, null, 2));
    res.status(200).json({ message: "Task updated!" });
});

app.get('/api/tasks/:taskId', (req, res) => {
    const taskId = Number(req.params.taskId);
    const task = db.tasks.find(t => t.id === taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.status(200).json({ task });
});

app.delete('/api/tasks/:taskId', (req, res) => {
    const taskId = Number(req.params.taskId);
    
    const initialLength = db.tasks.length;
    db.tasks = db.tasks.filter(t => t.id !== taskId); 

    if (db.tasks.length === initialLength) {
        return res.status(404).json({ message: "Task not found!" });
    }

    fs.writeFileSync('./db.json', JSON.stringify(db, null, 2));
    res.status(200).json({ message: "Task deleted!" });
});

app.post('/api/boards/:id/members', (req, res) => {
    const boardId = Number(req.params.id);
    const inviterId = Number(req.headers['x-user-id']);
    const { email } = req.body;

    if (!email || !email.trim()) {
        return res.status(400).json({
            message: "Email cannot be empty!"
        });
    }

    const userToAdd = db.users.find(
        u => u.email === email.trim()
    );

    if (!userToAdd) {
        return res.status(404).json({
            message: "User not found!"
        });
    }

    const board = db.boards.find(
        b => b.id === boardId
    );

    if (!board) {
        return res.status(404).json({
            message: "Board not found!"
        });
    }

    if (
        board.ownerId === userToAdd.id ||
        board.members.includes(userToAdd.id)
    ) {
        return res.status(400).json({
            message: "This user is already in the board!"
        });
    }

    board.members.push(userToAdd.id);

    if (!db.notifications) {
        db.notifications = [];
    }

    const inviterInfo = db.users.find(
        u => u.id === inviterId
    );

    const inviterName = inviterInfo
        ? inviterInfo.name
        : "A teammate";

    const newNotif = {
        id: db.notifications.length > 0
            ? Math.max(...db.notifications.map(n => n.id)) + 1
            : 1,
        userId: userToAdd.id,
        boardId: board.id,
        message: `${inviterName} invited you to join the project "${board.title}"`,
        isRead: false,
        createdAt: new Date().toLocaleString()
    };

    db.notifications.push(newNotif);
    fs.writeFileSync('./db.json', JSON.stringify(db, null, 2));
    res.status(200).json({ message: `${userToAdd.name} was invited successfully!` });
});

app.get('/api/notifications', (req, res) => {
    const userId = Number(req.headers['x-user-id']);

    if (!userId) {
        return res.status(401).json({ message: "Invalid user!"});
    }

    const notifications = db.notifications || [];

    const userNotifs = notifications
        .filter(n => n.userId === userId)
        .reverse();

    res.status(200).json({ notifications: userNotifs});
});

app.get('/api/notifications/unread', (req, res) => {
    const userId = Number(req.headers['x-user-id']);

    if (!userId) {
        return res.status(401).json({ message: "Invalid user!" });
    }

    const notifications = db.notifications || [];

    const unreadCount = notifications.filter(
        n => n.userId === userId && n.isRead === false
    ).length;

    res.status(200).json({ unreadCount: unreadCount });
});

app.put('/api/tasks/:taskId/assign', (req, res) => {
    const taskId = Number(req.params.taskId);
    const { assigneeId } = req.body;

    const task = db.tasks.find(
        t => t.id === taskId
    );

    if (!task) {
        return res.status(404).json({
            message: "Task not found!"
        });
    }

    task.assigneeId = assigneeId;

    fs.writeFileSync(
        './db.json',
        JSON.stringify(db, null, 2)
    );

    const assignee = db.users.find(
        u => Number(u.id) === Number(assigneeId)
    );

    const assigneeData = assignee
        ? {
            assigneeName: assignee.name,
            assigneeAvatar: assignee.avatar
        }
        : {
            assigneeName: null,
            assigneeAvatar: null
        };

    res.status(200).json({
        message: "Task assigned successfully!",
        assigneeData
    });
});

app.get('/api/tasks/:taskId/comments', (req, res) => {
    const taskId = Number(req.params.taskId);

    const task = db.tasks.find(
        t => t.id === taskId
    );

    if (!task) {
        return res.status(404).json({
            message: "Task not found!"
        });
    }

    res.status(200).json({
        comments: task.comments || []
    });
});

app.post('/api/tasks/:taskId/comments', (req, res) => {
    const taskId = Number(req.params.taskId);
    const userId = Number(req.headers['x-user-id']);
    const { content } = req.body;

    if (!content || !content.trim()) {
        return res.status(400).json({
            message: "Content is required!"
        });
    }

    const task = db.tasks.find(
        t => t.id === taskId
    );

    const user = db.users.find(
        u => u.id === userId
    );

    if (!task) {
        return res.status(404).json({
            message: "Task not found!"
        });
    }

    if (!task.comments) {
        task.comments = [];
    }

    const newComment = {
        id: Date.now(),
        userId: userId,
        userName: user ? user.name : "Unknown",
        userAvatar: user ? user.avatar : null,
        content: content.trim(),
        createdAt: new Date().toLocaleString()
    };

    task.comments.push(newComment);

    fs.writeFileSync(
        './db.json',
        JSON.stringify(db, null, 2)
    );

    res.status(200).json({
        message: "Comment added!",
        comment: newComment
    });
});

app.put('/api/tasks/:taskId/description', (req, res) => {
    const taskId = Number(req.params.taskId);
    const { description } = req.body;

    const task = db.tasks.find(t => t.id === taskId);
    if (!task) return res.status(404).json({ message: "Task not found!" });

    task.description = description;
    fs.writeFileSync('./db.json', JSON.stringify(db, null, 2));
    res.status(200).json({ message: "Description updated!", task });
});

app.post('/api/tasks/:taskId/checklist', (req, res) => {
    const taskId = Number(req.params.taskId);
    const { title } = req.body;
    const task = db.tasks.find(t => t.id === taskId);
    
    const newItem = { id: Date.now(), title, isDone: false };
    task.checklist = [...(task.checklist || []), newItem];
    
    fs.writeFileSync('./db.json', JSON.stringify(db, null, 2));
    res.status(200).json({ item: newItem });
});

app.put('/api/tasks/:taskId/checklist/:itemId', (req, res) => {
    const { taskId, itemId } = req.params;
    const task = db.tasks.find(t => t.id === Number(taskId));
    const item = task.checklist.find(i => i.id === Number(itemId));
    
    item.isDone = !item.isDone;
    fs.writeFileSync('./db.json', JSON.stringify(db, null, 2));
    res.status(200).json({ item });
});

app.delete('/api/boards/:boardId', (req, res) => {
    const boardId = Number(req.params.boardId);
    db.boards = db.boards.filter(b => b.id !== boardId);
    
    fs.writeFileSync('./db.json', JSON.stringify(db, null, 2));
    res.status(200).json({ message: "Board deleted!" });
});

app.put('/api/user', (req, res) => {
    const userId = Number(req.headers['x-user-id']);
    const { avatar, password } = req.body;
    const user = db.users.find(u => u.id === userId);

    if (!user) return res.status(404).json({ message: "User not found!" });

    if (avatar) user.avatar = avatar;
    if (password) user.password = password;

    fs.writeFileSync('./db.json', JSON.stringify(db, null, 2));
    res.status(200).json({ message: "Cập nhật thành công!" });
});

app.put('/api/boards/:boardId', (req, res) => {
    const { title, deadline } = req.body;
    const board = db.boards.find(b => b.id === Number(req.params.boardId));
    if (board) {
        if (title) board.title = title;
        if (deadline) board.deadline = deadline;
        fs.writeFileSync('./db.json', JSON.stringify(db, null, 2));
        res.status(200).json({ board });
    }
});

app.put('/api/tasks/:taskId/deadline', (req, res) => {
    const taskId = Number(req.params.taskId);
    const { deadline } = req.body;

    const task = db.tasks.find(t => t.id === taskId);
    if (!task) return res.status(404).json({ message: "Task not found!" });

    task.deadline = deadline;
    fs.writeFileSync('./db.json', JSON.stringify(db, null, 2));
    res.status(200).json({ message: "Deadline updated!", task });
})

app.get('/api/tasks', (req, res) => {
    res.status(200).json({ tasks: db.tasks });
});

app.listen(5000, ()=> console.log('Server is running!'));