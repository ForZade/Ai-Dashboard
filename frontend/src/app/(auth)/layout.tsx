export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <main className="w-screen h-screen grid place-items-center">
            <div className="w-min h-min bg-[#29292B] rounded-2xl p-8">
                {children}
            </div>
        </main>
    )
}