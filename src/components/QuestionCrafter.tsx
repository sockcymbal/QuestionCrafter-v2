'use client'

/* eslint-disable react-hooks/exhaustive-deps */

import React, { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence, LazyMotion, domAnimation } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import {
  Star,
  Sparkles,
  RefreshCw,
  Send,
  Lightbulb,
  Loader2,
  User,
  CheckCircle2,
  Moon,
  Sun,
  Share2,
  Mail,
  X,
  Clock,
  ChevronRight,
  Home,
  Library,
  CreditCard,
  Menu,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  Download,
  Copy,
  ChevronDown,
  Plus,
  ChevronUp,
  Settings,
  Upload,
  Check,
  Info
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import confetti from 'canvas-confetti'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useTheme, ThemeProvider } from 'next-themes'
import emailjs from '@emailjs/browser'
import { Progress } from '@/components/ui/progress'
import { createClient } from '@supabase/supabase-js'

/* ------------------------------
   Type Definitions
------------------------------ */
interface Iteration {
  original: string
  refined: string
  personas: string[]
  finalAnswer: string
  conversationJourney: string
  refinementRationale: string
  harmonyPrinciple: string
  newDimensions: string
  individualAnswers: any[] | string
  timestamp: number
}

interface Stage {
  name: string
  description: string
}

interface ReasoningGraphProps {
  stages?: Stage[]
  currentStage?: number
}

/* ------------------------------
   Data & Constants
------------------------------ */
const defaultStages: Stage[] = [
  { 
    name: 'Initial Analysis', 
    description: 'Deeply exploring the question structure, uncovering hidden assumptions, and identifying core themes and intentions.'
  },
  { 
    name: 'Persona Insights', 
    description: 'Gathering rich, multidisciplinary perspectives from each selected expert persona with their unique cognitive approaches.' 
  },
  { 
    name: 'Critical Evaluation', 
    description: 'Rigorously examining insights through multiple lenses, identifying biases, and surfacing valuable counterpoints.' 
  },
  { 
    name: 'Synthesis', 
    description: 'Weaving diverse perspectives into a coherent tapestry of understanding that transcends individual viewpoints.' 
  },
  { 
    name: 'Refinement', 
    description: 'Meticulously enhancing precision, clarity, and depth while eliminating redundancies and resolving contradictions.' 
  },
  { 
    name: 'Final Convergence', 
    description: 'Harmonizing collective wisdom into an elegant consensus that honors diverse expertise and perspectives.' 
  },
  { 
    name: 'Output Generation', 
    description: 'Crafting a perfectly balanced final question with supporting insights that unlock powerful new dimensions of inquiry.' 
  }
]

/* ------------------------------
   Success Alert Component
------------------------------ */
const SuccessAlert = ({ message, onDismiss }: { message: string; onDismiss?: () => void }) => {
  useEffect(() => {
    // Auto-dismiss after 4 seconds
    const timer = setTimeout(() => {
      if (onDismiss) onDismiss();
    }, 4000);
    
    return () => clearTimeout(timer);
  }, [onDismiss]);
  
  return (
    <Alert variant="default" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700 relative">
      <CheckCircle2 className="h-4 w-4" />
      <AlertTitle>Success!</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
      <button 
        onClick={onDismiss} 
        className="absolute top-2 right-2 text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100"
      >
        <X className="h-4 w-4" />
      </button>
    </Alert>
  );
};
SuccessAlert.displayName = 'SuccessAlert'

/* ------------------------------
   Welcome Section Component
------------------------------ */
const WelcomeSection = ({
  isWelcomeVisible,
  toggleWelcomeVisibility
}: {
  isWelcomeVisible: boolean
  toggleWelcomeVisibility: () => void
}) => {
  return (
    <AnimatePresence>
      {isWelcomeVisible ? (
        <motion.div
          key="welcome-message"
          initial={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-r from-amber-100 to-rose-100 dark:from-amber-900/30 dark:to-rose-900/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
        >
          <Button
            onClick={toggleWelcomeVisibility}
            className="absolute top-2 right-2 p-1"
            variant="ghost"
            size="sm"
            aria-label="Close welcome message"
          >
            <X className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-semibold text-amber-800 dark:text-amber-200 mb-4 flex items-center">
            <HelpCircle className="w-8 h-8 mr-2" />
            Begin Your Journey of Inquiry
          </h2>
          <p className="text-amber-900 dark:text-amber-100 mb-4 text-lg">
            QuestionCrafter is your portal for AI-enhanced inquiry. A thinking partner for the curious, it helps you think through complex topics to uncover insights and deeper understanding.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-amber-900 dark:text-amber-100">
            <li className="flex items-center">
              <span className="mr-2 text-2xl">🌱</span>Plant the seed: Share any question that sparks your curiosity.
            </li>
            <li className="flex items-center">
              <span className="mr-2 text-2xl">🧭</span>Connect with your experts: Engage with a curated ensemble of AI experts chosen to refine your inquiry and spark deeper insights.
            </li>
            <li className="flex items-center">
              <span className="mr-2 text-2xl">🌳</span>Watch it grow: Experience your question evolve through collaborative reasoning.
            </li>
            <li className="flex items-center">
              <span className="mr-2 text-2xl">🔍</span>Explore paths forward: Discover fresh directions, deeper insights, and exciting new questions.
            </li>
          </ol>
          <p className="mt-4 text-amber-800 dark:text-amber-200 font-medium text-lg">
            Every great discovery starts with the right question. Let's explore yours.
          </p>
        </motion.div>
      ) : (
        <motion.div
          key="welcome-closed"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button
            onClick={toggleWelcomeVisibility}
            className="w-full py-2 text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 hover:bg-amber-200 dark:hover:bg-amber-800/50 transition-colors duration-300"
          >
            <HelpCircle className="w-4 h-4 mr-2" />
            How does QuestionCrafter work?
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
WelcomeSection.displayName = 'WelcomeSection'

/* ------------------------------
   Header Component – for consistent top bar
------------------------------ */
const HeaderBar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const menuItems = [
    { icon: <Home className="w-4 h-4" />, label: 'Home', href: '/' },
    { icon: <CreditCard className="w-4 h-4" />, label: 'My Questions', href: '/myquestions' },
    { icon: <Library className="w-4 h-4" />, label: 'Community Library', href: '/library' },
    { icon: <User className="w-4 h-4" />, label: 'Profile', href: '/profile' }
  ]
  return (
    <header className="fixed top-0 left-0 w-full bg-white/70 dark:bg-gray-900/70 backdrop-blur-md shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="mr-2">
            {/* Hamburger Menu Trigger – slides from left */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative hover:bg-amber-500/10 transition-colors duration-200"
                  aria-label="Open navigation menu"
                >
                  <Menu className="w-6 h-6 transition-transform duration-200 hover:scale-110" />
                </Button>
              </SheetTrigger>
              
              <SheetContent 
                side="left" 
                className="w-72 p-0 overflow-hidden border-0 bg-transparent shadow-none"
              >
                <motion.div
                  initial={{ x: '-100%', opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: '-100%', opacity: 0 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 30,
                    opacity: { duration: 0.2 }
                  }}
                  className="h-full w-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg rounded-r-2xl p-6 shadow-xl flex flex-col"
                >
                  <SheetHeader className="mb-8">
                    <motion.div
                      initial={{ y: -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2, duration: 0.4 }}
                    >
                      <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-rose-600 text-transparent bg-clip-text">
                        QuestionCrafter
                      </SheetTitle>
                    </motion.div>
                  </SheetHeader>
                  
                  <nav className="flex-grow">
                    <ul className="space-y-3">
                      {menuItems.map((item, index) => (
                        <motion.li
                          key={item.label}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ 
                            delay: 0.1 + index * 0.08, 
                            duration: 0.3,
                            type: "spring",
                            stiffness: 400,
                            damping: 25
                          }}
                        >
                          <Link href={item.href} passHref>
                            <Button
                              variant="ghost"
                              className={`w-full justify-start group transition-all duration-200 ${
                                pathname === item.href 
                                  ? 'bg-gradient-to-r from-amber-500/10 to-rose-500/5 text-amber-500 font-medium' 
                                  : 'hover:bg-amber-500/5 hover:text-amber-400'
                              } rounded-xl py-3`}
                              onClick={() => setIsOpen(false)}
                            >
                              <span className="relative overflow-hidden flex items-center">
                                <motion.span
                                  initial={{ scale: 1 }}
                                  whileHover={{ scale: 1.2 }}
                                  transition={{ duration: 0.2 }}
                                  className="flex items-center justify-center"
                                >
                                  {item.icon}
                                </motion.span>
                                <span className="ml-3">{item.label}</span>
                                {pathname === item.href && (
                                  <motion.span 
                                    className="absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-amber-500 to-rose-500"
                                    initial={{ width: "0%" }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 0.3, delay: 0.2 }}
                                  />
                                )}
                              </span>
                            </Button>
                          </Link>
                        </motion.li>
                      ))}
                    </ul>
                  </nav>
                  
                  <motion.div 
                    className="mt-auto pt-6 border-t border-gray-200 dark:border-gray-800"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <Button variant="ghost" className="w-full justify-start text-sm text-gray-500 dark:text-gray-400 hover:text-amber-500">
                      <HelpCircle className="w-4 h-4 mr-2" />
                      Help & Support
                    </Button>
                  </motion.div>
                </motion.div>
              </SheetContent>
            </Sheet>
          </div>
          <Link href="/">
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
HeaderBar.displayName = 'HeaderBar'

/* ------------------------------
   Bottom Theme Toggle (reused)
// ------------------------------ */
const BottomToggle = () => {
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
BottomToggle.displayName = 'BottomToggle'

/* ------------------------------
   Action Button Components with Microinteractions
------------------------------ */
const ActionButton = ({ onClick, children, className, disabled = false }) => {
  return (
    <motion.div
      whileHover={{ scale: disabled ? 1 : 1.03 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      transition={{ duration: 0.2 }}
    >
      <Button 
        onClick={onClick} 
        disabled={disabled}
        className={`relative overflow-hidden group ${className}`}
      >
        <motion.span
          className="absolute inset-0 w-full h-full bg-white opacity-0 group-hover:opacity-10"
          initial={{ x: "-100%" }}
          whileHover={{ x: "100%" }}
          transition={{ duration: 0.6 }}
        />
        {children}
      </Button>
    </motion.div>
  );
};

/* ------------------------------
   Refined Progress / Pipeline Component
------------------------------ */
const ReasoningGraph = ({ stages = defaultStages, currentStage = 0 }: ReasoningGraphProps) => {
  // Keep track of previously viewed stages to prevent unnecessary animations
  const [prevStage, setPrevStage] = useState(currentStage);
  
  // Update prevStage when currentStage changes
  useEffect(() => {
    // Small delay to ensure smooth transition
    const timer = setTimeout(() => {
      setPrevStage(currentStage);
    }, 100);
    return () => clearTimeout(timer);
  }, [currentStage]);

  return (
    <div className="space-y-6 p-6 bg-white/50 dark:bg-gray-800/50 rounded-lg shadow-sm">
      {/* Progress bar with smooth spring animation */}
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden relative">
        <motion.div
          layout
          initial={false}
          animate={{ width: `${(currentStage / (stages.length - 1)) * 100}%` }}
          transition={{ 
            type: "spring", 
            stiffness: 60, 
            damping: 15,
            mass: 0.5
          }}
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-300 to-amber-500"
        />
      </div>
      
      <AnimatePresence initial={false} mode="sync">
        <div className="space-y-3">
          {stages.map((stage, index) => {
            // Determine the state for each stage item
            const isActive = index === currentStage;
            const isCompleted = index < currentStage;
            const isUpcoming = index > currentStage;
            const wasActive = index === prevStage;
            
            // Skip full animations for stages that aren't changing status
            const shouldAnimate = isActive || wasActive || (isCompleted && index === currentStage - 1);
            
            return (
              <motion.div
                key={stage.name}
                layout
                initial={false}
                className={`flex items-center space-x-3 p-3 rounded-lg ${
                  isActive
                    ? 'bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 shadow-md'
                    : isCompleted 
                      ? 'bg-white/70 dark:bg-gray-800/70'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                animate={shouldAnimate ? {
                  y: isActive ? 0 : undefined,
                  opacity: isUpcoming ? 0.7 : 1,
                  transition: { duration: 0.3 }
                } : {}}
                transition={{ 
                  layout: { duration: 0.4, ease: "easeInOut" },
                  default: { duration: 0.3 }
                }}
              >
                {/* Stage indicator with context-aware animations */}
                <motion.div
                  layout
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isActive
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                  }`}
                  animate={isActive ? { 
                    scale: [1, 1.1, 1.05],
                  } : {
                    scale: 1 
                  }}
                  transition={{ 
                    duration: 0.5,
                    ease: "easeOut"
                  }}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {isCompleted ? (
                      <motion.div
                        key="completed"
                        initial={index === currentStage - 1 ? { scale: 0, opacity: 0 } : false}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </motion.div>
                    ) : isActive ? (
                      <motion.div
                        key="active"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, ease: "linear", repeat: Infinity }}
                      >
                        <Clock className="w-4 h-4" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="upcoming"
                        initial={false}
                      >
                        <span className="text-xs font-semibold">{index + 1}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
                
                <div className="flex-grow flex flex-col space-y-1 overflow-hidden">
                  <div className="flex items-center space-x-2">
                    <h4 className={`font-semibold text-sm ${isActive ? 'text-amber-700 dark:text-amber-300' : ''}`}>
                      {stage.name}
                    </h4>
                  </div>
                  
                  <motion.p 
                    className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2"
                    animate={{ opacity: isUpcoming ? 0.7 : 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {stage.description}
                  </motion.p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </AnimatePresence>
    </div>
  );
};
ReasoningGraph.displayName = 'ReasoningGraph';

/* ------------------------------
   Auto-resizing TextArea Component
------------------------------ */
const AutoResizeTextArea = ({ value, onChange, readOnly = false, className = '', ...props }) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [value])
  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      className={`w-full resize-none overflow-hidden ${className}`}
      {...props}
    />
  )
}
AutoResizeTextArea.displayName = 'AutoResizeTextArea'

/* ------------------------------
   Persona Card Component with Tooltip & Refined Interaction
------------------------------ */
const PersonaCard = React.memo(({ persona }) => {
  // Safety check for undefined persona
  if (!persona) return null;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Card className="bg-white dark:bg-gray-700 rounded-lg shadow-lg hover:shadow-2xl transition-shadow p-4">
              <CardContent className="space-y-2">
                <div className="flex items-center space-x-2">
                  <User className="w-6 h-6 text-amber-500 dark:text-amber-400" />
                  {/* Display only the role (no name) */}
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">{persona.role || 'Expert'}</h3>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{persona.rationale || 'Selected for their unique expertise'}</p>
              </CardContent>
            </Card>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent className="w-80 p-4">
          <div className="space-y-2">
            <h4 className="font-bold text-lg">{persona.name || 'Expert Guide'}</h4>
            <p><span className="font-semibold">Role:</span> {persona.role || 'Subject Matter Expert'}</p>
            <p><span className="font-semibold">Background:</span> {persona.background || 'Extensive experience in their field'}</p>
            <p><span className="font-semibold">Core Expertise:</span> {Array.isArray(persona.core_expertise) ? persona.core_expertise.join(', ') : 'Specialized knowledge'}</p>
            <p><span className="font-semibold">Cognitive Approach:</span> {persona.cognitive_approach || 'Analytical thinking'}</p>
            <p><span className="font-semibold">Notable Trait:</span> {persona.notable_trait || 'Adaptive problem-solving'}</p>
            <p><span className="font-semibold">Your Guide Because:</span> {persona.rationale || 'Their expertise matches your question'}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
})
PersonaCard.displayName = 'PersonaCard'

/* ------------------------------
   Skeleton Loader for Persona Cards
------------------------------ */
const SkeletonCard = () => (
  <div className="animate-pulse flex-1 bg-gray-200 dark:bg-gray-700 rounded-lg p-4">
    <div className="h-6 w-1/2 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
    <div className="h-4 w-3/4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
    <div className="h-4 w-full bg-gray-300 dark:bg-gray-600 rounded"></div>
  </div>
)
SkeletonCard.displayName = 'SkeletonCard'

/* ------------------------------
   Iteration Timeline Component (Vertical Timeline)
------------------------------ */
const IterationTimeline = ({ iterations }: { iterations: Iteration[] }) => {
  return (
    <div className="space-y-6">
      {iterations.map((iter, index) => (
        <motion.div
          key={iter.timestamp}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-xl text-amber-600">Iteration {index + 1}</span>
            <span className="text-sm text-gray-500">{new Date(iter.timestamp).toLocaleString()}</span>
          </div>
          <p className="mt-2"><strong>Original:</strong> {iter.original}</p>
          <p className="mt-2"><strong>Refined:</strong> {iter.refined}</p>
          <p className="mt-2"><strong>Personas:</strong> {iter.personas.join(', ')}</p>
          <p className="mt-2"><strong>Final Answer:</strong> {iter.finalAnswer}</p>
        </motion.div>
      ))}
    </div>
  )
}
IterationTimeline.displayName = 'IterationTimeline'

/* ------------------------------
   Basic Markdown Formatting Helper
------------------------------ */
function formatMarkdown(md: any) {
  if (!md) return ''
  try {
    // Handle case where md is an object or array
    if (typeof md !== 'string') {
      return String(md)
    }
    return md.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>')
  } catch (error) {
    console.error('Error formatting markdown:', error)
    return String(md) // Convert to string as fallback
  }
}

/* ------------------------------
   Main Component: QuestionCrafter
------------------------------ */
const QuestionCrafter = () => {
  const [question, setQuestion] = useState<string>('')
  const [isWelcomeVisible, setIsWelcomeVisible] = useState<boolean>(true)
  const [isLoadingPersonas, setIsLoadingPersonas] = useState<boolean>(false)
  const [isProcessingQuestion, setIsProcessingQuestion] = useState<boolean>(false)
  const [selectedPersonas, setSelectedPersonas] = useState<any[]>([])
  const [currentStage, setCurrentStage] = useState(0)
  const [refinedQuestion, setRefinedQuestion] = useState('')
  const [refinementRationale, setRefinementRationale] = useState('')
  const [bestAnswer, setBestAnswer] = useState('')
  const [conversationJourney, setConversationJourney] = useState('')
  const [harmonyPrinciple, setHarmonyPrinciple] = useState('')
  const [individualAnswers, setIndividualAnswers] = useState<any>()
  const [feedbackRating, setFeedbackRating] = useState(0)
  const [feedbackComment, setFeedbackComment] = useState('')
  const [newDimensions, setNewDimensions] = useState('')
  const [showNewDimensions, setShowNewDimensions] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [iterationCount, setIterationCount] = useState(0)
  const [showShareModal, setShowShareModal] = useState(false)
  const [recipientEmail, setRecipientEmail] = useState('')
  const [emailjsCredentials, setEmailjsCredentials] = useState<any>(null)
  const [iterationHistory, setIterationHistory] = useState<Iteration[]>([])
  const [isStarred, setIsStarred] = useState<boolean>(false)
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [isSubmittingToLibrary, setIsSubmittingToLibrary] = useState<boolean>(false)
  const [librarySubmitSuccess, setLibrarySubmitSuccess] = useState<boolean>(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [sessionSettings, setSessionSettings] = useState({
    tone: "Balanced",
    length: "Comprehensive",
  });
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()

  const toggleWelcomeVisibility = () => {
    setIsWelcomeVisible(prev => !prev)
  }

  // Save iteration history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('iterationHistory', JSON.stringify(iterationHistory))
  }, [iterationHistory])

  useEffect(() => {
    if (showConfetti) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFB74D', '#FFA726', '#FF9800', '#FB8C00', '#F57C00']
      })
      setTimeout(() => {
        confetti({
          particleCount: 50,
          spread: 100,
          origin: { y: 0.6 }
        })
      }, 250)
      setTimeout(() => setShowConfetti(false), 7000)
    }
  }, [showConfetti])

  useEffect(() => {
    fetch('http://localhost:8000/api/emailjs-credentials')
      .then(response => response.json())
      .then(data => setEmailjsCredentials(data))
      .catch(error => console.error('Error fetching EmailJS credentials:', error))
  }, [])

  useEffect(() => {
    if (isProcessingQuestion) {
      const interval = setInterval(() => {
        setCurrentStage(prev => {
          if (prev < defaultStages.length - 1) {
            return prev + 1
          } else {
            clearInterval(interval)
            return prev
          }
        })
      }, 2500) // Reduced from 4000ms to 2500ms for a more fluid experience
      return () => clearInterval(interval)
    }
  }, [isProcessingQuestion])

  // Update iteration history with all relevant fields
  useEffect(() => {
    if (refinedQuestion && bestAnswer && selectedPersonas) {
      setIterationHistory(prev => [
        ...prev,
        {
          original: question,
          refined: refinedQuestion,
          personas: selectedPersonas && Array.isArray(selectedPersonas) 
            ? selectedPersonas.map((p: any) => p?.role || 'Expert')
            : [],
          finalAnswer: bestAnswer,
          conversationJourney,
          refinementRationale,
          harmonyPrinciple,
          newDimensions,
          individualAnswers,
          timestamp: Date.now()
        }
      ])
    }
  }, [refinedQuestion, bestAnswer, question, selectedPersonas, conversationJourney, refinementRationale, harmonyPrinciple, newDimensions, individualAnswers])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async () => {
    if (!question.trim()) return
    await proceedSubmit()
  }

  const handleExplore = () => {
    setShowNewDimensions(true)
  }

  const handleShareInsights = () => {
    setShowShareModal(true)
  }

  const handleIterate = async () => {
    await proceedIterate()
  }

  const proceedSubmit = useCallback(async () => {
    setError(null)
    setSuccessMessage(null)
    try {
      setIsLoadingPersonas(true)
      setCurrentStage(0)
      const personaResponse = await fetch('http://localhost:8000/select-personas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: question })
      })
      
      if (!personaResponse.ok) {
        throw new Error(`Error selecting personas: ${personaResponse.statusText}`);
      }
      
      const personaData = await personaResponse.json()
      
      // Add safety check for personaData
      if (!personaData || !personaData.selectedPersonas || !Array.isArray(personaData.selectedPersonas)) {
        throw new Error('Invalid persona data received from server');
      }
      
      setSelectedPersonas(personaData.selectedPersonas)
      setIsLoadingPersonas(false)
      setIsProcessingQuestion(true)
      
      const improveResponse = await fetch('http://localhost:8000/improve-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: question, 
          personas: personaData.selectedPersonas 
        })
      })
      
      if (!improveResponse.ok) {
        throw new Error(`Error improving question: ${improveResponse.statusText}`);
      }
      
      const improveData = await improveResponse.json()
      console.log("Individual Answers Debug:", improveData.individual_answers);
      console.log("Type:", typeof improveData.individual_answers);
      setRefinedQuestion(improveData.improved_question)
      setBestAnswer(improveData.final_answer)
      setConversationJourney(improveData.summary)
      setRefinementRationale(improveData.rationale)
      setHarmonyPrinciple(improveData.harmony_principle)
      setNewDimensions(improveData.new_dimensions)
      setIndividualAnswers(improveData.individual_answers)
      setIsProcessingQuestion(false)
      setIterationCount(prev => prev + 1)
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 7000)
      setSuccessMessage('Your question was refined successfully!')
      scrollToTop()
    } catch (err: any) {
      console.error('Error:', err)
      setError(`Something went wrong: ${err.message}`)
      setIsLoadingPersonas(false)
      setIsProcessingQuestion(false)
    }
  }, [question, scrollToTop])
  
  const proceedIterate = useCallback(async () => {
    setError(null)
    setSuccessMessage(null)
    try {
      setIsProcessingQuestion(true)
      setCurrentStage(0)
      
      // Safety check for selectedPersonas
      if (!selectedPersonas || !Array.isArray(selectedPersonas) || selectedPersonas.length === 0) {
        throw new Error('No personas available for iteration. Please try again.');
      }
      
      const improveResponse = await fetch('http://localhost:8000/improve-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: refinedQuestion, 
          personas: selectedPersonas 
        })
      })
      
      if (!improveResponse.ok) {
        throw new Error(`Error iterating question: ${improveResponse.statusText}`);
      }
      
      const improveData = await improveResponse.json()
      setQuestion(refinedQuestion)
      setRefinedQuestion(improveData.improved_question)
      setBestAnswer(improveData.final_answer)
      setConversationJourney(improveData.summary)
      setRefinementRationale(improveData.rationale)
      setHarmonyPrinciple(improveData.harmony_principle)
      setNewDimensions(improveData.new_dimensions)
      setIndividualAnswers(improveData.individual_answers)
      setIsProcessingQuestion(false)
      setIterationCount(prev => prev + 1)
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 7000)
      setSuccessMessage('Iteration successful!')
      scrollToTop()
    } catch (err: any) {
      console.error('Error:', err)
      setError(`Something went wrong: ${err.message}`)
      setIsProcessingQuestion(false)
    }
  }, [refinedQuestion, selectedPersonas, scrollToTop])

  const handleFeedbackSubmit = useCallback(async () => {
    if (feedbackRating === 0) {
      setError('Please provide a star rating before submitting feedback.')
      setSuccessMessage(null)
      return
    }
    if (!emailjsCredentials) {
      setError('EmailJS credentials not available. Please try again later.')
      setSuccessMessage(null)
      return
    }
    try {
      await emailjs.send(
        emailjsCredentials.emailjs_service_id,
        emailjsCredentials.emailjs_template_id_feedback,
        {
          rating: feedbackRating,
          comment: feedbackComment,
          question,
          refinedQuestion,
          refinementRationale,
          conversationJourney,
          bestAnswer
        },
        emailjsCredentials.emailjs_user_id
      )
      setFeedbackRating(0)
      setFeedbackComment('')
      setSuccessMessage('Thank you for your feedback!')
      setError(null)
    } catch (error) {
      console.error('Error submitting feedback:', error)
      setError('There was an error submitting your feedback. Please try again.')
      setSuccessMessage(null)
    }
  }, [feedbackRating, feedbackComment, question, refinedQuestion, refinementRationale, conversationJourney, bestAnswer, emailjsCredentials])

  const handleEmailShare = useCallback(async () => {
    if (!recipientEmail) {
      alert('Please enter a recipient email address.')
      return
    }
    if (!emailjsCredentials) {
      alert('EmailJS credentials not available. Please try again later.')
      return
    }
    try {
      await emailjs.send(
        emailjsCredentials.emailjs_service_id,
        emailjsCredentials.emailjs_template_id_share,
        {
          to_email: recipientEmail,
          question,
          refinedQuestion,
          refinementRationale,
          bestAnswer,
          harmonyPrinciple,
          conversationJourney,
          individualAnswers,
          newDimensions
        },
        emailjsCredentials.emailjs_user_id
      )
      setRecipientEmail('')
      setShowShareModal(false)
      setSuccessMessage('Insights shared successfully!')
      setError(null)
    } catch (error) {
      console.error('Error sharing insights via email:', error)
      setError('There was an error sharing the insights. Please try again.')
      setSuccessMessage(null)
    }
  }, [recipientEmail, emailjsCredentials, question, refinedQuestion, refinementRationale, bestAnswer, harmonyPrinciple, conversationJourney, individualAnswers, newDimensions])

  const shareContent = {
    originalQuestion: question,
    improvedQuestion: refinedQuestion,
    keyInsight: bestAnswer,
    expertPersonas: selectedPersonas.map((p: any) => p.role),
    newExplorationAngle: newDimensions,
    individualAnswers: individualAnswers
  }

  const handleStar = () => {
    if (isStarred) {
      setIsStarred(false);
    } else {
      setShowConfirm(true);
    }
  };

  const submitToLibrary = async () => {
    try {
      setIsSubmittingToLibrary(true);
      setLibrarySubmitSuccess(false);
      
      // Debug the expert answers before submitting
      console.log("Expert answers data:", individualAnswers);
      console.log("Best answer data:", bestAnswer);
      
      // Ensure individualAnswers is in the correct format
      let formattedAnswers = individualAnswers;
      
      // If it's a string (from JSON.stringify), try to parse it
      if (typeof individualAnswers === 'string') {
        try {
          formattedAnswers = JSON.parse(individualAnswers);
        } catch (e) {
          console.warn("Could not parse individualAnswers string:", e);
          // Keep it as a string if parsing fails
        }
      }
      
      const libraryEntry = {
        originalQuestion: question,
        refinedQuestion: refinedQuestion,
        expertPersonas: selectedPersonas.map(e => e.role),
        individualAnswers: formattedAnswers,
        bestAnswer,
        harmonyPrinciple,
        conversationJourney,
        refinementRationale,
        newDimensions,
        userId: "user-1", // This would come from auth in a real app
      };

      const response = await fetch('http://localhost:8000/api/library/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(libraryEntry),
      });

      if (!response.ok) {
        throw new Error('Failed to submit to library');
      }

      setIsStarred(true);
      // Replace alert with visual feedback
      setLibrarySubmitSuccess(true);
      setSuccessMessage('Your question has been added to the Question Library!');
      
      // Auto close the dialog after 1 second
      setTimeout(() => {
        setShowConfirm(false);
        setLibrarySubmitSuccess(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error submitting to library:', error);
      alert("Error: Failed to add your question to the library. Please try again later.");
    } finally {
      setIsSubmittingToLibrary(false);
    }
  };

  const handleImprove = async () => {
    try {
      setIsProcessingQuestion(true)

      // Debug: Checking the personas format we're sending to the backend
      console.log("Selected personas for improve:", selectedPersonas)

      const response = await fetch('http://localhost:8000/api/improve-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          personas: selectedPersonas.map(p => p.role)
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to improve question')
      }
      
      const improveData = await response.json()
      console.log("Individual Answers Debug:", improveData.individual_answers);
      console.log("Type:", typeof improveData.individual_answers);
      
      setRefinedQuestion(improveData.improved_question)
      setBestAnswer(improveData.final_answer)
      setConversationJourney(improveData.summary)
      setHarmonyPrinciple(improveData.harmony_principle)
      setRefinementRationale(improveData.rationale)
      setNewDimensions(improveData.new_dimensions)
      
      // Always store individual answers directly as received from the API
      // The API should always return them as an array of objects
      setIndividualAnswers(improveData.individual_answers);
      
      // Reset progress and advance to final stage
      setCurrentStage(5)
    } catch (error) {
      console.error('Error improving question:', error)
      alert("Error: Failed to improve your question. Please try again later.");
    } finally {
      setIsProcessingQuestion(false)
    }
  }

  return (
    <LazyMotion features={domAnimation}>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-rose-50 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
        {/* Enhancement 6: Smooth animated background */}
        <motion.div
          className="absolute inset-0 -z-10 bg-gradient-to-br from-amber-50 to-rose-50 dark:from-gray-900 dark:to-gray-800"
          animate={{
            background: [
              "linear-gradient(to bottom right, #fff8e6, #ffe4e6)",
              "linear-gradient(to bottom right, #fff1e6, #ffe4f0)",
              "linear-gradient(to bottom right, #fff8e6, #ffe4e6)"
            ]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <HeaderBar />
        {/* Success Alert */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-20 left-0 right-0 mx-auto max-w-4xl z-50"
            >
              <SuccessAlert message={successMessage} onDismiss={() => setSuccessMessage(null)} />
            </motion.div>
          )}
        </AnimatePresence>
        <main className="pt-32 transition-all duration-300 min-h-screen">
          <div className="max-w-4xl mx-auto p-8 space-y-10">
            {/* Welcome Section */}
            <WelcomeSection isWelcomeVisible={isWelcomeVisible} toggleWelcomeVisibility={toggleWelcomeVisibility} />

            {/* Input Section */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-4">
              <Label htmlFor="question" className="text-2xl font-bold text-gray-800 dark:text-gray-200">Your Question</Label>
              <AutoResizeTextArea
                id="question"
                placeholder="Enter your thought-provoking question here..."
                value={question}
                onChange={(e) => setQuestion(e.target.value.slice(0, 1000))}
                className="min-h-[120px] text-lg p-4 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm transition-all duration-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-300 focus:ring-opacity-50 hover:border-amber-300"
                readOnly={isLoadingPersonas || isProcessingQuestion}
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">{1000 - question.length} characters remaining</p>
              <ActionButton
                onClick={handleSubmit}
                disabled={!question.trim() || isLoadingPersonas || isProcessingQuestion}
                className="w-full py-4 text-lg font-bold bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white transition-all duration-300 rounded-md shadow-md relative overflow-hidden group"
              >
                {isLoadingPersonas || isProcessingQuestion ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" /> Begin Exploration
                  </>
                )}
              </ActionButton>
            </motion.div>

            {/* Persona Cards Section */}
            <AnimatePresence>
              {isLoadingPersonas ? (
                <motion.div key="persona-skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="flex flex-row gap-4">
                  {[1, 2, 3].map((_, idx) => (
                    <motion.div
                      key={idx}
                      animate={{ 
                        boxShadow: [
                          "0 0 0 0 rgba(251, 191, 36, 0)",
                          "0 0 0 10px rgba(251, 191, 36, 0.1)",
                          "0 0 0 0 rgba(251, 191, 36, 0)"
                        ] 
                      }}
                      transition={{ 
                        duration: 1.5, 
                        repeat: Infinity,
                        repeatType: "loop",
                        delay: idx * 0.3
                      }}
                      className="rounded-full"
                    >
                      <SkeletonCard />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                selectedPersonas && selectedPersonas.length > 0 && (
                  <>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Your Ensemble of AI Experts</h2>
                    <motion.div 
                      key="selected-personas" 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      transition={{ duration: 0.5 }}
                      className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                    >
                      {(selectedPersonas || []).map((persona: any, index: number) => (
                        <motion.div
                          key={persona?.name || `persona-${index}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ 
                            delay: 0.1 + index * 0.1,
                            duration: 0.4,
                            type: "spring",
                            stiffness: 100,
                            damping: 15
                          }}
                        >
                          <PersonaCard persona={persona} />
                        </motion.div>
                      ))}
                    </motion.div>
                  </>
                )
              )}
            </AnimatePresence>

            {/* Processing / Progress Section */}
            <AnimatePresence>
              {isProcessingQuestion && (
                <motion.div 
                  key="processing-container"
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, delay: 0.2 }} 
                  className="space-y-6"
                >
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Your Question's Journey</h2>
                  {/* Removed key prop to prevent remounting */}
                  <ReasoningGraph stages={defaultStages} currentStage={currentStage} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Insights Section, Action Buttons, and Feedback */}
            {refinedQuestion && !isProcessingQuestion && (
              <>
                <AnimatePresence>
                  <motion.div key="insights" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="space-y-8">
                    {/* Prominent Refined Question */}
                    <div className="p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border-4 border-amber-300">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-2xl font-extrabold text-amber-600">Refined Question</h3>
                        <div className="flex items-center space-x-2">
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={handleStar}
                            className={`p-2 rounded-full transition-all duration-300 ${
                              isStarred
                                ? 'bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300'
                                : 'bg-gray-100 text-gray-400 dark:bg-gray-700 hover:bg-amber-50 hover:text-amber-500 dark:hover:bg-gray-600'
                            }`}
                            aria-label={isStarred ? "Remove from Question Library" : "Add to Question Library"}
                          >
                            <Star className={`h-5 w-5 ${isStarred ? 'fill-amber-500 text-amber-600' : ''}`} />
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={handleShareInsights}
                            className="p-2 rounded-full bg-gray-100 text-gray-400 dark:bg-gray-700 hover:bg-blue-50 hover:text-blue-500 dark:hover:bg-gray-600"
                            aria-label="Share"
                          >
                            <Send className="h-5 w-5" />
                          </motion.button>
                        </div>
                      </div>
                      <div className="text-lg text-gray-800 dark:text-gray-200 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatMarkdown(refinedQuestion) }} />
                    </div>
                    {/* Action Buttons */}
                    <div className="grid grid-cols-3 w-full gap-4 mt-6">
                      <div className="col-span-1">
                        <ActionButton onClick={handleIterate} className="w-full bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white py-3 font-semibold shadow-md hover:shadow-lg transition-all duration-300">
                          Iterate
                        </ActionButton>
                      </div>
                      <div className="col-span-1">
                        <ActionButton onClick={handleExplore} className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-500 text-white py-3 font-semibold shadow-md hover:shadow-lg transition-all duration-300">
                          Explore New Dimensions
                        </ActionButton>
                      </div>
                      <div className="col-span-1">
                        <ActionButton onClick={handleShareInsights} className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white py-3 font-semibold shadow-md hover:shadow-lg transition-all duration-300">
                          Share Insights
                        </ActionButton>
                      </div>
                    </div>
                    {/* Other Insights Stacked Vertically */}
                    <div className="flex flex-col gap-6">
                      <div className="p-6 bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700">
                        <h3 className="text-xl font-bold text-amber-600 dark:text-amber-400 mb-3">Collective Insights</h3>
                        <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-4 rounded-md" dangerouslySetInnerHTML={{ __html: formatMarkdown(bestAnswer) }} />
                      </div>
                      <div className="p-6 bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700">
                        <h3 className="text-xl font-bold text-amber-600 dark:text-amber-400 mb-3">Unifying Principles</h3>
                        <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-4 rounded-md" dangerouslySetInnerHTML={{ __html: formatMarkdown(harmonyPrinciple) }} />
                      </div>
                      <div className="p-6 bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700">
                        <h3 className="text-xl font-bold text-amber-600 dark:text-amber-400 mb-3">Journey Highlights</h3>
                        <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-4 rounded-md" dangerouslySetInnerHTML={{ __html: formatMarkdown(conversationJourney) }} />
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Feedback Section */}
                <div className="mt-8 space-y-6">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Share Your Feedback</h3>
                  <div className="flex items-center justify-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-8 h-8 cursor-pointer transition-colors duration-200 ${
                          star <= feedbackRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'
                        }`}
                        onClick={() => setFeedbackRating(star)}
                      />
                    ))}
                  </div>
                  <AutoResizeTextArea
                    placeholder="Share your feedback on this journey..."
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    className="min-h-[100px] bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-4 rounded-md shadow-sm w-full"
                  />
                  <ActionButton onClick={handleFeedbackSubmit} className="w-full py-3 text-lg font-bold bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white transition-all duration-300 rounded-md shadow-md">
                    <Lightbulb className="w-5 h-5 mr-2" /> Submit Feedback
                  </ActionButton>
                </div>
              </>
            )}

            {/* Iteration Timeline Section */}
            <AnimatePresence>
              {iterationHistory.length > 0 && !isProcessingQuestion && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-4xl mx-auto p-8">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Your Iteration Journey</h2>
                  <IterationTimeline iterations={iterationHistory} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Dialog for Chart New Paths */}
          <Dialog open={showNewDimensions} onOpenChange={setShowNewDimensions}>
            <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto p-0 border-0 bg-transparent shadow-none">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700"
              >
                <DialogHeader>
                  <DialogTitle>New Paths to Explore</DialogTitle>
                  <DialogDescription>Every refined question opens doors to new discoveries.</DialogDescription>
                </DialogHeader>
                <div className="mt-4 space-y-6">
                  <div>
                    <h3 className="text-lg font-bold mb-2">Individual Guide Insights</h3>
                    {Array.isArray(individualAnswers) && individualAnswers.length > 0 ? (
                      <div className="space-y-2">
                        {individualAnswers.map((answer: any, index: number) => (
                          <div key={index} className="p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md">
                            <div className="font-semibold mb-1 text-amber-700 dark:text-amber-400">
                              {answer.name || `Expert ${index + 1}`}
                            </div>
                            <div className="text-sm text-gray-700 dark:text-gray-300">
                              {answer.answer || 'Contributed to question refinement'}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="w-full p-4 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: individualAnswers ? formatMarkdown(individualAnswers) : 'Your journey will reveal unique perspectives here.' }} />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-2">Pathways & Resources</h3>
                    <div className="w-full p-4 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: newDimensions ? formatMarkdown(newDimensions) : 'Ready to uncover new paths for exploration.' }} />
                  </div>
                </div>
              </motion.div>
            </DialogContent>
          </Dialog>

          {/* Dialog for Share Journey */}
          <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
            <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto p-0 border-0 bg-transparent shadow-none">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700"
              >
                <DialogHeader>
                  <DialogTitle>Share Your Journey</DialogTitle>
                  <DialogDescription>Invite others to explore these insights.</DialogDescription>
                </DialogHeader>
                <div className="mt-4 space-y-6">
                  <div className="flex items-center space-x-2">
                    <input
                      type="email"
                      placeholder="Fellow explorer's email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      className="flex-grow p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-300 focus:ring-opacity-50"
                    />
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ActionButton onClick={handleEmailShare} className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600">
                        <Mail className="w-4 h-4" />
                        <span>Share Journey</span>
                      </ActionButton>
                    </motion.div>
                  </div>
                  <div className="p-6 bg-white dark:bg-gray-800 rounded-lg space-y-4">
                    <div>
                      <h3 className="text-lg font-bold mb-2">Initial Question</h3>
                      <div className="text-sm" dangerouslySetInnerHTML={{ __html: formatMarkdown(shareContent.originalQuestion || '') }} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-2">Refined Question</h3>
                      <div className="text-sm" dangerouslySetInnerHTML={{ __html: formatMarkdown(shareContent.improvedQuestion || '') }} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-2">Key Discovery</h3>
                      <div className="text-sm" dangerouslySetInnerHTML={{ __html: formatMarkdown(shareContent.keyInsight || '') }} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-2">Journey Guides</h3>
                      <p className="text-sm">{shareContent.expertPersonas.join(', ')}</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-2">Individual Expert Insights</h3>
                      <div className="space-y-2">
                        {Array.isArray(shareContent.individualAnswers) && shareContent.individualAnswers.length > 0 ? (
                          shareContent.individualAnswers.map((answer: any, index: number) => (
                            <div key={index} className="text-sm p-3 bg-gray-50 dark:bg-gray-700 rounded mb-2 border border-gray-100 dark:border-gray-600">
                              <div className="font-semibold mb-1 text-amber-700 dark:text-amber-400">
                                {answer.name || `Expert ${index + 1}`}
                              </div>
                              <div className="text-gray-700 dark:text-gray-300">
                                {answer.answer || 'Contributed to question refinement'}
                              </div>
                            </div>
                          ))
                        ) : typeof shareContent.individualAnswers === 'object' && shareContent.individualAnswers !== null ? (
                          // Debug view for object format
                          <pre className="text-xs p-2 bg-gray-50 dark:bg-gray-700 rounded overflow-auto max-h-40">
                            {JSON.stringify(shareContent.individualAnswers, null, 2)}
                          </pre>
                        ) : (
                          <p className="text-sm p-2 bg-gray-50 dark:bg-gray-700 rounded">
                            Expert insights contributed to this question refinement.
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-2">Next Steps</h3>
                      <div className="text-sm" dangerouslySetInnerHTML={{ __html: formatMarkdown(shareContent.newExplorationAngle || '') }} />
                    </div>
                  </div>
                </div>
              </motion.div>
            </DialogContent>
          </Dialog>

          {/* Dialog for Star Confirm */}
          <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
            <DialogContent className="sm:max-w-[500px] p-0 border-0 bg-transparent shadow-none">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-xl border border-gray-200 dark:border-gray-700"
              >
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <Star className="h-6 w-6 text-amber-500 fill-amber-500 mr-3" />
                    <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      Share to Question Library
                    </DialogTitle>
                  </div>
                  
                  <DialogDescription className="text-gray-700 dark:text-gray-300 mb-6">
                    Your question transformation will be shared in the public Question Library, 
                    showcasing great examples of effective question refinement for others to learn from.
                  </DialogDescription>
                  
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg mb-6">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Original</div>
                    <div className="text-gray-800 dark:text-gray-200 mb-3">{question}</div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Refined</div>
                    <div className="text-amber-700 dark:text-amber-300">{refinedQuestion}</div>
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowConfirm(false)}
                      className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                      disabled={librarySubmitSuccess}
                    >
                      Cancel
                    </Button>
                    <Button 
                      className={`${librarySubmitSuccess 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-amber-600 hover:bg-amber-700'} text-white transition-all duration-300`}
                      onClick={submitToLibrary}
                      disabled={isSubmittingToLibrary || librarySubmitSuccess}
                    >
                      {isSubmittingToLibrary ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Sharing...
                        </>
                      ) : librarySubmitSuccess ? (
                        <>
                          <Check className="w-4 h-4 mr-2" /> Success!
                        </>
                      ) : (
                        <>
                          <Star className="w-4 h-4 mr-2" /> Share to Library
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </DialogContent>
          </Dialog>

          {/* Success message for library submission */}
          {showSuccessMessage && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed bottom-4 right-4 z-50 bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-800 p-4 rounded-lg shadow-lg flex items-center"
            >
              <div className="bg-green-500 text-white p-1 rounded-full mr-3">
                <Star className="h-5 w-5 fill-white" />
              </div>
              <div>
                <h4 className="font-semibold text-green-800 dark:text-green-200">Successfully shared!</h4>
                <p className="text-sm text-green-700 dark:text-green-300">Your question has been added to the library</p>
              </div>
            </motion.div>
          )}
        </main>
        <BottomToggle />
      </div>
    </LazyMotion>
  )
}
QuestionCrafter.displayName = 'QuestionCrafter'

/* ------------------------------
   App Component
------------------------------ */
const QuestionCrafterApp = () => {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  if (!mounted) return null
  return (
    <ThemeProvider attribute="class">
      <QuestionCrafter />
    </ThemeProvider>
  )
}
QuestionCrafterApp.displayName = 'QuestionCrafterApp'

export default QuestionCrafterApp