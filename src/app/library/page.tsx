'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ThemeProvider } from 'next-themes'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import {
  Play,
  Pause,
  Star,
  ArrowUp,
  MessageSquare,
  Info,
  Menu,
  Home,
  Library,
  User,
  ChevronDown,
  ChevronUp,
  Send,
  ThumbsUp,
  Sparkles,
  Lightbulb,
  ArrowDown,
  Clock
} from 'lucide-react'

/* -----------------------------------------------------------
   Sample Data – Question Journeys
------------------------------------------------------------ */
const sampleJourneys = [
  {
    id: 1,
    originalQuestion: "How can we make AI more ethical?",
    refinedQuestion:
      "What frameworks and governance structures can we implement to ensure AI development balances innovation with human values, while actively engaging diverse stakeholders in the decision-making process?",
    votes: 342,
    comments: 28,
    category: "Technology Ethics",
    tags: ["AI", "Ethics", "Innovation", "Governance"],
    status: "featured",
    author: "Dr. Sarah Chen",
    authorAvatar: "",
    date: "2 days ago",
    views: 1204,
    impact:
      "Led to the development of an AI ethics framework now used by three major tech companies",
    podcast: {
      title: "The Evolution of AI Ethics",
      duration: "12:34",
      summary:
        "Explore how this question transformed from a broad ethical concern into a practical framework for governance. Dr. Chen discusses how the refined question led to actionable insights that bridge the gap between ethical principles and real-world AI development practices."
    },
    expertPersonas: ["AI Ethics Specialist", "Policy Analyst", "Tech Industry Insider"]
  },
  {
    id: 2,
    originalQuestion: "Why do people resist organizational change?",
    refinedQuestion:
      "How do psychological safety, leadership communication styles, and organizational culture interact to influence employees' readiness for change, and what strategies can leaders employ to address these factors holistically?",
    votes: 285,
    comments: 42,
    category: "Business",
    tags: ["Change Management", "Leadership", "Psychology", "Culture"],
    status: "featured",
    author: "Marcus Johnson",
    authorAvatar: "",
    date: "5 days ago",
    views: 892,
    impact:
      "Transformed change management approach at a Fortune 500 company, reducing resistance by 60%",
    podcast: {
      title: "Rethinking Resistance to Change",
      duration: "15:21",
      summary:
        "Join Marcus as he unpacks how reframing this question led to breakthrough insights about the role of psychological safety in change management. Learn how this new understanding transformed a major organizational restructuring project."
    },
    expertPersonas: ["Organizational Psychologist", "Change Management Consultant", "Corporate Leadership Coach"]
  },
  {
    id: 3,
    originalQuestion: "What makes a good education system?",
    refinedQuestion:
      "How can educational systems balance standardized achievement metrics with personalized learning approaches while fostering creativity, critical thinking, and emotional intelligence in culturally diverse environments?",
    votes: 156,
    comments: 19,
    category: "Education",
    tags: ["Learning", "Innovation", "Policy", "Equity"],
    status: "featured",
    author: "Prof. Emily Torres",
    authorAvatar: "",
    date: "1 week ago",
    views: 567,
    impact:
      "Influenced education policy reforms in three school districts, reaching over 50,000 students",
    podcast: {
      title: "Reimagining Educational Excellence",
      duration: "13:45",
      summary:
        "Prof. Torres discusses how this refined question challenged traditional metrics of educational success and led to innovative approaches that better serve diverse student populations. Discover how this new framework is reshaping classroom practices."
    },
    expertPersonas: ["Education Policy Expert", "Cognitive Scientist", "Multicultural Education Specialist"]
  }
]

/* -----------------------------------------------------------
   PodcastPlayer Component
------------------------------------------------------------ */
function PodcastPlayer({ podcast }: { podcast: any }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  
  // Generate a random progress when the player starts
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 0.5;
          if (newProgress >= 100) {
            clearInterval(interval);
            setIsPlaying(false);
            return 0;
          }
          return newProgress;
        });
      }, 100);
      
      return () => clearInterval(interval);
    }
  }, [isPlaying]);
  
  // Parse duration string to get total seconds (for demo purposes)
  const getDurationInSeconds = (duration: string) => {
    if (!duration) return 60;
    const parts = duration.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    return 60;
  };
  
  // Format current time based on progress
  const formatCurrentTime = () => {
    const totalSeconds = getDurationInSeconds(podcast.duration);
    const currentSeconds = Math.floor((progress / 100) * totalSeconds);
    const minutes = Math.floor(currentSeconds / 60);
    const seconds = currentSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  return (
    <div 
      className="bg-gradient-to-r from-amber-50 to-rose-50 dark:from-gray-800 dark:to-amber-900/20 rounded-lg p-3 shadow-md border border-amber-100/50 dark:border-amber-800/30 transition-all duration-300 hover:shadow-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Podcast header with title and duration */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex-grow truncate">
          <h4 className="text-sm font-medium text-amber-700 dark:text-amber-400 truncate group-hover:text-amber-600 transition-colors">
            {podcast.title}
          </h4>
          <div className="flex items-center text-xs text-gray-500 space-x-1">
            <Clock className="w-3 h-3" />
            <span>{podcast.duration}</span>
          </div>
        </div>
        
        {/* Player controls */}
        <div className="flex-shrink-0 ml-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`rounded-full w-10 h-10 flex items-center justify-center transition-all duration-300 ${
              isPlaying 
                ? 'bg-amber-500 text-white hover:bg-amber-600' 
                : 'text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30'
            }`}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="mb-3">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Time indicators */}
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>{formatCurrentTime()}</span>
          <span>{podcast.duration || '0:00'}</span>
        </div>
      </div>
      
      {/* Summary */}
      <div className="text-xs text-gray-600 dark:text-gray-300 mt-2">
        {podcast.summary}
      </div>
    </div>
  );
}

/* -----------------------------------------------------------
   JourneyCard Component
------------------------------------------------------------ */
function JourneyCard({ journey }: { journey: any }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [comment, setComment] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [isUpvoting, setIsUpvoting] = useState(false)
  const [hasUpvoted, setHasUpvoted] = useState(false)
  const [detailedJourney, setDetailedJourney] = useState<any>(null)
  
  // Handle card expansion and fetch detailed data
  const toggleExpand = async () => {
    if (!isExpanded && !detailedJourney) {
      try {
        const response = await fetch(`http://localhost:8000/api/library/entry/${journey.id}`)
        if (response.ok) {
          const data = await response.json()
          console.log("Detailed journey data:", data)
          console.log("Best answer field:", data.bestAnswer || "Not found")
          console.log("Best answer exists:", Boolean(data.bestAnswer))
          console.log("Best answer type:", typeof data.bestAnswer)
          setDetailedJourney(data)
        }
      } catch (error) {
        console.error('Error fetching journey details:', error)
      }
    }
    setIsExpanded(!isExpanded)
  }
  
  // Handle upvoting a journey
  const handleUpvote = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card expansion when clicking upvote
    
    if (hasUpvoted || isUpvoting) return
    
    setIsUpvoting(true)
    try {
      const response = await fetch('http://localhost:8000/api/library/upvote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ entryId: journey.id }),
      })
      
      if (response.ok) {
        // Update local state to reflect upvote
        journey.votes = (journey.votes || 0) + 1
        setHasUpvoted(true)
      }
    } catch (error) {
      console.error('Error upvoting:', error)
    } finally {
      setIsUpvoting(false)
    }
  }
  
  // Handle submitting a comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation() // Prevent card expansion
    
    if (!comment.trim() || isSubmittingComment) return
    
    setIsSubmittingComment(true)
    try {
      const response = await fetch('http://localhost:8000/api/library/comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entryId: journey.id,
          comment: comment.trim(),
        }),
      })
      
      if (response.ok) {
        // Update local state
        const newComment = {
          id: Date.now(),
          comment: comment.trim(),
          author: 'You',
          date: new Date().toISOString()
        }
        
        if (!detailedJourney) {
          setDetailedJourney({
            ...journey,
            commentList: [newComment],
            comments: (journey.comments || 0) + 1
          })
        } else {
          detailedJourney.commentList = [...(detailedJourney.commentList || []), newComment]
          detailedJourney.comments = (detailedJourney.comments || 0) + 1
        }
        
        // Update journey comment count for display
        journey.comments = (journey.comments || 0) + 1
        
        // Clear comment input
        setComment('')
      }
    } catch (error) {
      console.error('Error posting comment:', error)
    } finally {
      setIsSubmittingComment(false)
    }
  }
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (e) {
      return dateString
    }
  }
  
  return (
    <Card 
      className={`bg-gradient-to-r from-amber-600/20 to-rose-600/20 p-[1px] group-hover:from-amber-600/30 group-hover:to-rose-600/30 transition-all duration-300 cursor-pointer ${isExpanded ? 'ring-2 ring-amber-500' : ''}`}
      onClick={toggleExpand}
    >
      <CardContent className="bg-white dark:bg-gray-800 p-4 rounded-lg">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-stretch">
          {/* Left section – Text Content */}
          <div className="flex-1 sm:min-w-[50%]">
            <div className="flex items-center justify-between mb-2">
              <Badge
                variant="secondary"
                className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs"
              >
                {journey.category}
              </Badge>
              {journey.status === 'featured' && (
                <Badge className="bg-amber-600 text-white text-xs">
                  <Star className="w-3 h-3 mr-1" />
                  Featured
                </Badge>
              )}
            </div>
            
            {/* Single card with transformation highlight */}
            <div className="bg-gradient-to-r from-gray-50 to-amber-50 dark:from-gray-800 dark:to-amber-900/20 rounded-lg p-3 mb-3 border border-amber-100 dark:border-amber-900/30 shadow-sm">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* Left side - Original */}
                <div className="relative">
                  <div className="absolute top-0 left-0 bg-gray-200 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-tl-md rounded-br-md">
                    Original
                  </div>
                  <div className="pt-6 pb-1">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {journey.originalQuestion}
                    </p>
                  </div>
                </div>
                
                {/* Right side - Refined */}
                <div className="relative lg:border-l lg:border-amber-200 lg:dark:border-amber-800/50 pl-0 lg:pl-3">
                  <div className="absolute top-0 left-0 lg:left-3 bg-amber-200 dark:bg-amber-800 text-xs text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-tl-md rounded-br-md flex items-center">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Refined
                  </div>
                  <div className="pt-6 pb-1">
                    <p className="text-base font-medium text-gray-900 dark:text-white">
                      {journey.refinedQuestion}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleUpvote}
                disabled={hasUpvoted || isUpvoting}
                className={`hover:text-amber-600 transition-colors p-0 ${hasUpvoted ? 'text-amber-600' : ''}`}
              >
                {isUpvoting ? (
                  <div className="w-3 h-3 border-t-transparent border-2 border-current rounded-full animate-spin mr-1" />
                ) : (
                  <ThumbsUp className={`w-3 h-3 mr-1 ${hasUpvoted ? 'fill-amber-600' : ''}`} />
                )}
                {journey.votes}
              </Button>
              <div className="flex items-center">
                <MessageSquare className="w-3 h-3 mr-1" />
                {journey.comments || 0}
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-3 h-3" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">{journey.impact}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div className="flex items-center ml-auto">
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </div>
            <div className="mb-2">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Expert Personas:
              </p>
              <div className="flex flex-wrap gap-1">
                {journey.expertPersonas.map((persona: string, index: number) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  >
                    {persona}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          {/* Right section – Podcast Details */}
          <div className="w-full sm:w-72">
            <div className="flex flex-col h-full">
              <PodcastPlayer podcast={journey.podcast} />
            </div>
          </div>
        </div>
        
        {/* Expanded Content - Only visible when expanded */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <Separator className="my-4" />
              
              <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Expert Perspectives */}
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg shadow-sm">
                  <h4 className="text-lg font-semibold text-amber-700 dark:text-amber-400 mb-3 flex items-center">
                    <Lightbulb className="w-5 h-5 mr-2" />
                    Expert Perspectives
                  </h4>
                  
                  <div className="space-y-4">
                    {journey.expertPersonas.map((persona: string, index: number) => {
                      // Find the matching individual answer
                      let expertAnswerText = "This expert contributed unique insights to refine the original question.";
                      
                      // Handle different formats for individualAnswers
                      if (Array.isArray(detailedJourney?.individualAnswers)) {
                        // Try to match by name first (case insensitive)
                        const expertAnswer = detailedJourney.individualAnswers.find(
                          (answer: any) => answer?.name?.toLowerCase() === persona.toLowerCase()
                        );
                        
                        if (expertAnswer && expertAnswer.answer) {
                          expertAnswerText = expertAnswer.answer;
                          console.log(`Found answer for ${persona}:`, expertAnswer.answer.substring(0, 30) + '...');
                        } else {
                          // If not found by name, try by index as fallback
                          if (detailedJourney.individualAnswers[index] && detailedJourney.individualAnswers[index].answer) {
                            expertAnswerText = detailedJourney.individualAnswers[index].answer;
                            console.log(`Found answer for ${persona} by index:`, expertAnswerText.substring(0, 30) + '...');
                          }
                        }
                      } else if (typeof detailedJourney?.individualAnswers === 'object' && 
                                detailedJourney?.individualAnswers !== null) {
                        // Try to access as a keyed object
                        const answers = detailedJourney.individualAnswers;
                        const personaKey = Object.keys(answers).find(
                          key => key.toLowerCase() === persona.toLowerCase()
                        );
                        
                        if (personaKey && answers[personaKey]) {
                          expertAnswerText = answers[personaKey];
                        } else if (answers[index]) {
                          expertAnswerText = answers[index];
                        }
                      } else if (typeof detailedJourney?.individualAnswers === 'string') {
                        // If individualAnswers is a string, try to parse it as JSON first
                        try {
                          const parsedAnswers = JSON.parse(detailedJourney.individualAnswers);
                          if (Array.isArray(parsedAnswers)) {
                            const answer = parsedAnswers.find((a: any) => 
                              a?.name?.toLowerCase() === persona.toLowerCase()
                            );
                            if (answer && answer.answer) {
                              expertAnswerText = answer.answer;
                            }
                          }
                        } catch (e) {
                          // If parsing fails, show for first expert only
                          if (index === 0) {
                            expertAnswerText = detailedJourney.individualAnswers;
                          }
                        }
                      }
                      
                      return (
                        <div key={index} className={`bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border-l-4 ${getExpertBorderColor(index)} transition-all duration-300 hover:shadow-md`}>
                          <p className="font-medium mb-1 text-amber-700 dark:text-amber-400 flex items-center">
                            <User className="w-3.5 h-3.5 mr-1.5 opacity-75" />
                            {persona}
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                            {expertAnswerText}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="flex flex-col gap-6">
                  {/* Synthesized Answer Section */}
                  <div className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/20 border border-amber-200 dark:border-amber-800/30 rounded-lg p-5 shadow-sm">
                    <h4 className="text-lg font-semibold text-amber-700 dark:text-amber-400 mb-3 flex items-center">
                      <Sparkles className="w-5 h-5 mr-2" />
                      Synthesized Answer
                    </h4>
                    <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                      {detailedJourney?.bestAnswer || "This question transformation provides valuable insights through a synthesis of expert perspectives."}
                    </p>
                  </div>
                  
                  {/* Comments Section */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Discussion ({journey.comments || 0})
                    </h4>
                  
                    {/* Comment List */}
                    <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                      {detailedJourney?.commentList?.length > 0 ? (
                        detailedJourney.commentList.map((comment: any) => (
                          <div key={comment.id} className="flex gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-amber-100 text-amber-800 text-xs">
                                {comment.author.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex justify-between items-center">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {comment.author}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatDate(comment.date)}
                                </p>
                              </div>
                              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                {comment.comment}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic py-2">
                          No comments yet. Be the first to add your thoughts!
                        </p>
                      )}
                    </div>
                  
                    {/* Add Comment Form */}
                    <form onSubmit={handleSubmitComment} className="mt-3" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <Textarea
                          placeholder="Add your comment..."
                          className="flex-1 resize-none text-sm"
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Button 
                          type="submit" 
                          className="bg-amber-600 hover:bg-amber-700 text-white self-end"
                          disabled={!comment.trim() || isSubmittingComment}
                        >
                          {isSubmittingComment ? (
                            <div className="w-4 h-4 border-t-transparent border-2 border-current rounded-full animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}

function getExpertBorderColor(index: number) {
  const colors = ["border-amber-500", "border-blue-500", "border-green-500", "border-purple-500"];
  return colors[index % colors.length];
}

/* -----------------------------------------------------------
   HeaderBar Component – with Hamburger Menu at Top Left
------------------------------------------------------------ */
function HeaderBar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const menuItems = [
    { icon: <Home className="w-4 h-4" />, label: 'Home', href: '/' },
    { icon: <Library className="w-4 h-4" />, label: 'Library', href: '/library' },
    { icon: <User className="w-4 h-4" />, label: 'Profile', href: '/profile' }
  ]
  return (
    <header className="fixed top-0 left-0 w-full bg-white dark:bg-gray-900/70 backdrop-blur-md shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <div className="mr-2">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open navigation menu">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-3xl shadow-xl">
                <SheetHeader>
                  <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-rose-600 text-transparent bg-clip-text">
                    Question Library
                  </SheetTitle>
                </SheetHeader>
                <nav className="mt-8">
                  <ul className="space-y-4">
                    {menuItems.map((item) => (
                      <li key={item.label}>
                        <Link href={item.href} passHref>
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
                  </ul>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-rose-600 text-transparent bg-clip-text">
            Question Library
          </h1>
        </div>
      </div>
    </header>
  )
}

/* -----------------------------------------------------------
   Main Component: QuestionLibrary
------------------------------------------------------------ */
function QuestionLibrary() {
  const [activeTab, setActiveTab] = useState('all')
  const [userEntries, setUserEntries] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Fetch user-contributed entries from the API
  useEffect(() => {
    const fetchLibraryEntries = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('http://localhost:8000/api/library/entries')
        if (!response.ok) {
          throw new Error('Failed to fetch library entries')
        }
        const data = await response.json()
        console.log("Fetched library entries:", data)
        setUserEntries(data.entries || [])
      } catch (err) {
        console.error('Error fetching library entries:', err)
        setError('Failed to load user contributions. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchLibraryEntries()
  }, [])
  
  // Combine sample journeys with user-contributed entries
  const allJourneys = [...sampleJourneys, ...userEntries]
  
  // Filter journeys based on active tab
  const filteredJourneys = activeTab === 'all' 
    ? allJourneys 
    : activeTab === 'featured' 
      ? allJourneys.filter(j => j.status === 'featured')
      : allJourneys.filter(j => j.status === 'user_contributed')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      <HeaderBar />
      
      <div className="pt-24 pb-12 px-4 md:px-8 lg:pt-32 lg:px-16 xl:px-24 2xl:px-32">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="max-w-4xl mx-auto mb-16 text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Question Transformation Library
            </h1>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
              Explore how insightful questions can lead to transformative insights and discover new
              ways to reframe your own questions for deeper understanding.
            </p>
            <div className="flex justify-center">
              <Link href="/">
                <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white">
                  Craft Your Own Question
                </Button>
              </Link>
            </div>
          </div>

          {/* Tabs and Filters */}
          <div className="mb-8">
            <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                <TabsList className="bg-white dark:bg-gray-800">
                  <TabsTrigger value="all" className="text-sm">
                    All Questions
                  </TabsTrigger>
                  <TabsTrigger value="featured" className="text-sm">
                    <Star className="w-3 h-3 mr-1" />
                    Featured
                  </TabsTrigger>
                  <TabsTrigger value="user" className="text-sm">
                    <User className="w-3 h-3 mr-1" />
                    User Contributed
                  </TabsTrigger>
                </TabsList>
              </div>
            </Tabs>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading question library...</p>
            </div>
          )}
          
          {/* Error State */}
          {error && (
            <div className="text-center py-8 px-4 bg-red-50 dark:bg-red-900/20 rounded-lg mb-8">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Questions Grid */}
          {!isLoading && !error && (
            <div className="grid grid-cols-1 gap-8">
              {filteredJourneys.length > 0 ? (
                filteredJourneys.map((journey) => (
                  <div key={journey.id} className="group">
                    <JourneyCard journey={journey} />
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {activeTab === 'user' 
                      ? 'No user-contributed questions found yet. Be the first to share one!' 
                      : 'No questions found matching the selected filter.'}
                  </p>
                  {activeTab === 'user' && (
                    <Link href="/">
                      <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                        Create and Share a Question
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QuestionLibrary />
    </ThemeProvider>
  )
}