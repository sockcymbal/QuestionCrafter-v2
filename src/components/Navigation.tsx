'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation' // Import from next/navigation for Next.js 13 App Directory
import { Home, Library, User, CreditCard, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

const Navigation = () => {
  const [isOpen, setIsOpen] = React.useState(false)
  const pathname = usePathname() // usePathname returns the current URL path

  const menuItems = [
    { icon: <Home className="w-4 h-4" />, label: 'Home', href: '/' },
    { icon: <CreditCard className="w-4 h-4" />, label: 'My Questions', href: '/myquestions' },
    { icon: <Library className="w-4 h-4" />, label: 'Community Library', href: '/library' },
    { icon: <User className="w-4 h-4" />, label: 'Profile', href: '/profile' }
    // Add additional items as needed
  ]

  return (
    <>
      <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 shadow">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-rose-600 text-transparent bg-clip-text">
              QuestionCrafter
            </h1>
          </Link>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open navigation menu">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
              <SheetHeader>
                <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-rose-600 text-transparent bg-clip-text">
                  QuestionCrafter
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-8">
                <ul className="space-y-4">
                  {menuItems.map((item) => (
                    <li key={item.label}>
                      <Link href={item.href} passHref>
                        <Button
                          variant="ghost"
                          className={`w-full justify-start ${
                            pathname === item.href ? 'bg-amber-500/10 text-amber-500' : ''
                          }`}
                          onClick={() => setIsOpen(false)}
                        >
                          {item.icon}
                          <span className="ml-2">{item.label}</span>
                        </Button>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
        {/* Optionally, add right-side elements (e.g., user avatar) here */}
      </header>
    </>
  )
}

Navigation.displayName = 'Navigation'

export default Navigation