import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="grid items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <h1 className="text-center font-[family-name:var(--font-geist-sans)] text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
          Kanban Welcome!
      </h1>
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        
        <Image
            src="/logo.jpg"
            alt="Jule logo"
            width={800}
            height={200}
            className="w-full max-w-[800px] h-[200px] object-cover object-center rounded-xl"
            priority
        />
        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <Link
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
            href="/login"
            rel="noopener noreferrer"
          >
            Sign in
          </Link>
          <Link
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44"
            href="/register"
            rel="noopener noreferrer"
          >
            Sign up
          </Link>
        </div>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
       Hoang Trang
      </footer>
    </div>
  );
}
