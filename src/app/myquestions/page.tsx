'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme, ThemeProvider } from 'next-themes'
import emailjs from '@emailjs/browser'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent
} from '@/components/ui/accordion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Clock, ChevronRight, Mail, Menu, HelpCircle, Home, Library, User } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

/* ------------------------------------------------------------------
   Helper: Group iterations by original question text
------------------------------------------------------------------ */
const groupIterationsByQuestion = (history: any[]) => {
  return history.reduce((groups: Record<string, any[]>, iteration) => {
    const key = iteration.original
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(iteration)
    return groups
  }, {})
}

/* ------------------------------------------------------------------
   Bottom Theme Toggle Component – for consistent branding
------------------------------------------------------------------ */
const BottomThemeToggle = () => {
  const { theme, setTheme } = useTheme()
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      >
        <span className="sr-only">Toggle theme</span>
        <svg className="h-5 w-5 text-yellow-500 dark:text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 15a5 5 0 100-10 5 5 0 000 10z" />
        </svg>
      </Button>
    </div>
  )
}
BottomThemeToggle.displayName = 'BottomThemeToggle'

/* ------------------------------------------------------------------
   Header Component – Consistent Top‑Bar with Hamburger Menu
------------------------------------------------------------------ */
const Header = () => {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const menuItems = [
    { icon: <Home className="w-4 h-4" />, label: 'Home', href: '/' },
    { icon: <Library className="w-4 h-4" />, label: 'Community Library', href: '/library' },
    { icon: <User className="w-4 h-4" />, label: 'Profile', href: '/profile' }
  ]
  return (
    <header className="fixed top-0 left-0 w-full bg-white/70 dark:bg-gray-900/70 backdrop-blur-md shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="mr-2">
            {/* Hamburger Menu Trigger */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open navigation menu" className="hover:no-underline">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-3xl shadow-xl">
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <SheetHeader>
                    <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-rose-600 text-transparent bg-clip-text">
                      QuestionCrafter
                    </SheetTitle>
                  </SheetHeader>
                  <nav className="mt-8">
                    <ul className="space-y-4">
                      {menuItems.map((item) => (
                        <li key={item.label}>
                          <Link href={item.href} className="no-underline">
                            <Button
                              variant="ghost"
                              className={`w-full justify-start ${pathname === item.href ? 'bg-amber-500/10 text-amber-500' : ''} hover:no-underline`}
                              onClick={() => setIsOpen(false)}
                            >
                              {item.icon}
                              <span className="ml-2">{item.label}</span>
                            </Button>
                          </Link>
                        </li>
                      ))}
                      <li>
                        <Link href="/myquestions" className="no-underline">
                          <Button
                            variant="ghost"
                            className={`w-full justify-start ${pathname === '/myquestions' ? 'bg-amber-500/10 text-amber-500' : ''} hover:no-underline`}
                            onClick={() => setIsOpen(false)}
                          >
                            <Menu className="w-4 h-4" />
                            <span className="ml-2">My Questions</span>
                          </Button>
                        </Link>
                      </li>
                    </ul>
                  </nav>
                </motion.div>
              </SheetContent>
            </Sheet>
          </div>
          <Link href="/" className="no-underline">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-rose-600 text-transparent bg-clip-text">
              QuestionCrafter
            </h1>
          </Link>
        </div>
        <div className="text-right text-gray-700 dark:text-gray-300 text-lg font-medium">
          Where inquiry begins
        </div>
      </div>
    </header>
  )
}
Header.displayName = 'Header'

/* ------------------------------------------------------------------
   Share Modal Component – For Emailing Insights
------------------------------------------------------------------ */
interface ShareModalProps {
  shareContent: any
  recipientEmail: string
  setRecipientEmail: (email: string) => void
  onClose: () => void
  onShare: () => void
}

const ShareModal = ({
  shareContent,
  recipientEmail,
  setRecipientEmail,
  onClose,
  onShare
}: ShareModalProps) => {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-3xl shadow-2xl p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-amber-600">Share Your Journey</DialogTitle>
          <DialogDescription className="text-lg text-gray-700 dark:text-gray-300">
            Enter your friend&apos;s email address to share the insights from your inquiry.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6">
          <input
            type="email"
            placeholder="Friend's email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            className="w-full p-4 rounded-3xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div className="mt-8 flex justify-end gap-4">
          <Button onClick={onClose} className="bg-gray-500 hover:bg-gray-600 text-white rounded-3xl px-6 py-3 hover:no-underline">
            Cancel
          </Button>
          <Button onClick={onShare} className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-3xl px-6 py-3 hover:no-underline">
            Share Journey
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------------------------------------------
   Accordion Item for Each Question Group – Modern & Harmonized
------------------------------------------------------------------ */
interface QuestionAccordionItemProps {
  original: string
  iterations: any[]
  onShareInsights: (group: { original: string; iterations: any[] }) => void
}

const QuestionAccordionItem = ({ original, iterations, onShareInsights }: QuestionAccordionItemProps) => {
  const latest = iterations[iterations.length - 1]
  return (
    <AccordionItem
      value={original}
      className="bg-gradient-to-r from-amber-600/20 to-rose-600/20 p-[1px] rounded-3xl shadow-xl overflow-hidden"
    >
      <AccordionTrigger className="px-8 py-5 flex flex-col md:flex-row justify-between items-center bg-white dark:bg-gray-800 rounded-t-3xl transition-colors duration-300 hover:bg-gradient-to-br hover:from-white hover:to-gray-50 dark:hover:from-gray-800 dark:hover:to-gray-900 hover:no-underline">
        <div>
          <h2 className="text-2xl font-semibold text-amber-600">Original: {original}</h2>
          <p className="text-lg text-gray-800 dark:text-gray-200">
            Latest refined: <span className="font-medium">{latest.refined}</span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {iterations.length} iteration{iterations.length > 1 && 's'} • Last updated: {new Date(latest.timestamp).toLocaleString()}
          </p>
        </div>
        <ChevronRight className="w-6 h-6 text-gray-400" />
      </AccordionTrigger>
      <AccordionContent className="px-8 py-6 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-b-3xl">
        <div className="space-y-8">
          {iterations.map((iter: any, index: number) => (
            <motion.div
              key={iter.timestamp}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="bg-gradient-to-r from-amber-600/20 to-rose-600/20 p-[1px] rounded-3xl shadow-xl transition-all duration-300"
            >
              <div className="p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-amber-600 mb-2">Iteration {index + 1}</h3>
                <p className="text-sm text-gray-600">{new Date(iter.timestamp).toLocaleString()}</p>
                <div className="mt-3">
                  <strong className="text-gray-800 dark:text-gray-200">Refined Question:</strong>
                  <p className="mt-1 text-lg text-gray-800 dark:text-gray-200">{iter.refined}</p>
                </div>
                <div className="mt-3">
                  <strong className="text-gray-800 dark:text-gray-200">Final Answer:</strong>
                  <p className="mt-1 text-lg text-gray-800 dark:text-gray-200">{iter.finalAnswer}</p>
                </div>
                <div className="mt-3">
                  <strong className="text-gray-800 dark:text-gray-200">Conversation Journey:</strong>
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{iter.conversationJourney}</p>
                </div>
                <div className="mt-3">
                  <strong className="text-gray-800 dark:text-gray-200">Refinement Rationale:</strong>
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{iter.refinementRationale}</p>
                </div>
                <div className="mt-3">
                  <strong className="text-gray-800 dark:text-gray-200">Harmony Principle:</strong>
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{iter.harmonyPrinciple}</p>
                </div>
                <div className="mt-3">
                  <strong className="text-gray-800 dark:text-gray-200">New Dimensions:</strong>
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{iter.newDimensions}</p>
                </div>
                <div className="mt-3">
                  <strong className="text-gray-800 dark:text-gray-200">Individual Insights:</strong>
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{iter.individualAnswers}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <Button
            onClick={() => onShareInsights({ original, iterations })}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-3xl px-6 py-3 hover:no-underline"
          >
            Share Insights
          </Button>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

/* ------------------------------------------------------------------
   Main MyQuestionsPage Component
------------------------------------------------------------------ */
const MyQuestionsPage = () => {
  const [history, setHistory] = useState<any[]>([])
  const [selectedGroup, setSelectedGroup] = useState<{ original: string; iterations: any[] } | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [recipientEmail, setRecipientEmail] = useState('')
  const [emailjsCredentials, setEmailjsCredentials] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const { theme } = useTheme()

  // Load iteration history from localStorage on mount
  useEffect(() => {
    const storedHistory = localStorage.getItem('iterationHistory')
    if (storedHistory) {
      try {
        setHistory(JSON.parse(storedHistory))
      } catch (error) {
        console.error('Error parsing iteration history:', error)
      }
    }
  }, [])

  // Fetch EmailJS credentials
  useEffect(() => {
    fetch('http://localhost:8000/api/emailjs-credentials')
      .then(response => response.json())
      .then(data => setEmailjsCredentials(data))
      .catch(error => console.error('Error fetching EmailJS credentials:', error))
  }, [])

  const grouped = groupIterationsByQuestion(history)
  const groupKeys = Object.keys(grouped)

  // Filter groups based on search query (case-insensitive)
  const filteredGroupKeys = groupKeys.filter(key =>
    key.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Handler to trigger share insights from an accordion item
  const handleShareInsights = (group: { original: string; iterations: any[] }) => {
    setSelectedGroup(group)
    setShowShareModal(true)
  }

  // Handler for sending email using EmailJS for the selected group
  const handleEmailShare = useCallback(async () => {
    if (!recipientEmail) {
      alert('Please enter a recipient email address.')
      return
    }
    if (!emailjsCredentials) {
      alert('EmailJS credentials not available. Please try again later.')
      return
    }
    if (!selectedGroup) {
      alert('No question selected.')
      return
    }
    const latest = selectedGroup.iterations[selectedGroup.iterations.length - 1]
    try {
      await emailjs.send(
        emailjsCredentials.emailjs_service_id,
        emailjsCredentials.emailjs_template_id_share,
        {
          to_email: recipientEmail,
          question: selectedGroup.original,
          refinedQuestion: latest.refined,
          finalAnswer: latest.finalAnswer,
          conversationJourney: latest.conversationJourney,
          refinementRationale: latest.refinementRationale,
          harmonyPrinciple: latest.harmonyPrinciple,
          newDimensions: latest.newDimensions,
          individualInsights: latest.individualAnswers
        },
        emailjsCredentials.emailjs_user_id
      )
      alert('Insights shared successfully via email!')
      setShowShareModal(false)
      setRecipientEmail('')
    } catch (error: any) {
      console.error('Error sharing insights via email:', error)
      alert('There was an error sharing the insights. Please try again.')
    }
  }, [recipientEmail, emailjsCredentials, selectedGroup])

  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <div className="min-h-screen bg-gradient-to-r from-amber-50 to-amber-100 dark:from-gray-900 dark:to-gray-800 p-8 pt-24">
        <Header />
        <h1 className="mt-16 text-4xl font-extrabold text-gray-800 dark:text-gray-200 mb-10">My Questions</h1>

        {/* Search Bar */}
        <div className="mb-8 max-w-5xl mx-auto">
          <input
            type="text"
            placeholder="Search your questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-4 rounded-3xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {filteredGroupKeys.length === 0 ? (
          <p className="text-xl text-gray-700 dark:text-gray-300">
            No questions match your search. Try a different keyword.
          </p>
        ) : (
          <div className="space-y-8">
            <Accordion type="multiple" className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredGroupKeys.map((key) => (
                <QuestionAccordionItem
                  key={key}
                  original={key}
                  iterations={grouped[key]}
                  onShareInsights={handleShareInsights}
                />
              ))}
            </Accordion>
          </div>
        )}

        <AnimatePresence>
          {showShareModal && selectedGroup && (
            <ShareModal
              shareContent={selectedGroup}
              recipientEmail={recipientEmail}
              setRecipientEmail={setRecipientEmail}
              onClose={() => setShowShareModal(false)}
              onShare={handleEmailShare}
            />
          )}
        </AnimatePresence>

        <BottomThemeToggle />
      </div>
    </ThemeProvider>
  )
}

export default MyQuestionsPage