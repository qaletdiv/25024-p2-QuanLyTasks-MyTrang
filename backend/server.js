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

app.post('/api/boards', (req, res) => {
    const userID = Number(req.headers['x-user-id']);
    const { title, bg, inviteEmail } = req.body;

    let userToInvite = null;
    if (inviteEmail) {
        userToInvite = db.users.find(u => u.email === inviteEmail.trim());
        if (!userToInvite) {
            return res.status(404).json({ message: "Email invite không tồn tại trong hệ thống!" });
        }
        if (userToInvite.id === userID) {
            return res.status(400).json({ message: "Tự mời chính mình làm gì ba?" });
        }
    }
    const newB = {
        "id": db.boards.length + 101,
        "title": title,
        "deadline": null,
        "bg": bg,
        "ownerId": userID,
        "members": [],
        "columns": [
            { id: "todo", title: "To Do" },
            { id: "in-progress", title: "In Progress" },
            { id: "done", title: "Done" }
        ]
    };
    db.boards.push(newB);

    if (userToInvite) {
        if (!db.notifications) db.notifications = [];
        const inviterInfo = db.users.find(u => u.id === userID);
        const inviterName = inviterInfo ? inviterInfo.name : "Ai đó";

        db.notifications.push({
            id: Date.now(),
            userId: userToInvite.id,
            boardId: newB.id,
            message: `${inviterName} invites you to join board "${newB.title}"`,
            isRead: false,
            type: "invite", 
            createdAt: new Date().toLocaleString()
        });
    }
    fs.writeFileSync('./db.json', JSON.stringify(db, null, 2));
    res.status(200).json({ message: "Create successfully!", newB: newB });
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

    if (!board.columns) {
        board.columns = [
            { id: "todo", title: "To Do" },
            { id: "in-progress", title: "In Progress" },
            { id: "done", title: "Done" }
        ];
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
            assigneeId: t.assigneeId ? Number(t.assigneeId) : null,
            assigneeName: assignee ? assignee.name : "Unassigned",
            assigneeAvatar: assignee ? assignee.avatar : null
        };
    });
    
    res.status(200).json({ message: "Retrieve board successfully!", board: board, tasks: boardTasks });
});

app.put('/api/boards/:id/columns', (req, res) => {
    const boardId = Number(req.params.id);
    const { columns } = req.body;

    const board = db.boards.find(b => b.id === boardId);
    if (!board) return res.status(404).json({ message: "Board not found!" });

    board.columns = columns;
    fs.writeFileSync('./db.json', JSON.stringify(db, null, 2));
    
    res.status(200).json({ message: "Columns updated!", columns: board.columns });
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
        status: req.body.status || 'todo',
        assigneeId: null
    };
    addHistory(newTask, "Task created", "System");
    db.tasks.push(newTask);

    const boardInfo = db.boards.find(b => b.id === boardId);
    const userInfo = db.users.find(u => u.id === userId);
    createNotification(boardId, userId, `📝 ${userInfo ? userInfo.name : "Ai đó"} vừa thêm task mới: "${newTask.title}" vào board ${boardInfo?.title}`);
    fs.writeFileSync('./db.json', JSON.stringify(db, null, 2));
    res.status(200).json({ message: "Task created successfully!", task: newTask });
});

app.put('/api/tasks/:taskId/status', (req, res) => {
    const taskId = Number(req.params.taskId);
    const { status } = req.body;
    const task = db.tasks.find(t => t.id === taskId);
    if (!task) return res.status(404).json({ message: "Task not found!" });

    task.status = status;
    const user = db.users.find(u => u.id === Number(req.headers['x-user-id']));
    addHistory(task, `Changed status to ${status}`, user ? user.name : "System");
    createNotification(task.boardId, user.id, `🔄 ${user.name} đã chuyển task "${task.title}" sang "${status}"`);
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
        type: "invite",
        createdAt: new Date().toLocaleString()
    };

    db.notifications.push(newNotif);
    fs.writeFileSync('./db.json', JSON.stringify(db, null, 2));
    res.status(200).json({ message: `${userToAdd.name} was invited successfully!` });
});

app.post('/api/boards/:id/accept-invite', (req, res) => {
    const boardId = Number(req.params.id);
    const userId = Number(req.headers['x-user-id']);

    const board = db.boards.find(b => b.id === boardId);
    if (!board) return res.status(404).json({ message: "Board not existed!" });

    if (!board.members.includes(userId) && board.ownerId !== userId) {
        board.members.push(userId);
        fs.writeFileSync('./db.json', JSON.stringify(db, null, 2));
        return res.status(200).json({ message: "Welcome to the board!" });
    }
    
    res.status(400).json({ message: "You are already in!" });
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

    const task = db.tasks.find(t => t.id === taskId);
    if (!task) {
        return res.status(404).json({ message: "Task not found!" });
    }
    task.assigneeId = assigneeId;

    const user = db.users.find(u => u.id === Number(req.headers['x-user-id']));
    addHistory(task, `Assigned to ${assigneeId ? "a member" : "no one"}`, user ? user.name : "System");
    const assignee = db.users.find(u => Number(u.id) === Number(assigneeId));
    if (assignee) {
        createNotification(task.boardId, user.id, `👤 ${user.name} đã gán task "${task.title}" cho ${assignee.name}`);
    } else {
        createNotification(task.boardId, user.id, `👤 ${user.name} đã gỡ người làm khỏi task "${task.title}"`);
    }
    const assigneeData = assignee ? {
        assigneeName: assignee.name,
        assigneeAvatar: assignee.avatar
    } : {
        assigneeName: null,
        assigneeAvatar: null
    };

    fs.writeFileSync('./db.json', JSON.stringify(db, null, 2));
    res.status(200).json({ message: "Task assigned successfully!", assigneeData });
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
    createNotification(task.boardId, userId, `💬 ${user.name} đã bình luận trong task "${task.title}": "${content.substring(0, 20)}..."`);
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
    
    const user = db.users.find(u => u.id === Number(req.headers['x-user-id']));
    addHistory(task, "Updated description", user ? user.name : "System");
    fs.writeFileSync('./db.json', JSON.stringify(db, null, 2));
    res.status(200).json({ message: "Description updated!", task });
});

app.post('/api/tasks/:taskId/checklist', (req, res) => {
    const taskId = Number(req.params.taskId);
    const { title } = req.body;
    const task = db.tasks.find(t => t.id === taskId);
    const user = db.users.find(u => u.id === Number(req.headers['x-user-id']));

    const newItem = { id: Date.now(), title, isDone: false };
    task.checklist = [...(task.checklist || []), newItem];
    addHistory(task, `Added checklist: ${title}`, user ? user.name : "System");
    
    fs.writeFileSync('./db.json', JSON.stringify(db, null, 2));
    res.status(200).json({ task });
});

app.put('/api/tasks/:taskId/checklist/:itemId', (req, res) => {
    const { taskId, itemId } = req.params;
    const task = db.tasks.find(t => t.id === Number(taskId));
    const item = task.checklist.find(i => i.id === Number(itemId));
    const user = db.users.find(u => u.id === Number(req.headers['x-user-id']));

    item.isDone = !item.isDone;
    addHistory(task, `${item.isDone ? 'Checked' : 'Unchecked'}: ${item.title}`, user ? user.name : "System");
    
    fs.writeFileSync('./db.json', JSON.stringify(db, null, 2));
    res.status(200).json({ task });
});

app.delete('/api/boards/:boardId', (req, res) => {
    const boardId = Number(req.params.boardId);
    const userId = Number(req.headers['x-user-id']);

    const currB = db.boards.find(b => b.id === boardId);
    if (!currB) return res.status(404).json({ message: "Board not found!" });
    if(userId !== currB.ownerId) return res.status(403).json({message: "Invalid access!"});

    db.boards = db.boards.filter(b => b.id !== boardId);
    db.tasks = db.tasks.filter(t => t.boardId !== boardId);

    if(userId !== currB.ownerId)
        return res.status(403).json({message: "Invalid access!"});

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
    const { title, deadline, bg } = req.body;
    const board = db.boards.find(b => b.id === Number(req.params.boardId));
    if (board) {
        if (title && title.trim() !== "") board.title = title;
        if (deadline) board.deadline = deadline;
        if (bg) board.bg = bg;
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
    const user = db.users.find(u => u.id === Number(req.headers['x-user-id']));
    addHistory(task, `Updated deadline to ${deadline}`, user ? user.name : "System");
    fs.writeFileSync('./db.json', JSON.stringify(db, null, 2));
    res.status(200).json({ message: "Deadline updated!", task });
})

app.get('/api/tasks', (req, res) => {
    res.status(200).json({ tasks: db.tasks });
});

app.put('/api/notifications/:id/read', (req, res) => {
    const notifId = Number(req.params.id);
    const notif = db.notifications.find(n => n.id === notifId);
    
    if (!notif) return res.status(404).json({ message: "Notification not found!" });

    notif.isRead = true;
    fs.writeFileSync('./db.json', JSON.stringify(db, null, 2));
    
    res.status(200).json({ message: "Marked as read!" });
});

app.delete('/api/boards/:boardId/members/:memberId', (req, res) => {
    const boardId = Number(req.params.boardId);
    const memberId = Number(req.params.memberId);
    const userId = Number(req.headers['x-user-id']); 

    const board = db.boards.find(b => b.id === boardId);
    if (!board) return res.status(404).json({ message: "Board not found!" });
    const isOwner = board.ownerId === userId;
    const isSelf = memberId === userId;

    if (!isOwner && !isSelf) {
        return res.status(403).json({ message: "Không có quyền thực hiện!" });
    }

    board.members = board.members.filter(id => id !== memberId);
    board.membersData = board.membersData.filter(m => m.id !== memberId);
    fs.writeFileSync('./db.json', JSON.stringify(db, null, 2));
    res.status(200).json({ message: "Đã cập nhật thành viên!" });
});

const addHistory = (task, action, userName) => {
    if (!task.history) task.history = [];
    task.history.unshift({
        id: Date.now(),
        action: action,
        userName: userName,
        createdAt: new Date().toLocaleString()
    });
};

const createNotification = (boardId, senderId, message) => {
    const board = db.boards.find(b => b.id === boardId);
    if (!board) return;
    const allMembers = [board.ownerId, ...board.members];
    const receivers = allMembers.filter(id => id !== senderId);

    if (!db.notifications) db.notifications = [];

    receivers.forEach(userId => {
        db.notifications.push({
            id: Date.now() + Math.floor(Math.random() * 10000), 
            userId: userId,
            boardId: boardId,
            message: message,
            isRead: false,
            createdAt: new Date().toLocaleString()
        });
    });
};

app.post('/api/tasks/:taskId/labels', (req, res) => {
    const taskId = Number(req.params.taskId);
    const { label } = req.body;
    const task = db.tasks.find(t => t.id === taskId);
    const user = db.users.find(u => u.id === Number(req.headers['x-user-id']));

    if (!task) return res.status(404).json({ message: "Task not found!" });

    if (!task.labels) task.labels = []; 
    
    const cleanLabel = label.trim();
    if (cleanLabel && !task.labels.includes(cleanLabel)) {
        task.labels.push(cleanLabel);
        addHistory(task, `Added label: [${cleanLabel}]`, user ? user.name : "System");
        fs.writeFileSync('./db.json', JSON.stringify(db, null, 2));
    }
    
    res.status(200).json({ task });
});

app.delete('/api/tasks/:taskId/labels/:labelName', (req, res) => {
    const taskId = Number(req.params.taskId);
    const labelName = req.params.labelName;
    const task = db.tasks.find(t => t.id === taskId);
    const user = db.users.find(u => u.id === Number(req.headers['x-user-id']));

    if (!task) return res.status(404).json({ message: "Task not found!" });

    if (task.labels) {
        task.labels = task.labels.filter(l => l !== labelName);
        addHistory(task, `Removed label: [${labelName}]`, user ? user.name : "System");
        fs.writeFileSync('./db.json', JSON.stringify(db, null, 2));
    }
    
    res.status(200).json({ task });
});



app.listen(5000, ()=> console.log('Server is running!'));