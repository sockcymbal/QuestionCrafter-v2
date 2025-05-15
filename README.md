This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

--

# QuestionCrafter App Overview

QuestionCrafter is an AI-powered application designed to help users refine and improve their questions by leveraging diverse expert perspectives. The application follows a client-server architecture with a Next.js frontend and a Python FastAPI backend.

## Architecture

### Frontend
- Built with **Next.js 15** using TypeScript and React 18
- UI components from **Radix UI** with TailwindCSS for styling
- Uses **Framer Motion** for animations and transitions
- **Supabase** integration for data storage
- Additional libraries: 
  - `canvas-confetti` for celebratory effects
  - [emailjs](/@emailjs/browser) for sending emails
  - `next-themes` for dark/light mode support
  - Various visualization tools including Three.js and React Force Graph

### Backend
- Built with **FastAPI** (Python)
- Integrates with **LangChain** and **OpenAI** for AI processing
- Uses YAML for persona data storage
- Environment variables for API key management

## Core Functionality

### Question Improvement Process
1. **Initial Question Input**: Users submit their original questions
2. **Persona Selection**: The system selects 3 relevant expert personas from a predefined set (stored in `personas.yaml`) to analyze the question
3. **AI-Powered Analysis**: The system processes the question through these personas using LangChain and OpenAI
4. **Question Refinement**: The original question is analyzed, critiqued, and improved
5. **Result Presentation**: The improved question is presented to the user along with reasoning, individual persona insights, and suggested new dimensions for exploration

### Key Components

#### Backend Core (`main.py`)
- Handles API endpoints for question processing
- Manages persona selection and question improvement through LLM chains
- Includes error handling and API response formatting

#### Persona System (`personas.py` and `personas.yaml`)
- Defines a rich set of expert personas with detailed attributes:
  - Name, role, background
  - Core expertise (key specialization areas)
  - Cognitive approach (problem-solving methods)
  - Values and motivations
  - Communication style
  - Notable traits
- Examples include: Cybersecurity Expert, DevOps Engineer, Quantum Physicist, Historian, Bioethicist, Musician, and many others

#### Frontend Components
- **QuestionCrafter.tsx**: The main React component handling:
  - User input collection
  - API communication
  - Result visualization
  - Progress tracking
  - History management
- Supporting UI components:
  - Welcome section with app introduction
  - Header bar for navigation
  - Theme toggle for light/dark mode
  - Reasoning progress visualization
  - Auto-resizing text areas
  - Persona cards with tooltips
  - Iteration timeline for tracking question evolution

## User Experience Flow
1. User arrives at the application and sees a welcome message explaining the purpose
2. User inputs a question they want to improve or explore more deeply
3. The system selects appropriate expert personas based on the question topic
4. A visual reasoning graph displays the progress through various stages:
   - Initial Analysis
   - Persona Insights
   - Critical Evaluation
   - Synthesis
   - Refinement
   - Final Convergence
   - Output Generation
5. Once complete, the user receives:
   - The refined question
   - Reasoning behind the improvements
   - Individual persona perspectives
   - New dimensions for exploration
6. Users can view a history of their questions and iterations

## Technical Implementation Details
- REST API communication between frontend and backend
- Structured JSON responses for question improvement
- Integration with external services (OpenAI, EmailJS, Supabase)
- Responsive design for various device sizes
- Accessibility features through Radix UI components
- Error handling and loading states

## Development Environment
- Standard Next.js toolchain with TypeScript
- Python environment with FastAPI and LangChain
- Environment variables for API keys

This application represents an innovative approach to question refinement through AI-assisted multi-perspective analysis, helping users explore topics more deeply and formulate better questions.

## Getting Started with Local Development

Follow these steps to run QuestionCrafter on your local machine:

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Python](https://www.python.org/) (v3.9 or newer)
- [pip](https://pip.pypa.io/en/stable/installation/)
- An OpenAI API key

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/questioncrafter-app.git
cd questioncrafter-app
```

2. **Frontend Setup**

```bash
# Install frontend dependencies
npm install
# or
yarn install
```

3. **Backend Setup**

```bash
# Navigate to the backend directory
cd backend

# Create a virtual environment (recommended)
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install backend dependencies
pip install fastapi uvicorn python-dotenv langchain langchain-openai pydantic pyyaml
```

### Environment Configuration

1. **Create environment files**

Create a `keys.env` file in the `backend` directory with your API keys:

```env
openai_api_key=your_openai_api_key
emailjs_user_id=your_emailjs_user_id
emailjs_service_id=your_emailjs_service_id
emailjs_template_id_feedback=your_emailjs_template_id_feedback
emailjs_template_id_share=your_emailjs_template_id_share
```

2. **Configure frontend to connect to the backend**

By default, the frontend connects to `http://localhost:8000`. If you need to change this, update the API URL in the frontend code.

### Running the Application

1. **Start the backend server**

```bash
# Make sure you're in the backend directory with the virtual environment activated
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

2. **Start the frontend development server** (in a new terminal)

```bash
# From the project root directory
npm run dev
# or
yarn dev
```

3. **Access the application**

Open [http://localhost:3000](http://localhost:3000) in your browser to use QuestionCrafter.

### Optional: Configure Supabase (if using question history features)

If you want to use the question history features, you'll need to set up a Supabase account and configure the connection:

1. Create an account on [Supabase](https://supabase.com/)
2. Create a new project
3. Set up a table named `questions` with appropriate columns for your data
4. Add your Supabase URL and anon key to your environment variables

## Troubleshooting

- **Backend API issues**: Check that your OpenAI API key is valid and has sufficient credits
- **CORS errors**: Ensure the frontend URL is properly configured in the CORS middleware of the backend
- **Module not found errors**: Make sure all dependencies are installed correctly

### Common Issues

- If you're getting CORS errors, check the CORS configuration in `main.py`
- If the personas aren't loading, check that the `personas.yaml` file is in the correct location
- For OpenAI API issues, verify your API key and ensure it has the necessary permissions

## FAQ

### How does QuestionCrafter select expert personas for each question?

The application uses an AI-powered approach to select the most relevant expert personas for each user question. The selection process works as follows:

1. **Presenting All Available Personas**: The system first retrieves all available personas from the loaded YAML file using the `get_all_persona_names()` function.

2. **LLM-Based Selection**: The application uses an LLM (Language Learning Model) through OpenAI's API to make the selection decision. Specifically:
   
   - It creates a `ChatOpenAI` instance with a temperature of 0.9 (higher creativity)
   - It sets up a structured output format to capture the three selected personas and their rationales
   - It crafts a detailed prompt template that instructs the AI to:
     ```
     "Consider the following question with careful attention to its nature and underlying essence... 
     Carefully select 3 expert personas from the following list. Envision how their expertise can intertwine, 
     forming a rich tapestry of interconnected knowledge and perspectives."
     ```

3. **Selection Criteria**: The prompt explicitly instructs the AI to:
   - Select 3 of the most relevant expert personas from the provided list
   - Ensure each persona is unique (no duplicates)
   - Consider how the personas might interact to generate unexpected insights
   - Provide a clear rationale for each selection in relation to the nature of the question posed

4. **Structured Response Parsing**: The system expects the LLM to return a structured response with:
   - `persona1`: The most relevant persona
   - `persona2`: The second most relevant persona
   - `persona3`: The third most relevant persona
   - `rationale`: A dictionary where keys are persona names and values are the selection reasons

5. **Validation and Fallback**: After receiving the selections:
   - The system validates that each selected persona exists in the available personas list
   - If an invalid persona is selected, it substitutes a random valid persona instead
   - It retrieves the full persona definitions with all their attributes
   - If any rationales are missing, the system can make another API call to fill in the gaps

This approach allows the system to dynamically match questions with the most appropriate expert personas based on the question's content, themes, and context, creating a tailored multi-perspective analysis for each user query.
