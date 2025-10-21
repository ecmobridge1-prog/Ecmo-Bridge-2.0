import Link from "next/link";
import Image from "next/image";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export default function Navigation() {
  return (
    <nav className="bg-white/90 backdrop-blur-sm shadow-md px-6 py-4 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.ico" alt="ECMO Bridge" width={40} height={40} />
          <span className="text-xl font-bold text-gray-800">ECMO Bridge</span>
        </Link>
        <div className="flex items-center space-x-8">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="text-gray-700 hover:text-purple-600 transition-colors duration-200 font-medium">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
          
          <SignedIn>
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10"
                }
              }}
            />
          </SignedIn>
        </div>
      </div>
    </nav>
  );
}
