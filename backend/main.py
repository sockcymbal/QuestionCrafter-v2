import json
import random
import os
import re
import time
from datetime import datetime
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import ConversationChain, LLMChain
from langchain.memory import ConversationBufferMemory
from langchain.output_parsers import ResponseSchema, StructuredOutputParser
import logging
import yaml
from typing import List, Optional, Dict, Any, Union

app = FastAPI()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv('keys.env')
openai_api_key = os.environ['openai_api_key']

@app.get("/api/emailjs-credentials")
async def get_emailjs_credentials():
    return {
        "emailjs_user_id": os.getenv("emailjs_user_id"),
        "emailjs_service_id": os.getenv("emailjs_service_id"),
        "emailjs_template_id_feedback": os.getenv("emailjs_template_id_feedback"),
        "emailjs_template_id_share": os.getenv("emailjs_template_id_share")
    }

@app.get("/api/get-secret-code")
async def get_secret_code():
    # reading from environment variable
    secret_code = os.getenv("ALPHA_SECRET_CODE", "")
    print("ALPHA_SECRET_CODE:", secret_code)  # Debug: check output in the terminal
    return {"secret_code": secret_code}

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variable to store personas data
personas_data = {}

def load_personas():
    global personas_data
    try:
        with open('personas.yaml', 'r', encoding='utf-8') as file:
            personas_data = yaml.safe_load(file)
        logger.info(f"Personas loaded successfully. Number of personas: {len(personas_data['personas'])}")
        logger.info(f"Loaded personas: {list(personas_data['personas'].keys())}")
    except Exception as e:
        logger.error(f"Error loading personas: {str(e)}")
        personas_data = {"personas": {}}

@app.on_event("startup")
async def startup_event():
    load_personas()
    logger.info("Application started, personas loaded.")

def get_all_persona_names():
    """Return all persona names from the loaded YAML file."""
    persona_names = list(personas_data['personas'].keys())
    logger.info(f"Available personas: {persona_names}")
    return persona_names

def get_persona_definition(persona_name):
    """Return a specific persona definition from the loaded YAML file."""
    persona = personas_data['personas'].get(persona_name, {
        "name": persona_name,
        "role": "Unknown",
        "background": "No background available"
    })

    logger.info(f"Retrieved persona: {persona_name}")
    logger.info(f"Persona keys: {persona.keys()}")
    
    # Add default values for missing keys
    persona['original_role'] = persona_name
    persona['core_expertise'] = persona.get('core_expertise', [])
    persona['cognitive_approach'] = persona.get('cognitive_approach', '')
    persona['values_and_motivations'] = persona.get('values_and_motivations', '')
    persona['communication_style'] = persona.get('communication_style', '')
    persona['notable_trait'] = persona.get('notable_trait', '')
    
    return persona

def validate_persona_selection(selected_personas):
    valid_personas = get_all_persona_names()
    validated_personas = []
    for persona in selected_personas:
        if persona in valid_personas:
            validated_personas.append(persona)
        else:
            logger.warning(f"Invalid persona selected: {persona}. Selecting a random valid persona instead.")
            validated_personas.append(random.choice(valid_personas))
    return validated_personas

class Question(BaseModel):
    text: str

def get_content(response):
    if isinstance(response, str):
        return response
    elif isinstance(response, dict) and "response" in response:
        return response["response"]
    elif isinstance(response, dict) and "output" in response:
        return response["output"]
    else:
        return str(response)

# Select Personas
@app.post("/select-personas")
async def select_personas(question: Question):
    try:
        logger.info(f"Selecting personas for question: {question.text}")
        
        available_personas = get_all_persona_names()
        logger.info(f"All available personas for selection: {available_personas}")

        chat = ChatOpenAI(temperature=1, openai_api_key=openai_api_key, model="o3-mini")

        response_schemas = [
            ResponseSchema(name="persona1", description="the most relevant persona selected to use to reason through the question"),
            ResponseSchema(name="persona2", description="the second most relevant persona selected to use to reason through the question"),
            ResponseSchema(name="persona3", description="the third most relevant persona selected to use to reason through the question"),
            ResponseSchema(name="rationale", description="a dictionary where keys are the selected persona names and values are the rationales for selecting each persona")
        ]
        output_parser = StructuredOutputParser.from_response_schemas(response_schemas)
        format_instructions = output_parser.get_format_instructions()
        format_instructions += "\nEnsure that the 'rationale' field is a dictionary with keys for each selected persona and corresponding rationale values." 

        persona_selection_prompt = PromptTemplate(
            input_variables=["question", "personas"],
            template="""
            Consider the following question with careful attention to its nature and underlying essence.

            Question: {question}

            Carefully select 3 expert personas from the following list. Envision how their expertise can intertwine, forming a rich tapestry of interconnected knowledge and perspectives. 
            
            Consider the depth and breadth each brings, and how their unique insights, when combined could lead to groundbreaking explorations of the question.

            Available Personas: {personas}

           IMPORTANT:
            - Select 3 of the most relevant expert personas only from the provided list
            - Each persona must be unique
            - Provide a clear rationale to the user for why each selection was chosen in relation to the nature of the question posed
            - Include a 'rationale' dictionary with persona names as keys and selection reasons as values
            - Consider how these personas might interact to generate unexpected insights
            - Your output must be valid JSON with no markdown formatting, no code fences, or additional text.
            - Failure to provide a rationale for each selected persona will result in an error and require reprocessing.

            {format_instructions}
            """,
            partial_variables={"format_instructions": format_instructions}
        )

        personas_string = ", ".join(available_personas)
        prompt_content = persona_selection_prompt.format(question=question.text, personas=personas_string)
        logger.info("Persona selection prompt content:")
        logger.info(prompt_content)

        # IMPORTANT: LLMChain.invoke here returns a dict immediately (synchronous), so do not await it.
        response = LLMChain(llm=chat, prompt=persona_selection_prompt).invoke({"question": question.text, "personas": personas_string})
        logger.info(f"Persona selection response: {response}")

        if isinstance(response, dict):
            selection = response
        else:
            try:
                selection = output_parser.parse(response)
            except Exception as e:
                logger.error(f"Error parsing OpenAI response: {e}")
                logger.error(f"Problematic response: {response}")
                raise HTTPException(status_code=500, detail="Error parsing OpenAI response")

        logger.info(f"Parsed selection: {json.dumps(selection, indent=2)}")

        # Check if the output is wrapped in markdown code fences in the 'text' key
        if "text" in selection:
            raw_text = selection["text"]
            # Remove markdown code fences and any 'json' language identifiers.
            cleaned_text = re.sub(r'^```(?:json)?\s*', '', raw_text).strip()
            cleaned_text = re.sub(r'\s*```$', '', cleaned_text).strip()
            try:
                # Now parse the cleaned JSON string.
                selection = json.loads(cleaned_text)
            except Exception as e:
                logger.error(f"Error parsing cleaned JSON: {e}")
                raise HTTPException(status_code=500, detail="Error parsing persona selection output")

        # Now you should have keys 'persona1', 'persona2', 'persona3'
        try:
            selected_personas = [selection['persona1'], selection['persona2'], selection['persona3']]
        except KeyError as e:
            logger.error(f"Key error: {e}")
            raise HTTPException(status_code=500, detail=f"Expected key {e} not found in persona selection output")

        # Continue with your persona validation and definition retrieval...
        validated_personas = validate_persona_selection(selected_personas)
        logger.info(f"Validated selected personas: {validated_personas}")

        selected_persona_definitions = [get_persona_definition(persona) for persona in validated_personas]
        logger.info(f"Selected persona definitions: {selected_persona_definitions}")

        rationales = selection.get('rationale', {})
        if not isinstance(rationales, dict):
            logger.error(f"Rationale is not a dictionary: {rationales}")
            rationales = {}

        missing_rationales = [p for p in validated_personas if p not in rationales]
        
        if missing_rationales:
            logger.warning(f"Missing rationales for: {missing_rationales}")
            
            # Make another API call to get missing rationales
            missing_rationale_prompt = PromptTemplate(
                input_variables=["question", "personas"],
                template="""
                For the following question: {question}
                
                Provide a clear and specific rationale for selecting each of these personas as it relates to exploring the nature of the question posed:
                {personas}
                
                Your response must be a dictionary where each key is a persona name and the value is the rationale.
                """
            )
            
            missing_rationale_response = LLMChain(llm=chat, prompt=missing_rationale_prompt).run(question=question.text, personas=", ".join(missing_rationales))
            
            try:
                additional_rationales = json.loads(missing_rationale_response)
                rationales.update(additional_rationales)
            except json.JSONDecodeError:
                logger.error(f"Error parsing additional rationales: {missing_rationale_response}")
                raise HTTPException(status_code=500, detail="Error generating complete rationales")

        logger.info(f"Final rationales: {json.dumps(rationales, indent=2)}")

        # Return the result with key "selectedPersonas" for the frontend
        result = {
            "selectedPersonas": [
                {
                    "name": persona.get('name', 'Unknown'),
                    "role": persona.get('role', 'Unknown'),
                    "background": persona.get('background', 'No background available'),
                    "core_expertise": persona.get('core_expertise', []),
                    "cognitive_approach": persona.get('cognitive_approach', ''),
                    "values_and_motivations": persona.get('values_and_motivations', ''),
                    "communication_style": persona.get('communication_style', ''),
                    "notable_trait": persona.get('notable_trait', ''),
                    "rationale": rationales.get(persona['original_role'], "Error: No rationale provided")
                }
                for persona in selected_persona_definitions
            ]
        }

        logger.info(f"Returning personas: {json.dumps(result, indent=2)}")
        return result

    except Exception as e:
        logger.error(f"Error occurred during persona selection: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# Improve Question
@app.post("/improve-question")
async def improve_question(request: dict):
    try:
        logger.info(f"Improving question: {request['text']}")
        
        question = request['text']
        # Ensure that the request payload contains persona data (either as "personas" or "selectedPersonas")
        personas = request.get('personas') or request.get('selectedPersonas')
        if not personas:
            raise HTTPException(status_code=422, detail="Personas data is missing from the request")
        
        # Format full persona definitions for the prompt
        persona_info = "\n\n".join([
            f"Name: {persona['name']}\n"
            f"Role: {persona['role']}\n"
            f"Background: {persona['background']}\n"
            f"Core Expertise: {', '.join(persona['core_expertise'])}\n"
            f"Cognitive Approach: {persona['cognitive_approach']}\n"
            f"Values and Motivations: {persona['values_and_motivations']}\n"
            f"Communication Style: {persona['communication_style']}\n"
            f"Notable Trait: {persona['notable_trait']}\n"
            f"Rationale for Selection: {persona['rationale']}"
            for persona in personas
        ]) 

        # Initialize ChatOpenAI model
        chat = ChatOpenAI(temperature=1,
                          openai_api_key=openai_api_key,
                          model='o3-mini')

        conversation = ConversationChain(
            llm=chat,
            memory=ConversationBufferMemory()
        )

        # Prompt 1: Brainstorm
        prompt_1_template = PromptTemplate(
            input_variables=["selected_personas", "question"],
            template="""
            You are a QuestionCrafter reasoning agent using three unique, specified personas to reason collectively step-by-step to ultimately provide 
            the best possible quality improvement to a given user-posed question by arriving at a synthesized improved version of the question.

            To begin with, allow each persona to share their initial insights about the following question. 
            Detail your perspective, drawing on specific knowledge, experiences, and pioneering concepts from your field.
            Aim to uncover new angles and dimensions of the question, demonstrating how your unique expertise contributes 
            to a multifaceted understanding. In subsequent prompts, we'll engage in a collaborative process where these 
            perspectives are woven into an intricate network of thoughts. Later in the conversation, we'll highlight how 
            each viewpoint complements or challenges the others, constructing a more multidimensional and higher quality question 
            to pose back to the user who asked the initial question.

            The personas are:
            {selected_personas}

            The question is: {question}
            
            Please output each persona's individual initial response to the question on a new line.
            """
        )

        prompt_1 = prompt_1_template.format(selected_personas=persona_info, question=question)
        first = get_content(conversation.invoke(prompt_1))
        logger.info(f"Prompt 1 Response: {first}")

        # Prompt 2: Self<>Peer Criticism
        prompt_2 = """
        Adopt a critical lens. Evaluate and challenge your own initial analysis and the analyses provided by your peers.
        As each expert, critically examine the collective insights thus far, aiming not just to critique but to enrich and expand upon them in helpful ways.
        This process should delve into identifying underlying assumptions, potential biases, and areas where further exploration could yield significant insights, thereby enhancing the collective understanding.
        """
        second = get_content(conversation.invoke(prompt_2))
        logger.info(f"Prompt 2 Response: {second}")

        # Prompt 3: Self<>Peer Evaluation
        prompt_3 = """
        Reflect on the critiques received, and adapt your perspectives accordingly. 
        This prompt is about evolution and expansion of thought, where you reassess and reformulate ideas, creating a more nuanced and comprehensive network of interconnected ideas and insights in relation to the question.

        Prioritize assertions that are well-supported, constructive and resilient to scrutiny.
        """
        third = get_content(conversation.invoke(prompt_3))
        logger.info(f"Prompt 3 Response: {third}")

        # Prompt 4: Expand, Explore, Branch, Network
        prompt_4 = """
        In this stage, weave a network of thoughts by integrating critiques and alternative perspectives.
        Focus on how new ideas can interconnect with and enhance existing thoughts. 
        Explore the potential of novel concepts to form new nodes in this thought network. 

        Push the boundaries of conventional thinking. Each persona explores new, divergent ideas, stimulated by the feedback loop. 
        
        Critically assess how these ideas contribute fresh insights, creating a richer and more intricate web of understanding, or introducing new deeper dimensions to the question. Consider pivoting to new lines of reasoning that promise to add valuable connections to this evolving thought network. Branch out as you wish!
        """
        fourth = get_content(conversation.invoke(prompt_4))
        logger.info(f"Prompt 4 Response: {fourth}")

        # Prompt 5: Convergence on Best Individual Answer
        prompt_5 = f"""
        Now, it's time for each expert to finalize their thoughts and converge on a best answer. Synthesize the insights into a coherent individual answer that will be super helpful to the person who asked the original question.

        Reflect on the entire dialogue, considering how your thoughts evolved.
        The final best answer here should not only represent your strongest answer with any valid and useful insights from others that you integrated.
        
        For each expert, provide a concise summary of their final best answer to the original question.
        Each summary should:
            1. Be no more than 3-4 sentences of helpful, useful insight, encapsulating the essence of your best thoughts about the question. If the oriiginal question implies that the person asking it is seeking advice, make your answer actionable and specific in the most contextually relevant way. 
            2. Optimize for truth, helpfulness, and practicality
            3. Highlight any useful insight or anything fundamentally profound you've communicated to the pursuit of this inquiry
            4. Avoid repetition of information covered by other experts.

        Based on this, as each expert, what is your best answer to the initial question: {question}?

        Format the output with the persona's name, title, and their best answer. I know you'll do great!
        """
        fifth = get_content(conversation.invoke(prompt_5))
        logger.info(f"Prompt 5 Response: {fifth}")

        # Parse individual answers from prompt 5 output
        individual_answers = []
        logger.info("Parsing individual expert answers")
        try:
            # Extract each persona's answer using regex
            for persona in personas:
                persona_name = persona['name']
                logger.info(f"Looking for answer from {persona_name}")
                
                # Look for patterns like "Name: [Persona Name]" followed by text
                pattern = rf"{persona_name}(?:.*?):(.*?)(?:(?:\n\n.*?:)|$)"
                answer = re.search(pattern, fifth, re.DOTALL | re.IGNORECASE)
                
                if answer:
                    answer_text = answer.group(1).strip()
                    logger.info(f"Found answer for {persona_name}: {answer_text[:50]}...")
                    individual_answers.append({
                        "name": persona_name,
                        "answer": answer_text
                    })
                else:
                    logger.warning(f"Failed to extract answer for persona {persona_name}")
                    # Try a more lenient pattern just looking for the name
                    alt_pattern = rf"{persona_name}[^\n]*\n(.*?)(?:\n\n|\n[A-Z]|\Z)"
                    alt_answer = re.search(alt_pattern, fifth, re.DOTALL)
                    
                    if alt_answer:
                        answer_text = alt_answer.group(1).strip()
                        logger.info(f"Found answer with alt pattern for {persona_name}: {answer_text[:50]}...")
                        individual_answers.append({
                            "name": persona_name,
                            "answer": answer_text
                        })
                    else:
                        logger.error(f"Completely failed to extract answer for persona {persona_name}")
                        # Add default answer for this persona
                        individual_answers.append({
                            "name": persona_name,
                            "answer": "This expert contributed their perspective to the final refinement."
                        })
            
            # Log the full structure of the individual answers
            logger.info(f"All individual answers: {json.dumps(individual_answers, indent=2)}")
        except Exception as e:
            logger.error(f"Error parsing individual answers: {str(e)}", exc_info=True)
            # Provide fallback answers
            for persona in personas:
                individual_answers.append({
                    "name": persona['name'],
                    "answer": "This expert contributed to refining the question."
                })

        # Prompt 6: Convergence on Best Collective Answer
        prompt_6 = """
        Facilitate a synthesis of the individual experts' answers to forge a unified, comprehensive answer to the original question that combines the best elements from each persona's insights.
        
        This response should be a testament to the depth of of the thought network, 
        showcasing how the perspectives can coalesce into a singular, insightful, and useful narrative.

        The synthesized answer should not be formulated in explicit terms specific to each persona's own definition or agenda, but rather it should be phrased in a way that seeks to inspire and uncover deeper truths, regardless of what personas happened to be involved in this discussion. 
        
        A great answer will transcend the limited view of any one expert, and will be useful to the human who asked the original question to reflect deeper and to potentially illuminate novel, useful pathways of reasoning forward. The user is expecting some very helpful and profound insights in this section, so thank you for doing your best on crafting this final answer!
        """
        sixth = get_content(conversation.invoke(prompt_6))
        logger.info(f"Prompt 6 Response: {sixth}")

        # Prompt 7: New Enhanced Question
        prompt_7 = f"""
        As we conclude our collaborative journey and after thorough analysis and reflection on the entire discussion,
        let's now focus on the final objective - to vastly elevate the original question into a more insightful and universally engaging form. 

        After going through the following thoughts, please take a deep breath and generate a far higher quality version of the original question.

        Reformulate the initial question by weaving in the rich insights gained through this networked reasoning process. 

        The new question should be deeper, clearer, and designed to catalyze more curiosity and invite more comprehensive exploration. That doesn't mean making it too complex though, keep it straightforward for the user. Not too much of a mouthful, but deeper and more illuminating.

        Here are some thoughts to consider before you propose an improved version of the question:

        1. Balanced Scope & Structure

            - Does the question identify clear dimensions of inquiry without overwhelming?
            - Does it create natural "hooks" for exploration while maintaining focus?
            - Is there a logical flow to how concepts are connected?

        2. Precision with Breathing Room

            - Are key terms specific enough to guide thought but open enough to invite interpretation?
            - Does the question avoid unnecessary qualifiers or redundant concepts?
            - Can the question be understood on first reading while still rewarding deeper consideration?

        3. Invitation to Multi-Level Analysis

            - Does the question naturally lead to both practical and theoretical explorations?
            - Does it create space for both immediate responses and longer-term reflection?

        4. Dialogic Potential

            - Does the question set up natural follow-up areas without explicitly listing them?
            - Can it spark discussion without requiring extensive context or definition?
            - Does it invite both personal experience and broader analysis?

        5. Generative Balance

            - Does the complexity serve a purpose rather than just adding words?
            - Is there a clear central inquiry with room for branching exploration?
            - Does it avoid the extremes of being either too basic or unnecessarily complex?

        Remember, the goal is to inspire curiosity and invite deeper exploration while remaining clear and concise.

        As a reminder, the original question was {question}

        Please provide only the improved question in your response. Thanks again for your help in catalyzing the user to think deeper. Take a deep breath, and do your best!
        """
        improved_question = get_content(conversation.invoke(prompt_7))
        logger.info(f"Improved question: {improved_question}")

        # Prompt 8: Summary of conversation, any major insights and turning points
        prompt_8 = """
        Provide a brief summary of this conversation's evolution in a single paragraph.
        Focus on:
            1. Each expert's persona and their key contributions.
            2. How the perspectives were integrated and refined.
            3. The main turning points or breakthroughs in understanding.
            4. How the final question emerged from this process.
        
        Aim for clarity and conciseness, highlighting only the most significant aspects of the journey.
        """
        eighth = get_content(conversation.invoke(prompt_8))
        logger.info(f"Conversation summary: {eighth}")

        # Prompt 9: Rationale for Refinement
        prompt_9 = """
        Generate a rationale for this refinement.
        
        In a 1-2 concise bullet point list, explain how this new refined version improves the quality, depth, and effectiveness of the original question, and in contrast, explain the key limitation of the orginal question.

        Additionally, please list the main dimensions/elements to the new question, and why they are important to consider.

        Use markdown as your answer format.
        """
        ninth = get_content(conversation.invoke(prompt_9))
        logger.info(f"Rationale: {ninth}")

        # Prompt 10: Harmony Seeking Loop
        prompt_10 = """
        Identify a deep fundamental principle that all personas can agree upon. 
        In 2-3 sentences, explain:
            1. What this shared foundation is.
            2. How it influenced the collective reasoning process.
        
        Focus on the core idea, concept, or principle that bridges the different perspectives and its impact on the discussion. Really go deep here to see something foundational, profound, yet simple!
        """
        tenth = get_content(conversation.invoke(prompt_10))
        logger.info(f"Harmony Principle: {tenth}")

        # Prompt 11: Explore New Dimensions
        prompt_11 = """
        Using a synthesized perspective, help the person who asked the initial question to explore new and related dimensions:
        
        Potential Exploration Pathways: Offer possible directions, sub-questions, or meta-questions for further exploration based on the enhanced question. This helps the user to spark more interesting avenues of inquiry.

        Further Reading/Resources: Include links or references to relevant literature, articles, people of interest, or studies that can provide more context or information related to the enhanced question.

        Do not use markdown for your answer.
        """
        eleventh = get_content(conversation.invoke(prompt_11))
        logger.info(f"New Dimensions: {eleventh}")

        # Return what's needed for the UI
        return {
            "improved_question": improved_question,
            "final_answer": sixth,
            "summary": eighth,
            "rationale": ninth,
            "harmony_principle": tenth,
            "new_dimensions": eleventh,
            "individual_answers": individual_answers
        }

    except Exception as e:
        logger.error(f"Error occurred: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# Model for library entry submission
class ExpertAnswer(BaseModel):
    name: str
    answer: str

class LibraryEntry(BaseModel):
    originalQuestion: str
    refinedQuestion: str
    expertPersonas: List[str]
    category: str = "General"
    tags: List[str] = []
    impact: str = "User-contributed transformation"
    author: str = "Anonymous"
    individualAnswers: List[Union[ExpertAnswer, Dict[str, str], str]] = []
    bestAnswer: Optional[str] = None
    date: Optional[str] = None

@app.post("/api/library/submit")
async def submit_to_library(entry: LibraryEntry):
    """
    Submit a question transformation to the library
    """
    try:
        logger.info(f"Submitting to library: {entry.originalQuestion}")
        
        library_file = 'library_entries.json'
        
        # Process individual answers to ensure consistent format
        processed_answers = []
        if entry.individualAnswers:
            logger.info(f"Processing individual answers: {type(entry.individualAnswers)}")
            
            # If it's a string, try to parse it
            if isinstance(entry.individualAnswers, str):
                try:
                    parsed = json.loads(entry.individualAnswers)
                    if isinstance(parsed, list):
                        entry.individualAnswers = parsed
                except:
                    logger.warning(f"Could not parse individualAnswers string: {entry.individualAnswers[:50]}...")
            
            # Handle different formats
            if isinstance(entry.individualAnswers, list):
                for answer in entry.individualAnswers:
                    if isinstance(answer, dict) and 'name' in answer and 'answer' in answer:
                        processed_answers.append(answer)
                    elif isinstance(answer, str):
                        # Try to match with a persona
                        for idx, persona in enumerate(entry.expertPersonas):
                            if idx < len(entry.expertPersonas):
                                processed_answers.append({
                                    "name": entry.expertPersonas[idx],
                                    "answer": answer
                                })
                                break
                        else:
                            processed_answers.append({
                                "name": "Expert",
                                "answer": answer
                            })
            elif isinstance(entry.individualAnswers, dict):
                for key, value in entry.individualAnswers.items():
                    processed_answers.append({
                        "name": key,
                        "answer": value
                    })
                    
        # Use processed answers or empty list
        logger.info(f"Processed answers count: {len(processed_answers)}")
        
        # Log best answer information
        if hasattr(entry, "bestAnswer") and entry.bestAnswer:
            logger.info(f"Best answer is present: {entry.bestAnswer[:100]}...")
        else:
            logger.warning("Best answer is missing or empty")
        
        # Create a new entry with additional metadata
        new_entry = {
            "id": int(time.time()),
            "originalQuestion": entry.originalQuestion,
            "refinedQuestion": entry.refinedQuestion,
            "expertPersonas": entry.expertPersonas,
            "category": entry.category,
            "tags": entry.tags,
            "impact": entry.impact,
            "author": entry.author,
            "individualAnswers": processed_answers,
            "bestAnswer": entry.bestAnswer if hasattr(entry, "bestAnswer") and entry.bestAnswer else None,
            "date": entry.date if entry.date else datetime.now().isoformat(),
            "votes": 0,
            "comments": 0,
            "commentList": [],
            "views": 0,
            "status": "user", # 'user' or 'featured'
            "podcast": {
                "title": f"The Transformation Journey: {entry.category}",
                "duration": "00:00",
                "summary": f"A question was transformed using the following experts: {', '.join(entry.expertPersonas)}. The refinement focuses on {entry.category.lower()} aspects."
            }
        }
        
        # Check if library file exists, if not create it
        if not os.path.exists(library_file):
            logger.info(f"Creating new library file at {library_file}")
            with open(library_file, 'w') as f:
                json.dump({"entries": [new_entry]}, f, indent=2)
            return {"success": True, "id": new_entry["id"]}
        
        # Read existing library data
        with open(library_file, 'r') as f:
            try:
                library_data = json.load(f)
            except json.JSONDecodeError:
                logger.error("Error parsing library file")
                library_data = {"entries": []}
        
        # Add new entry to library
        if "entries" not in library_data:
            library_data["entries"] = []
            
        library_data["entries"].append(new_entry)
        
        # Write updated data back to file
        with open(library_file, 'w') as f:
            json.dump(library_data, f, indent=2)
            
        logger.info(f"Successfully added entry to library with ID {new_entry['id']}")
        return {"success": True, "id": new_entry["id"]}
        
    except Exception as e:
        logger.error(f"Error submitting to library: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to submit to library: {str(e)}")

@app.get("/api/library/entries")
async def get_library_entries():
    """
    Get all entries from the question library
    """
    try:
        logger.info("Fetching library entries")
        library_file = 'library_entries.json'
        
        # Return empty list if file doesn't exist
        if not os.path.exists(library_file):
            logger.warning(f"Library file not found at {library_file}")
            return {"entries": []}
            
        # Read and return library data
        with open(library_file, 'r') as f:
            try:
                library_data = json.load(f)
                logger.info(f"Successfully retrieved {len(library_data.get('entries', []))} library entries")
                return library_data
            except json.JSONDecodeError:
                logger.error("Error parsing library file")
                return {"entries": []}
                
    except Exception as e:
        logger.error(f"Error reading library entries: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to read library entries: {str(e)}")

# Model for library entry comments
class LibraryComment(BaseModel):
    entryId: int
    comment: str
    author: str = "Anonymous"
    date: str = None

# Model for upvote request
class UpvoteRequest(BaseModel):
    entryId: int

@app.post("/api/library/comment")
async def add_comment(comment_data: LibraryComment):
    """
    Add a comment to a library entry
    """
    try:
        logger.info(f"Adding comment to entry ID: {comment_data.entryId}")
        library_file = 'library_entries.json'
        
        # Set the date if not provided
        if not comment_data.date:
            comment_data.date = datetime.now().isoformat()
            
        # Create comment object
        comment_obj = {
            "id": int(time.time() * 1000),  # Use timestamp as ID
            "entryId": comment_data.entryId,
            "comment": comment_data.comment,
            "author": comment_data.author,
            "date": comment_data.date
        }
        
        # Check if library file exists
        if not os.path.exists(library_file):
            logger.error(f"Library file not found at {library_file}")
            raise HTTPException(status_code=404, detail="Library data not found")
        
        # Read library data
        with open(library_file, 'r') as f:
            try:
                library_data = json.load(f)
            except json.JSONDecodeError:
                logger.error("Error parsing library file")
                raise HTTPException(status_code=500, detail="Error reading library data")
        
        # Find the entry
        found = False
        for entry in library_data.get("entries", []):
            if entry.get("id") == comment_data.entryId:
                # Initialize comments array if it doesn't exist
                if "commentList" not in entry:
                    entry["commentList"] = []
                
                # Add comment
                entry["commentList"].append(comment_obj)
                # Update comment count
                entry["comments"] = len(entry["commentList"])
                found = True
                break
        
        if not found:
            logger.error(f"Entry with ID {comment_data.entryId} not found")
            raise HTTPException(status_code=404, detail=f"Entry with ID {comment_data.entryId} not found")
        
        # Write updated data back to file
        with open(library_file, 'w') as f:
            json.dump(library_data, f, indent=2)
            
        logger.info(f"Comment added successfully to entry {comment_data.entryId}")
        return {"success": True, "id": comment_obj["id"], "entryId": comment_data.entryId}
        
    except Exception as e:
        logger.error(f"Error adding comment: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to add comment: {str(e)}")

@app.post("/api/library/upvote")
async def upvote_entry(upvote_data: UpvoteRequest):
    """
    Upvote a library entry
    """
    try:
        logger.info(f"Upvoting entry ID: {upvote_data.entryId}")
        library_file = 'library_entries.json'
        
        # Check if library file exists
        if not os.path.exists(library_file):
            logger.error(f"Library file not found at {library_file}")
            raise HTTPException(status_code=404, detail="Library data not found")
        
        # Read library data
        with open(library_file, 'r') as f:
            try:
                library_data = json.load(f)
            except json.JSONDecodeError:
                logger.error("Error parsing library file")
                raise HTTPException(status_code=500, detail="Error reading library data")
        
        # Find the entry
        found = False
        for entry in library_data.get("entries", []):
            if entry.get("id") == upvote_data.entryId:
                # Increment vote count
                entry["votes"] = entry.get("votes", 0) + 1
                # Increment view count
                entry["views"] = entry.get("views", 0) + 1
                found = True
                break
        
        if not found:
            logger.error(f"Entry with ID {upvote_data.entryId} not found")
            raise HTTPException(status_code=404, detail=f"Entry with ID {upvote_data.entryId} not found")
        
        # Write updated data back to file
        with open(library_file, 'w') as f:
            json.dump(library_data, f, indent=2)
            
        logger.info(f"Entry {upvote_data.entryId} upvoted successfully")
        return {"success": True, "entryId": upvote_data.entryId}
        
    except Exception as e:
        logger.error(f"Error upvoting entry: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to upvote entry: {str(e)}")

@app.get("/api/library/entry/{entry_id}")
async def get_library_entry(entry_id: int):
    """
    Get a specific entry from the question library
    """
    try:
        logger.info(f"Fetching library entry with ID: {entry_id}")
        library_file = 'library_entries.json'
        
        # Check if library file exists
        if not os.path.exists(library_file):
            logger.error(f"Library file not found at {library_file}")
            raise HTTPException(status_code=404, detail="Library data not found")
        
        # Read library data
        with open(library_file, 'r') as f:
            try:
                library_data = json.load(f)
            except json.JSONDecodeError:
                logger.error("Error parsing library file")
                raise HTTPException(status_code=500, detail="Error reading library data")
        
        # Find the entry
        for entry in library_data.get("entries", []):
            if entry.get("id") == entry_id:
                # Increment view count when entry is viewed
                entry["views"] = entry.get("views", 0) + 1
                
                # Log whether bestAnswer is present in the entry
                if "bestAnswer" in entry and entry["bestAnswer"]:
                    logger.info(f"Entry {entry_id} has bestAnswer field: {entry['bestAnswer'][:50]}...")
                else:
                    logger.warning(f"Entry {entry_id} is missing bestAnswer field or it's empty")
                    
                # Write updated view count back to file
                with open(library_file, 'w') as f:
                    json.dump(library_data, f, indent=2)
                
                logger.info(f"Successfully retrieved entry with ID {entry_id}")
                return entry
        
        logger.error(f"Entry with ID {entry_id} not found")
        raise HTTPException(status_code=404, detail=f"Entry with ID {entry_id} not found")
        
    except Exception as e:
        logger.error(f"Error retrieving library entry: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve library entry: {str(e)}")

@app.get("/test")
async def test():
    return {"message": "Test successful"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)