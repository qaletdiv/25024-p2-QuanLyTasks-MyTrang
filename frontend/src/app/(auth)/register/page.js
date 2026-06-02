'use client'
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

// Danh sách avatar mẫu
const AVATAR_OPTIONS = [
    "https://i.pinimg.com/736x/14/7c/37/147c37f6b51d245c9d069c20d6dde0b7.jpg",
    "https://i.pinimg.com/736x/bf/6d/54/bf6d54b98243e6bf250a89f0e2b6a708.jpg",
    "https://i.pinimg.com/736x/d3/f8/7f/d3f87f52b78e0cf990587a4b7316191c.jpg",
    "https://i.pinimg.com/originals/b7/3f/d9/b73fd93e9a6ef75821112cef9443f799.jpg"
];

export default function Register() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");
    const [avatar, setAvatar] = useState(AVATAR_OPTIONS[0]); 
    const [error, setError] = useState("");
    const route = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const res = await fetch('http://localhost:5000/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password: pass, avatar }),
            });
            const data = await res.json();
            if (res.ok) {
                alert("Sign up successfully!");
                localStorage.setItem('token', data.token);
                localStorage.setItem('userId', data.userId);
                route.push('/boards');
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError("Cannot connect to server!");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a] p-4">
            <div className="w-full max-w-md bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-8 space-y-6">
                <h2 className="text-2xl font-bold text-center dark:text-white">Create Account</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2 dark:text-gray-300">Choose your avatar:</label>
                        <div className="flex gap-3 justify-center mb-4">
                            {AVATAR_OPTIONS.map((url) => (
                                <button 
                                    key={url} type="button"
                                    onClick={() => setAvatar(url)}
                                    className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${avatar === url ? 'border-blue-500 scale-110' : 'border-transparent'}`}
                                >
                                    <img src={url} alt="avatar" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    </div>

                    <input type="text" placeholder="Full Name" required className="w-full px-4 py-2 rounded-lg border dark:bg-[#2d2d2d] dark:text-white" value={name} onChange={(e) => setName(e.target.value)} />
                    <input type="email" placeholder="Email" required className="w-full px-4 py-2 rounded-lg border dark:bg-[#2d2d2d] dark:text-white" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <input type="password" placeholder="Password" required className="w-full px-4 py-2 rounded-lg border dark:bg-[#2d2d2d] dark:text-white" value={pass} onChange={(e) => setPass(e.target.value)} />

                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Sign Up</button>
                    <Link href={'/login'} className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44">Already have an account?</Link>
                </form>
            </div>
        </div>
    );
}