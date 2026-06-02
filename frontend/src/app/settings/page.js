'use client'
import { useState, useEffect } from "react";

const AVATAR_OPTIONS = [
    "https://i.pinimg.com/736x/14/7c/37/147c37f6b51d245c9d069c20d6dde0b7.jpg",
    "https://i.pinimg.com/736x/bf/6d/54/bf6d54b98243e6bf250a89f0e2b6a708.jpg",
    "https://i.pinimg.com/originals/b7/3f/d9/b73fd93e9a6ef75821112cef9443f799.jpg",
    "https://i.pinimg.com/736x/33/a5/36/33a5362c8a48abe235723351f2bb2bba.jpg",
    "https://i.pinimg.com/736x/d3/f8/7f/d3f87f52b78e0cf990587a4b7316191c.jpg",

];

export default function Settings() {
    const [user, setUser] = useState({ name: "", avatar: "", password: "" });
    const [newPassword, setNewPassword] = useState("");

    useEffect(() => {
        const fetchUser = async () => {
            const userId = localStorage.getItem('userId');
            const res = await fetch('http://localhost:5000/api/user', {
                headers: { 'x-user-id': userId }
            });
            const data = await res.json();
            setUser(data.currU);
        };
        fetchUser();
    }, []);

    const handleUpdate = async () => {
        if (!user.avatar) {
            alert("Plz choose avatar!");
            return;
        }

        try {
            const userId = localStorage.getItem('userId');
            const res = await fetch('http://localhost:5000/api/user', {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-user-id': userId 
                },
                body: JSON.stringify({ 
                    avatar: user.avatar, 
                    ...(newPassword && { password: newPassword }) 
                })
            });

            const data = await res.json();

            if (res.ok) {
                alert("Cập nhật thông tin thành công!");
                setUser(prev => ({ ...prev, avatar: user.avatar }));
                setNewPassword(""); 
                location.reload();
            } else {
                alert("Lỗi: " + data.message);
            }
        } catch (error) {
            console.error("Lỗi khi cập nhật:", error);
            alert("Không thể kết nối tới server!");
        }
    };

    return (
        <div className="p-6">
            <div className="max-w-2xl mx-auto p-8 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-md">
                
                <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Account settings</h1>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Choose Avatar:</label>
                        <div className="flex gap-3 flex-wrap">
                            {AVATAR_OPTIONS.map((url, index) => (
                                <button 
                                    key={index}
                                    type="button"
                                    onClick={() => setUser({...user, avatar: url})}
                                    className={`p-1 rounded-full border-2 ${user.avatar === url ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent'}`}
                                >
                                    <img src={url} alt="Avatar option" className="w-12 h-12 rounded-full object-cover" />
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Change password:</label>
                        <input 
                            type="password"
                            className="w-full p-2 border rounded"
                            placeholder="New password"
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={handleUpdate}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        Save changes
                    </button>
                </div>
            </div>
        </div>
    );
}