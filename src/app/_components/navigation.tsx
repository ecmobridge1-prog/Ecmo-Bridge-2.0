import Link from "next/link";

export default function Navigation() {
  return (
    <nav className="bg-white/90 backdrop-blur-sm shadow-md px-6 py-4 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-end items-center">
        <div className="flex space-x-8">
          <Link 
            href="/" 
            className="text-gray-700 hover:text-purple-600 transition-colors duration-200 font-medium"
          >
            Home
          </Link>
          <Link 
            href="/about" 
            className="text-gray-700 hover:text-purple-600 transition-colors duration-200 font-medium"
          >
            About
          </Link>
          <Link 
            href="/contact" 
            className="text-gray-700 hover:text-purple-600 transition-colors duration-200 font-medium"
          >
            Contact
          </Link>
          <Link 
            href="/dashboard" 
            className="text-gray-700 hover:text-purple-600 transition-colors duration-200 font-medium"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </nav>
  );
}
