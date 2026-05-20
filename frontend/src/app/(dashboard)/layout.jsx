import Link from "next/link";
import Image from "next/image";

export default function DashBoardLayout({children}){

    return (
        <div className="flex h-screen bg-gray-100"> 
            <aside className="w-64 bg-white border-r">
                <Image
                    src="/logo.jpg"
                    alt="Jule logo"
                    width={800}
                    height={200}
                    className="w-full max-w-[800px] h-[50px] object-cover object-center rounded-xl"
                    priority
                />
                <nav>
                   <Link id="nav-opt" href={'/boards'}>🛖 Home</Link>
                   <Link id="nav-opt" href={'#'}>🛖 Apt</Link>
                   <Link id="nav-opt" href={'#'}>🛖 Apt</Link>
                </nav>
            </aside>
            <div className="flex flex-col flex-1">
                <header className="h-16 bg-white border-b">
                    <input type="texterea" placeholder="What are you finding?"></input><span id="search-icon">🔍</span>
                </header>
                <main className="flex-1 p-4 overflow-y-auto">
                    {children} 
                </main>
            </div>
        </div>
    )
}