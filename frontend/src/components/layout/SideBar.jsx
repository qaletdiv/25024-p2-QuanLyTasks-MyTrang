import Link from "next/link";
import Image from "next/image";

export default function SideBar(){

    const handleLogOut = (e)=>{
        e.preventDefault();
        localStorage.removeItem('userId');
        localStorage.removeItem('token');
        window.location.replace('/login');
    }
    return (
        <aside className="w-64 bg-white dark:bg-[#0a0a0a] border-r">
            <Link id="logo-place" href={'/boards'} className="flex items-center gap-2">
                <Image
                    src="/logo.jpg"
                    alt="Jule logo"
                    width={800}
                    height={200}
                    className="w-[200px] max-w-[500px] h-[100px] object-cover object-center rounded-xl my-4 mx-2"
                    priority
                />
                <span className="[writing-mode:vertical-rl] -rotate-180 text-l font-extrabold tracking-[0.2em] text-gray-500">
                    KANBAN
                </span>
            </Link>
            <nav id="nav-place">
                <Link className="nav-opt" href={'/boards'}>Home</Link>
                <Link className="nav-opt" href={'/statistics'}>Statistics</Link>
                <Link className="nav-opt" href={'/settings'}>Settings</Link>
                <button className="nav-opt" onClick={handleLogOut}>Log out</button>
            </nav>
        </aside>
    )
}