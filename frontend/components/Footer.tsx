'use client';
import Link from "next/link";
import { Camera } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-black text-white py-8 px-4 border-t border-gray-800 mt-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-emerald-600 p-2 rounded-md"><Camera className="size-5 text-white" /></span>
            <span className="font-semibold text-lg">CattleCare AI</span>
          </div>
          <p className="text-sm text-gray-300">Smart AI solutions for cattle health<br />and breed detection.</p>
        </div>
        <div>
          <div className="font-bold mb-2">Services</div>
          <ul className="space-y-1 text-sm">
            <li><Link href="/detect" className="hover:underline">Breed Detection</Link></li>
            <li><Link href="/detect" className="hover:underline">Disease Detection</Link></li>
            <li><Link href="/tools" className="hover:underline">Feed & Nutrition</Link></li>
            <li><Link href="/tools" className="hover:underline">Find Nearby Vet</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-bold mb-2">Support</div>
          <ul className="space-y-1 text-sm">
            <li><Link href="#" className="hover:underline">Help Center</Link></li>
            <li><Link href="#" className="hover:underline">Contact Us</Link></li>
            <li><Link href="#" className="hover:underline">About</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-bold mb-2">Legal</div>
          <ul className="space-y-1 text-sm">
            <li><Link href="#" className="hover:underline">Privacy Policy</Link></li>
            <li><Link href="#" className="hover:underline">Terms of Service</Link></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mt-8 border-t border-gray-800 pt-4 text-xs text-gray-400">
        <span>© 2024 CattleCare AI. All rights reserved.</span>
        <span className="mt-2 md:mt-0">Made with <span className="text-red-500">♥</span> for farmers</span>
      </div>
    </footer>
  );
}
