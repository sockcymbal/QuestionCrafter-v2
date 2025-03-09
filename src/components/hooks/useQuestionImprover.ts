'use client';

import { useState, useCallback, useEffect } from 'react';

export const useQuestionImprover = () => {
  const [question, setQuestion] = useState('');
  const [isLoadingPersonas, setIsLoadingPersonas] = useState(false);
  const [isProcessingQuestion, setIsProcessingQuestion] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [stageProgress, setStageProgress] = useState<number[]>(new Array(7).fill(0));
  const [showResults, setShowResults] = useState(false);
  const [showPersonas, setShowPersonas] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [selectedPersonas, setSelectedPersonas] = useState([]);
  const [refinedQuestion, setRefinedQuestion] = useState("");
  const [refinementRationale, setRefinementRationale] = useState("");
  const [bestAnswer, setBestAnswer] = useState("");
  const [conversationJourney, setConversationJourney] = useState("");
  const [harmonyPrinciple, setHarmonyPrinciple] = useState("");
  const [individualAnswers, setIndividualAnswers] = useState<string | null>(null);
  const [newDimensions, setNewDimensions] = useState<string | null>(null);
  const [showNewDimensions, setShowNewDimensions] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [iterationCount, setIterationCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    if (question.trim()) {
      setIsLoadingPersonas(true);
      setIsProcessingQuestion(false);
      setCurrentStage(0);
      setStageProgress(new Array(7).fill(0));
      setShowResults(false);
      setShowPersonas(false);
      setShowInsights(false);
      setError(null);

      try {
        // Persona selection request
        const personaResponse = await fetch('http://localhost:8000/select-personas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: question }),
        });

        if (!personaResponse.ok) {
          throw new Error(`HTTP error! status: ${personaResponse.status}`);
        }

        const personaData = await personaResponse.json();
        setSelectedPersonas(personaData.personas);
        setIsLoadingPersonas(false);
        setShowPersonas(true);

        // Start processing the question
        setIsProcessingQuestion(true);

        // Question improvement request
        const improvementResponse = await fetch('http://localhost:8000/improve-question', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: question, personas: personaData.personas }),
        });

        if (!improvementResponse.ok) {
          throw new Error(`HTTP error! status: ${improvementResponse.status}`);
        }

        const improvementData = await improvementResponse.json();

        setRefinedQuestion(improvementData.improved_question);
        setRefinementRationale(improvementData.rationale);
        setBestAnswer(improvementData.final_answer);
        setConversationJourney(improvementData.summary);
        setHarmonyPrinciple(improvementData.harmony_principle);
        setIndividualAnswers(improvementData.individual_answers || '');
        setNewDimensions(improvementData.new_dimensions);
        setIterationCount(prev => prev + 1);

        setIsProcessingQuestion(false);
        setShowResults(true);
        setShowInsights(true);

      } catch (error) {
        console.error('Error:', error);
        setError(`An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setIsLoadingPersonas(false);
        setIsProcessingQuestion(false);
        setShowPersonas(false);
      }
    }
  }, [question]);

  const handleIterate = useCallback(() => {
    setQuestion(refinedQuestion);
    setShowPersonas(false);
    setShowInsights(false);
    handleSubmit();
  }, [refinedQuestion, handleSubmit]);

  const handleExplore = useCallback(() => {
    setShowNewDimensions(true);
  }, []);

  const handleFeedbackSubmit = useCallback(() => {
    console.log(`Feedback submitted: Rating: ${feedbackRating}, Comment: ${feedbackComment}`);
    setFeedbackRating(0);
    setFeedbackComment('');
  }, [feedbackRating, feedbackComment]);

  useEffect(() => {
    if (isProcessingQuestion) {
      const interval = setInterval(() => {
        setStageProgress(prevProgress => {
          const newProgress = [...prevProgress];
          if (newProgress[currentStage] < 1) {
            newProgress[currentStage] = Math.min(newProgress[currentStage] + 0.02, 1);
          }
          return newProgress;
        });
      }, 100);

      const timeout = setTimeout(() => {
        if (currentStage < 6) {
          setCurrentStage(prevStage => prevStage + 1);
        }
      }, 5000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [isProcessingQuestion, currentStage]);

  return {
    question,
    setQuestion,
    isLoadingPersonas,
    isProcessingQuestion,
    currentStage,
    stageProgress,
    showResults,
    showPersonas,
    showInsights,
    selectedPersonas,
    refinedQuestion,
    refinementRationale,
    bestAnswer,
    conversationJourney,
    harmonyPrinciple,
    individualAnswers,
    newDimensions,
    showNewDimensions,
    setShowNewDimensions,
    feedbackRating,
    setFeedbackRating,
    feedbackComment,
    setFeedbackComment,
    iterationCount,
    error,
    handleSubmit,
    handleIterate,
    handleExplore,
    handleFeedbackSubmit,
  };
};