'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Star, Sparkles, RefreshCw, Send, Lightbulb, Loader2, User, CheckCircle2, Moon, Sun, Share2, Mail, HelpCircle, X, Clock, ChevronRight } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import confetti from 'canvas-confetti';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useTheme } from "next-themes"
import emailjs from '@emailjs/browser'
import { ThemeProvider } from 'next-themes'
import Navigation from '@/components/Navigation'
import { Progress } from "@/components/ui/progress"
import ForceGraph2D from 'react-force-graph-2d'
import { createClient } from '@supabase/supabase-js'

/** Type definitions for iteration data */
interface Iteration {
  original: string;
  refined: string;
  personas: string[];
  finalAnswer: string;
  timestamp: number;
}

interface Stage {
  name: string;
  description: string;
}

interface ReasoningGraphProps {
  stages?: Stage[];
  currentStage?: number;
}

const defaultStages = [
  { name: "Initial Analysis", description: "Analyzing the original question and identifying key themes." },
  { name: "Persona Insights", description: "Gathering unique perspectives from each selected persona." },
  { name: "Critical Evaluation", description: "Critically examining and challenging the initial insights." },
  { name: "Synthesis", description: "Combining and integrating the diverse perspectives and critiques." },
  { name: "Refinement", description: "Polishing and enhancing the synthesized ideas." },
  { name: "Final Convergence", description: "Arriving at a collective agreement on the improved question." },
  { name: "Output Generation", description: "Formulating the final refined question and supporting insights." }
];

/** Graph showing pipeline stages */
const ReasoningGraph = ({ 
  stages = defaultStages, 
  currentStage = 0 
}: ReasoningGraphProps) => {
  return (
    <div className="space-y-2 p-4">
      <motion.div
        initial={{ width: '0%' }}
        animate={{ width: `${(currentStage / (stages.length - 1)) * 100}%` }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        <Progress value={100} className="mb-4" />
      </motion.div>
      {stages.map((stage, index) => (
        <motion.div
          key={stage.name}
          initial={{ opacity: 0, x: -10 }}
          animate={{ 
            opacity: index <= currentStage ? 1 : 0.5,
            x: 0,
            scale: index === currentStage ? 1.05 : 1
          }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className={`flex items-center space-x-3 p-2 rounded-md transition-all duration-300 ease-in-out
            ${index === currentStage 
              ? 'bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 shadow-md' 
              : 'hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
        >
          <motion.div
            className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-300
              ${index < currentStage 
                ? 'bg-green-500 text-white' 
                : index === currentStage
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
              }`}
            whileHover={{ scale: 1.1 }}
          >
            {index < currentStage ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : index === currentStage ? (
              <Clock className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />
            ) : (
              <span className="text-xs font-semibold">{index + 1}</span>
            )}
          </motion.div>
          <div className="flex-grow flex items-center space-x-2 overflow-hidden">
            <h4 className="font-semibold text-sm whitespace-nowrap">{stage.name}</h4>
            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{stage.description}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

const AutoResizeTextArea = ({ value, onChange, readOnly = false, className = '', ...props }) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      className={`w-full resize-none overflow-hidden ${className}`}
      {...props}
    />
  );
};

const PersonaCard = React.memo(({ persona }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Card className="bg-amber-50 dark:bg-gray-700 hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center space-x-2">
                <User className="w-6 h-6 text-amber-500 dark:text-amber-400" />
                <h3 className="text-lg font-semibold text-amber-700 dark:text-amber-300">{persona.role}</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">{persona.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{persona.rationale}</p>
            </CardContent>
          </Card>
        </motion.div>
      </TooltipTrigger>
      <TooltipContent className="w-80 p-4">
        <div className="space-y-2">
          <h4 className="font-bold text-lg">{persona.name}</h4>
          <p><span className="font-semibold">Role:</span> {persona.role}</p>
          <p><span className="font-semibold">Background:</span> {persona.background}</p>
          <p><span className="font-semibold">Core Expertise:</span> {persona.core_expertise.join(', ')}</p>
          <p><span className="font-semibold">Cognitive Approach:</span> {persona.cognitive_approach}</p>
          <p><span className="font-semibold">Notable Trait:</span> {persona.notable_trait}</p>
          <p><span className="font-semibold">Your Guide Because:</span> {persona.rationale}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
));

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme()
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="fixed top-4 right-4 md:right-8 z-50"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

const SuccessAlert = ({ message }) => (
  <Alert variant="default" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700">
    <CheckCircle2 className="h-4 w-4" />
    <AlertTitle>Success!</AlertTitle>
    <AlertDescription>{message}</AlertDescription>
  </Alert>
);

/** Basic markdown formatting: bold + line breaks */
function formatMarkdown(md: string) {
  if (!md) return '';
  let html = md
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');
  return html;
}

function QuestionCrafter() {
  const [question, setQuestion] = useState('')
  const [isLoadingPersonas, setIsLoadingPersonas] = useState(false)
  const [isProcessingQuestion, setIsProcessingQuestion] = useState(false)
  const [currentStage, setCurrentStage] = useState(0)
  const [refinedQuestion, setRefinedQuestion] = useState("")
  const [refinementRationale, setRefinementRationale] = useState("")
  const [bestAnswer, setBestAnswer] = useState("")
  const [conversationJourney, setConversationJourney] = useState("")
  const [harmonyPrinciple, setHarmonyPrinciple] = useState("")
  const [individualAnswers, setIndividualAnswers] = useState("")
  const [feedbackRating, setFeedbackRating] = useState(0)
  const [feedbackComment, setFeedbackComment] = useState('')
  const [newDimensions, setNewDimensions] = useState("")
  const [showNewDimensions, setShowNewDimensions] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [selectedPersonas, setSelectedPersonas] = useState([])
  const [showConfetti, setShowConfetti] = useState(false)
  const [iterationCount, setIterationCount] = useState(0)
  const [showShareModal, setShowShareModal] = useState(false)
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailjsCredentials, setEmailjsCredentials] = useState(null);
  const [isWelcomeVisible, setIsWelcomeVisible] = useState(true);
  const { theme, setTheme } = useTheme()

  // Stage details, idea graph
  const [stageDetails, setStageDetails] = useState({});
  const [ideaGraph, setIdeaGraph] = useState({ nodes: [], edges: [] });

  // Iteration History
  const [iterationHistory, setIterationHistory] = useState<Iteration[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  useEffect(() => {
    if (showConfetti) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFB74D', '#FFA726', '#FF9800', '#FB8C00', '#F57C00']
      });
      setTimeout(() => {
        confetti({
          particleCount: 50,
          spread: 100,
          origin: { y: 0.6 }
        });
      }, 250);
    }
  }, [showConfetti]);

  useEffect(() => {
    // Fetch EmailJS credentials
    fetch('http://localhost:8000/api/emailjs-credentials')
      .then(response => response.json())
      .then(data => setEmailjsCredentials(data))
      .catch(error => console.error('Error fetching EmailJS credentials:', error));

    // Check welcome message
    const storedVisibility = localStorage.getItem('welcomeMessageVisible');
    if (storedVisibility !== null) {
      setIsWelcomeVisible(JSON.parse(storedVisibility));
    }

    // dark mode default
    const userPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    if (userPrefersDark) {
      setTheme('dark')
    }
  }, []);

  // Animate multi-stage LLM pipeline
  useEffect(() => {
    if (isProcessingQuestion) {
      const interval = setInterval(() => {
        setCurrentStage(prev => {
          if (prev < defaultStages.length - 1) {
            return prev + 1;
          } else {
            clearInterval(interval);
            return prev;
          }
        });
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [isProcessingQuestion]);

  // Whenever we finalize a refinedQuestion & bestAnswer => record iteration
  useEffect(() => {
    if (refinedQuestion && bestAnswer) {
      setIterationHistory(prev => [
        ...prev,
        {
          original: question,
          refined: refinedQuestion,
          personas: selectedPersonas.map(p => p.role),
          finalAnswer: bestAnswer,
          timestamp: Date.now()
        }
      ]);
    }
  }, [refinedQuestion, bestAnswer, question, selectedPersonas]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleWelcomeVisibility = () => {
    setIsWelcomeVisible(prev => {
      const newValue = !prev;
      localStorage.setItem('welcomeMessageVisible', JSON.stringify(newValue));
      return newValue;
    });
  };

  /**
   * "Begin Exploration" button
   */
  const handleSubmit = async () => {
    if (!question.trim()) return;
    await proceedSubmit();
  };

  /**
   * "Chart New Paths" button
   */
  const handleExplore = () => {
    setShowNewDimensions(true);
  };

  /**
   * "Share Journey" button
   */
  const handleShareInsights = () => {
    setShowShareModal(true);
  };

  /**
   * "Iterate" button
   */
  const handleIterate = async () => {
    await proceedIterate();
  };

  /**
   * Actual logic after user submits a new question for exploration
   */
  const proceedSubmit = useCallback(async () => {
    setError(null);
    setSuccessMessage(null);

    try {
      setIsLoadingPersonas(true);
      setCurrentStage(0);

      // Fetch personas
      const personaResponse = await fetch('http://localhost:8000/select-personas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: question })
      });
      const personaData = await personaResponse.json();
      
      // Use the key 'selectedPersonas' from the response
      setSelectedPersonas(personaData.selectedPersonas);
      setIsLoadingPersonas(false);

      // Fetch improved question
      setIsProcessingQuestion(true);
      const improveResponse = await fetch('http://localhost:8000/improve-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: question, personas: personaData.selectedPersonas })
      });
      const improveData = await improveResponse.json();

      setRefinedQuestion(improveData.improved_question);
      setBestAnswer(improveData.final_answer);
      setConversationJourney(improveData.summary);
      setRefinementRationale(improveData.rationale);
      setHarmonyPrinciple(improveData.harmony_principle);
      setNewDimensions(improveData.new_dimensions);
      setIndividualAnswers(improveData.individual_answers);
      setStageDetails(improveData.stage_details || {});
      setIdeaGraph(improveData.idea_graph || { nodes: [], edges: [] });

      setIsProcessingQuestion(false);
      setIterationCount(prev => prev + 1);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 7000);

    } catch (err: any) {
      console.error('Error:', err);
      setError(`An error occurred: ${err.message}`);
      setIsLoadingPersonas(false);
      setIsProcessingQuestion(false);
    }
  }, [question]);

  /**
   * Actual logic after user chooses to iterate on the refined question
   */
  const proceedIterate = useCallback(async () => {
    setError(null);
    setSuccessMessage(null);

    try {
      const newQuestion = refinedQuestion;
      setQuestion(newQuestion);
      setIsLoadingPersonas(true);
      setCurrentStage(0);

      setSelectedPersonas([]);
      setRefinedQuestion("");
      setBestAnswer("");
      setConversationJourney("");
      setRefinementRationale("");
      setHarmonyPrinciple("");
      setNewDimensions("");
      setIndividualAnswers("");
      setStageDetails({});
      setIdeaGraph({ nodes: [], edges: [] });
      
      scrollToTop();

      const personaResponse = await fetch('http://localhost:8000/select-personas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newQuestion })
      });
      const personaData = await personaResponse.json();
      
      // Use the key 'selectedPersonas' from the response
      setSelectedPersonas(personaData.selectedPersonas);
      setIsLoadingPersonas(false);

      setIsProcessingQuestion(true);
      const improveResponse = await fetch('http://localhost:8000/improve-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newQuestion, personas: personaData.selectedPersonas })
      });
      const improveData = await improveResponse.json();

      setRefinedQuestion(improveData.improved_question);
      setBestAnswer(improveData.final_answer);
      setConversationJourney(improveData.summary);
      setRefinementRationale(improveData.rationale);
      setHarmonyPrinciple(improveData.harmony_principle);
      setNewDimensions(improveData.new_dimensions);
      setIndividualAnswers(improveData.individual_answers);
      setStageDetails(improveData.stage_details || {});
      setIdeaGraph(improveData.idea_graph || { nodes: [], edges: [] });

      setIsProcessingQuestion(false);
      setIterationCount(prev => prev + 1);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 7000);

    } catch (err: any) {
      console.error('Error:', err);
      setError(`An error occurred: ${err.message}`);
      setIsLoadingPersonas(false);
      setIsProcessingQuestion(false);
    }
  }, [refinedQuestion]);

  /**
   * handleFeedbackSubmit
   */
  const handleFeedbackSubmit = useCallback(async () => {
    if (feedbackRating === 0) {
      setError("Please provide a star rating before submitting feedback.");
      setSuccessMessage(null);
      return;
    }

    if (!emailjsCredentials) {
      setError("EmailJS credentials not available. Please try again later.");
      setSuccessMessage(null);
      return;
    }

    try {
      await emailjs.send(
        emailjsCredentials.emailjs_service_id,
        emailjsCredentials.emailjs_template_id_feedback,
        {
          rating: feedbackRating,
          comment: feedbackComment,
          question: question,
          refinedQuestion: refinedQuestion,
          refinementRationale: refinementRationale,
          conversationJourney: conversationJourney,
          bestAnswer: bestAnswer
        },
        emailjsCredentials.emailjs_user_id
      );
      
      setFeedbackRating(0);
      setFeedbackComment('');
      setSuccessMessage("Thank you for your feedback!");
      setError(null);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setError("There was an error submitting your feedback. Please try again.");
      setSuccessMessage(null);
    }
  }, [
    feedbackRating, 
    feedbackComment, 
    question, 
    refinedQuestion, 
    refinementRationale, 
    conversationJourney, 
    bestAnswer, 
    emailjsCredentials
  ]);

  const handleEmailShare = useCallback(async () => {
    if (!recipientEmail) {
      setError("Please enter a recipient email address.");
      setSuccessMessage(null);
      return;
    }

    if (!emailjsCredentials) {
      setError("EmailJS credentials not available. Please try again later.");
      setSuccessMessage(null);
      return;
    }

    try {
      await emailjs.send(
        emailjsCredentials.emailjs_service_id,
        emailjsCredentials.emailjs_template_id_share,
        {
          to_email: recipientEmail,
          question: question,
          refinedQuestion: refinedQuestion,
          refinementRationale: refinementRationale,
          bestAnswer: bestAnswer,
          harmonyPrinciple: harmonyPrinciple,
          conversationJourney: conversationJourney,
          individualAnswers: individualAnswers,
          newDimensions: newDimensions
        },
        emailjsCredentials.emailjs_user_id
      );

      setRecipientEmail('');
      setShowShareModal(false);
      setSuccessMessage("Insights shared successfully!");
      setError(null);
    } catch (error) {
      console.error('Error sharing insights via email:', error);
      setError("There was an error sharing the insights. Please try again.");
      setSuccessMessage(null);
    }
  }, [
    recipientEmail,
    question,
    refinedQuestion,
    refinementRationale,
    bestAnswer,
    harmonyPrinciple,
    conversationJourney,
    individualAnswers,
    newDimensions,
    emailjsCredentials
  ]);

  const shareContent = {
    originalQuestion: question,
    improvedQuestion: refinedQuestion,
    keyInsight: bestAnswer,
    expertPersonas: selectedPersonas.map(persona => persona.role),
    newExplorationAngle: newDimensions
  };

  return (
    <div className="min-h-screen bg-amber-50 dark:bg-gray-900">
      <Navigation />
      
      <ThemeToggle />

      <main className="transition-all duration-300 ease-in-out md:pl-64 min-h-screen">
        <div className="max-w-4xl mx-auto p-8">
          <Card className="overflow-hidden shadow-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-r from-amber-400 to-amber-600 text-white p-8"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <Sparkles className="w-10 h-10" />
                  <div className="flex flex-col">
                    <h1 className="text-3xl font-bold">QuestionCrafter</h1>
                    <motion.p 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                      className="text-sm font-medium text-amber-100 italic tracking-wide"
                    >
                      Where inquiry begins
                    </motion.p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-semibold">Iterations: {iterationCount}</span>
                  <RefreshCw className="w-6 h-6 animate-spin" style={{ animationDuration: '4s' }} />
                </div>
              </div>
              <p className="text-gray-100 text-lg mt-2">
                Transform your questions into deeper understanding
              </p>
            </motion.div>

            <CardContent className="space-y-8 p-8">
              <AnimatePresence>
                {isWelcomeVisible && (
                  <motion.div
                    key="welcome-message"
                    initial={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-amber-50 dark:bg-amber-900/30 rounded-lg p-6 shadow-md relative overflow-hidden"
                  >
                    <Button
                      onClick={toggleWelcomeVisibility}
                      className="absolute top-2 right-2 p-1"
                      variant="ghost"
                      size="sm"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <h2 className="text-xl font-semibold text-amber-800 dark:text-amber-200 mb-4 flex items-center">
                      <HelpCircle className="w-6 h-6 mr-2" />
                      Begin Your Journey of Discovery
                    </h2>
                    <p className="text-amber-900 dark:text-amber-100 mb-4">
                      QuestionCrafter is your starting point for deeper understanding. Like a compass for curiosity, it helps you chart the right course through complex topics.
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-amber-900 dark:text-amber-100">
                      <li>Plant the seed: Share any question that sparks your curiosity.</li>
                      <li>Meet your guides: Connect with AI personas chosen for your unique inquiry.</li>
                      <li>Watch it grow: Experience your question evolve through collaborative reasoning.</li>
                      <li>Explore paths forward: Discover new directions, deeper insights, and new questions.</li>
                    </ol>
                    <p className="mt-4 text-amber-800 dark:text-amber-200 font-medium">
                      Every great discovery starts with the right question. Let's find yours.
                    </p>
                  </motion.div>
                )}

                {!isWelcomeVisible && (
                  <motion.div
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

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-4"
              >
                <Label htmlFor="question" className="text-xl font-semibold text-amber-700 dark:text-amber-300">
                  Your Question
                </Label>
                <AutoResizeTextArea
                  id="question"
                  placeholder="Enter your thought-provoking question..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value.slice(0, 500))}
                  className="min-h-[120px] text-lg transition-all duration-300 focus:ring-2 focus:ring-amber-500 p-3 rounded-md border border-amber-200 dark:border-amber-700 bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100"
                  readOnly={isLoadingPersonas || isProcessingQuestion}
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {500 - question.length} characters remaining
                </p>
                <Button 
                  onClick={handleSubmit} 
                  disabled={!question.trim() || isLoadingPersonas || isProcessingQuestion}
                  className="w-full mt-4 py-6 text-lg font-semibold bg-gradient-to-r from-amber-400 to-rose-400 hover:from-amber-500 hover:to-rose-500 text-white transition-all duration-300"
                >
                  {isLoadingPersonas || isProcessingQuestion ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Begin Exploration
                    </>
                  )}
                </Button>
              </motion.div>

              <AnimatePresence mode="wait">
                {selectedPersonas.length > 0 && (
                  <motion.div
                    key="selected-personas"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <h2 className="text-2xl font-semibold text-amber-700 dark:text-amber-300 mb-4">
                      Your Guides for This Journey
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {selectedPersonas.map((persona) => (
                        <PersonaCard key={persona.name} persona={persona} />
                      ))}
                    </div>
                  </motion.div>
                )}

                {isProcessingQuestion && (
                  <motion.div
                    key="processing"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <h2 className="text-2xl font-semibold text-amber-700 dark:text-amber-300 mb-4">
                      Your Question's Journey
                    </h2>
                    <ReasoningGraph stages={defaultStages} currentStage={currentStage} />
                  </motion.div>
                )}

                {refinedQuestion && !isProcessingQuestion && (
                  <motion.div
                    key="insights"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="space-y-6"
                  >
                    <h2 className="text-2xl font-semibold text-amber-700 dark:text-amber-300 mb-4">
                      Discoveries & Insights
                    </h2>
                    <Accordion type="single" collapsible defaultValue="detailed-insights" className="w-full">
                      <AccordionItem value="detailed-insights">
                        <AccordionTrigger className="text-lg font-semibold text-amber-700 dark:text-amber-300">
                          Detailed Insights
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="p-4 bg-amber-50 dark:bg-gray-700 rounded-xl shadow-lg border border-amber-100 dark:border-amber-600/50 mb-4">
                            <h3 className="text-xl font-bold text-amber-700 dark:text-amber-300 mb-3">
                              Refined Question
                            </h3>
                            <div
                              className="text-lg text-gray-700 dark:text-gray-200 leading-relaxed mb-6"
                              dangerouslySetInnerHTML={{ __html: formatMarkdown(refinedQuestion) }}
                            />
                            <div 
                              dangerouslySetInnerHTML={{ __html: formatMarkdown(refinementRationale) }}
                              className="text-gray-700 dark:text-gray-200 leading-relaxed"
                            />
                          </div>

                          <div className="p-4 bg-amber-50 dark:bg-gray-700 rounded-xl shadow-lg border border-amber-100 dark:border-amber-600/50 mb-4">
                            <h3 className="text-xl font-bold text-amber-700 dark:text-amber-300 mb-3">
                              Collective Insights
                            </h3>
                            <div
                              className="bg-white dark:bg-gray-800 border-amber-200 dark:border-amber-700 p-3 rounded-md"
                              dangerouslySetInnerHTML={{ __html: formatMarkdown(bestAnswer) }}
                            />
                          </div>

                          <div className="p-4 bg-amber-50 dark:bg-gray-700 rounded-xl shadow-lg border border-amber-100 dark:border-amber-600/50 mb-4">
                            <h3 className="text-xl font-bold text-amber-700 dark:text-amber-300 mb-3">
                              Unifying Principles
                            </h3>
                            <div
                              className="bg-white dark:bg-gray-800 border-amber-200 dark:border-amber-700 p-3 rounded-md"
                              dangerouslySetInnerHTML={{ __html: formatMarkdown(harmonyPrinciple) }}
                            />
                          </div>

                          <div className="p-4 bg-amber-50 dark:bg-gray-700 rounded-xl shadow-lg border border-amber-100 dark:border-amber-600/50">
                            <h3 className="text-xl font-bold text-amber-700 dark:text-amber-300 mb-3">
                              Journey Highlights
                            </h3>
                            <div
                              className="bg-white dark:bg-gray-800 border-amber-200 dark:border-amber-700 p-3 rounded-md"
                              dangerouslySetInnerHTML={{ __html: formatMarkdown(conversationJourney) }}
                            />
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mt-6">
                      <Button 
                        onClick={handleIterate} 
                        className="flex-1 bg-gradient-to-r from-amber-400 to-rose-400 hover:from-amber-500 hover:to-rose-500 text-white transition-all duration-300"
                      >
                        <RefreshCw className="mr-2 h-5 w-5" />
                        Iterate
                      </Button>
                      <Button 
                        onClick={handleExplore} 
                        className="flex-1 bg-gradient-to-r from-rose-400 to-pink-400 hover:from-rose-500 hover:to-pink-500 text-white transition-all duration-300"
                      >
                        <Sparkles className="mr-2 h-5 w-5" />
                        Chart New Paths
                      </Button>
                      <Button 
                        onClick={handleShareInsights} 
                        className="flex-1 bg-gradient-to-r from-blue-400 to-indigo-400 hover:from-blue-500 hover:to-indigo-500 text-white transition-all duration-300"
                      >
                        <Share2 className="mr-2 h-5 w-5" />
                        Share Journey
                      </Button>
                    </div>

                    <div className="mt-8">
                      <Button variant="outline" onClick={() => setShowHistoryModal(true)}>
                        View Iteration History
                      </Button>
                    </div>

                    <div className="mt-8 space-y-4">
                      <h3 className="text-lg font-semibold text-amber-700 dark:text-amber-300">
                        Share Your Feedback
                      </h3>
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
                        className="min-h-[100px] bg-white/50 dark:bg-gray-700/50 border-amber-200 dark:border-amber-700 p-3 rounded-md w-full"
                      />
                      <Button 
                        onClick={handleFeedbackSubmit} 
                        className="w-full bg-gradient-to-r from-amber-400 to-rose-400 hover:from-amber-500 hover:to-rose-500 text-white transition-all duration-300"
                      >
                        <Lightbulb className="w-5 h-5 mr-2" />
                        Submit Feedback
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {successMessage && <SuccessAlert message={successMessage} />}

              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Dialog for Chart New Paths */}
      <Dialog open={showNewDimensions} onOpenChange={setShowNewDimensions}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Paths to Explore</DialogTitle>
            <DialogDescription>
              Every refined question opens doors to new discoveries.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-6">
            <div>
              <h3 className="text-lg font-bold mb-2">Individual Guide Insights</h3>
              <div
                className="w-full p-4 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md whitespace-pre-wrap"
                dangerouslySetInnerHTML={{
                  __html: individualAnswers 
                    ? formatMarkdown(individualAnswers) 
                    : 'Your journey will reveal unique perspectives here.'
                }}
              />
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2">Pathways & Resources</h3>
              <div 
                className="w-full p-4 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md whitespace-pre-wrap"
                dangerouslySetInnerHTML={{
                  __html: newDimensions 
                    ? formatMarkdown(newDimensions) 
                    : 'Ready to uncover new paths for exploration.'
                }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog for Share Journey */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Share Your Journey</DialogTitle>
            <DialogDescription>
              Invite others to explore these insights.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-6">
            <div className="flex items-center space-x-2">
              <input
                type="email"
                placeholder="Fellow explorer's email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="flex-grow p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <Button onClick={handleEmailShare} className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>Share Journey</span>
              </Button>
            </div>
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg space-y-4">
              <div>
                <h3 className="text-lg font-bold mb-2">Initial Question</h3>
                <div
                  className="text-sm"
                  dangerouslySetInnerHTML={{ __html: formatMarkdown(shareContent.originalQuestion || '') }}
                />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">Refined Question</h3>
                <div
                  className="text-sm"
                  dangerouslySetInnerHTML={{ __html: formatMarkdown(shareContent.improvedQuestion || '') }}
                />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">Key Discovery</h3>
                <div
                  className="text-sm"
                  dangerouslySetInnerHTML={{ __html: formatMarkdown(shareContent.keyInsight || '') }}
                />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">Journey Guides</h3>
                <p className="text-sm">{shareContent.expertPersonas.join(", ")}</p>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">Next Steps</h3>
                <div
                  className="text-sm"
                  dangerouslySetInnerHTML={{ __html: formatMarkdown(shareContent.newExplorationAngle || '') }}
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Iteration History */}
      <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
        <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Iteration History</DialogTitle>
            <DialogDescription>All refined versions so far:</DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 overflow-x-auto border border-amber-300 dark:border-gray-600 rounded shadow-sm">
            <table className="w-full divide-y divide-amber-200 dark:divide-gray-700 text-sm">
              <thead className="bg-amber-100 dark:bg-gray-700">
                <tr>
                  <th className="p-3 text-left font-bold text-amber-700 dark:text-gray-200">Iteration #</th>
                  <th className="p-3 text-left font-bold text-amber-700 dark:text-gray-200">Original</th>
                  <th className="p-3 text-left font-bold text-amber-700 dark:text-gray-200">Refined</th>
                  <th className="p-3 text-left font-bold text-amber-700 dark:text-gray-200">Personas</th>
                  <th className="p-3 text-left font-bold text-amber-700 dark:text-gray-200">Final Answer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100 dark:divide-gray-700">
                {iterationHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-600 dark:text-gray-300">
                      No iterations yet.
                    </td>
                  </tr>
                ) : (
                  iterationHistory.map((iter, index) => (
                    <tr key={iter.timestamp} className="hover:bg-amber-50 dark:hover:bg-gray-700">
                      <td className="p-3 text-amber-700 dark:text-gray-200 font-semibold">
                        {index + 1}
                      </td>
                      <td className="p-3 text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                        {iter.original}
                      </td>
                      <td className="p-3 text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                        {iter.refined}
                      </td>
                      <td className="p-3 text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                        {iter.personas.join(', ')}
                      </td>
                      <td className="p-3 text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                        {iter.finalAnswer}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function QuestionCrafterApp() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <ThemeProvider attribute="class">
      <QuestionCrafter />
    </ThemeProvider>
  )
}

export default QuestionCrafterApp;