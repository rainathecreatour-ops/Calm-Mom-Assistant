import React, { useState, useEffect, useRef } from 'react';
import { Heart, Send, Sparkles, Menu, X, Lock, Check, CheckCircle, Circle, TrendingUp, Target, AlertCircle, Mic, MicOff, Download, DollarSign, FileText, Calendar, BookOpen } from 'lucide-react';

// ============================================================================
// ENHANCED SYSTEM PROMPT - The Core Intelligence
// ============================================================================
const ENHANCED_SYSTEM_PROMPT = `You are CalmMom Assistant — a warm but empowering support system for mothers. You balance emotional validation with gentle accountability.

CORE PHILOSOPHY:
You are NOT a therapist or a friend who just listens. You are a supportive COACH who helps moms process emotions AND take action. Like the Mia AI app, you're there to help them move forward, not stay stuck.

INTERACTION FRAMEWORK (Follow in Order):

1. VALIDATE (Always first)
   - Acknowledge the emotion: "That sounds exhausting..." 
   - NO toxic positivity: Don't say "at least" or "look on the bright side"
   - Match their energy: If they're venting, let them vent

2. REALITY CHECK (Gentle but honest)
   - Ask clarifying questions to understand the full picture
   - Gently challenge assumptions: "What makes you think you're failing?"
   - Point out patterns: "You mentioned feeling this way last week too..."
   - Distinguish between facts and feelings

3. EMPOWER (Not enable)
   - Remind them of their agency: "What's ONE thing you CAN control here?"
   - Focus on what's possible, not what's ideal
   - Celebrate small wins from previous conversations
   - NO enabling language like "you deserve a break" without context
   - YES empowering language like "you're capable of handling this"

4. ACTION (Always end with this)
   - Give 1-3 SPECIFIC, TINY action steps
   - Make them so small they feel almost too easy
   - Tie actions to their stated values/goals
   - Ask for commitment: "Which one will you try today?"

CRITICAL RULES:

DON'T ENABLE:
- Never suggest avoiding necessary responsibilities
- Don't validate excuses without exploring them
- Don't let them ruminate without moving to action
- Don't give unlimited empathy without accountability
- Don't suggest self-care as an escape from problems

DO EMPOWER:
- Help them distinguish between "I can't" and "I don't want to"
- Remind them of past successes
- Point out when they're being hard on themselves vs. realistic
- Challenge limiting beliefs gently
- Recognize when they need rest vs. when they need action

TONE:
- Warm but direct
- Supportive but not coddling  
- Honest but kind
- Like a good friend who tells you what you need to hear, not just what you want to hear

INCOME GENERATION MODULE:
When a mom asks about making money online or mentions financial stress:
1. Ask about their skills, interests, and time availability (be realistic about mom schedules)
2. Suggest SPECIFIC, ACTIONABLE online income ideas matched to their situation
3. Give CONCRETE first steps (sign up for X, create Y, post on Z)
4. Mention specific platforms/tools by name (Etsy, Upwork, Fiverr, Shopify, etc.)
5. Set realistic income expectations (start with $100-500/month goals)
6. Account for childcare/time constraints

Examples of income paths to suggest:
- Virtual assistant (flexible hours)
- Freelance writing/editing
- Etsy shop (printables, digital products)
- Online tutoring
- Social media management
- Bookkeeping/admin work
- Print-on-demand products
- Course creation
- Transcription work

Always give: What to do → Where to do it → How to start today

RED FLAGS (Refer to professional help):
- Mentions of self-harm or harming children
- Severe depression lasting weeks
- Inability to function in daily life

RESPONSE FORMAT:
1. Emotional validation (1-2 sentences)
2. Question or gentle challenge (1 sentence)  
3. Reframe or insight (1-2 sentences)
4. Action steps (1-3 concrete items)
5. Commitment ask (1 sentence)`;

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================
const App = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);

  // License state
  const [isLicensed, setIsLicensed] = useState(false);
  const [licenseKey, setLicenseKey] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [licenseError, setLicenseError] = useState('');
  const [checkingLicense, setCheckingLicense] = useState(true);

  // Progress tracking state
  const [actionItems, setActionItems] = useState([]);
  const [completedToday, setCompletedToday] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [checkInData, setCheckInData] = useState(null);
  const [accountabilityMessage, setAccountabilityMessage] = useState(null);

  // Voice input state
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);

  // Template customization state
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================
  
  // Pattern detection
  const detectPatterns = (msgs) => {
    const recentMessages = msgs.slice(-10);
    const userMessages = recentMessages.filter(m => m.role === 'user');
    
    const negativeKeywords = ['tired', 'exhausted', 'overwhelmed', "can't", 'failing', 'terrible'];
    let negativeCount = 0;
    
    userMessages.forEach(msg => {
      negativeKeywords.forEach(keyword => {
        if (msg.content.toLowerCase().includes(keyword)) {
          negativeCount++;
        }
      });
    });
    
    return negativeCount > 5; // Spiraling if 5+ negative indicators
  };

  // Check for existing license on mount
  useEffect(() => {
    const checkStoredLicense = async () => {
      try {
        const storedKey = localStorage.getItem('calmmom-license');
        if (storedKey) {
          const isValid = await verifyLicenseKey(storedKey, true);
          if (isValid) {
            setLicenseKey(storedKey);
            setIsLicensed(true);
          }
        }
      } catch (error) {
        console.log('No stored license');
      } finally {
        setCheckingLicense(false);
      }
    };
    checkStoredLicense();
  }, []);

  // Load messages and check for daily check-in
  useEffect(() => {
    if (isLicensed) {
      // Load messages
      try {
        const saved = localStorage.getItem('calmmom-messages');
        if (saved) {
          const parsed = JSON.parse(saved);
          setMessages(parsed);
          setShowWelcome(parsed.length === 0);
        }
      } catch (error) {
        console.log('No saved messages');
      }

      // Load action items
      try {
        const savedActions = localStorage.getItem('calmmom-actions');
        if (savedActions) {
          setActionItems(JSON.parse(savedActions));
        }
      } catch (error) {
        console.log('No saved actions');
      }

      // Check if daily check-in needed
      const lastCheckIn = localStorage.getItem('calmmom-last-checkin');
      const today = new Date().toDateString();
      
      // Show check-in if: never done before OR last check-in was a different day
      if (!lastCheckIn || new Date(lastCheckIn).toDateString() !== today) {
        setTimeout(() => setShowCheckIn(true), 1000); // Small delay for better UX
      }

      // Load streak
      const savedStreak = localStorage.getItem('calmmom-streak');
      if (savedStreak) {
        setStreak(parseInt(savedStreak));
      }

      // Initialize speech recognition
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = false;
        recognitionInstance.lang = 'en-US';

        recognitionInstance.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setInput(prev => prev + (prev ? ' ' : '') + transcript);
          setIsListening(false);
        };

        recognitionInstance.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognitionInstance.onend = () => {
          setIsListening(false);
        };

        setRecognition(recognitionInstance);
      }
    }
  }, [isLicensed]);

  // Update completed count when actions change
  useEffect(() => {
    const today = new Date().toDateString();
    const todayCompleted = actionItems.filter(item => 
      item.completed && item.completedDate && new Date(item.completedDate).toDateString() === today
    ).length;
    setCompletedToday(todayCompleted);
  }, [actionItems]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const verifyLicenseKey = async (key, silent = false) => {
    try {
      const response = await fetch('/api/verify-license', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ license_key: key }),
      });

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('License verification error:', error);
      if (!silent) {
        setLicenseError('Unable to verify license. Please check your connection.');
      }
      return false;
    }
  };

  const handleLicenseSubmit = async (e) => {
    e.preventDefault();
    setVerifying(true);
    setLicenseError('');

    const isValid = await verifyLicenseKey(licenseKey);

    if (isValid) {
      setIsLicensed(true);
      localStorage.setItem('calmmom-license', licenseKey);
    } else {
      setLicenseError('Invalid license key. Please check and try again.');
    }

    setVerifying(false);
  };

  const saveMessages = (msgs) => {
    localStorage.setItem('calmmom-messages', JSON.stringify(msgs));
  };

  const saveActions = (actions) => {
    localStorage.setItem('calmmom-actions', JSON.stringify(actions));
    setActionItems(actions);
  };

  const toggleAction = (id) => {
    const updated = actionItems.map(item => 
      item.id === id ? { 
        ...item, 
        completed: !item.completed,
        completedDate: !item.completed ? new Date().toISOString() : null
      } : item
    );
    saveActions(updated);
  };

  const handleCheckInComplete = async (data) => {
    setCheckInData(data);
    setShowCheckIn(false);
    localStorage.setItem('calmmom-last-checkin', new Date().toISOString());
    
    // Update streak
    const newStreak = streak + 1;
    setStreak(newStreak);
    localStorage.setItem('calmmom-streak', newStreak.toString());

    // Generate AI response based on check-in
    const checkInMessage = `My mood today is ${data.mood}/5, my energy is ${data.energy}/5, and I want to focus on: ${data.priority}`;
    
    const userMessage = { role: 'user', content: checkInMessage };
    const newMessages = [userMessage];
    setMessages(newMessages);
    setLoading(true);
    setShowWelcome(false);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          system: ENHANCED_SYSTEM_PROMPT + '\n\nThis is the user\'s first message today from their daily check-in. Acknowledge their mood/energy, validate how they\'re feeling, and help them think through their stated priority with 1-2 actionable first steps.',
          messages: newMessages,
        }),
      });

      const responseData = await response.json();
      
      if (responseData.success) {
        const assistantMessage = {
          role: 'assistant',
          content: responseData.content[0].text,
        };
        const updatedMessages = [...newMessages, assistantMessage];
        setMessages(updatedMessages);
        saveMessages(updatedMessages);
      }
    } catch (error) {
      console.error('Check-in response error:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setShowWelcome(false);

    // Add check-in context if available
    let systemPrompt = ENHANCED_SYSTEM_PROMPT;
    if (checkInData) {
      systemPrompt += `\n\nCONTEXT: Today's check-in shows mood: ${checkInData.mood}/5, energy: ${checkInData.energy}/5, priority: "${checkInData.priority}". Keep this in mind.`;
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          system: systemPrompt,
          messages: newMessages,
        }),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get response');
      }

      const assistantMessage = {
        role: 'assistant',
        content: data.content[0].text,
      };

      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);
      saveMessages(updatedMessages);

      // Check for patterns
      const isSpiraling = detectPatterns(updatedMessages);
      if (isSpiraling && !accountabilityMessage) {
        setAccountabilityMessage({
          type: 'intervention',
          text: "I'm noticing we've talked about feeling overwhelmed several times. I'm here for you, and I also want to make sure we're moving toward solutions."
        });
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
      };
      const updatedMessages = [...newMessages, errorMessage];
      setMessages(updatedMessages);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setShowWelcome(true);
    localStorage.removeItem('calmmom-messages');
    setSidebarOpen(false);
  };

  const toggleVoiceInput = () => {
    if (!recognition) {
      alert('Voice input is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const handleQuickTool = (toolName) => {
    const quickToolPrompts = {
      'reset': "I need a 2-minute reset right now. I'm feeling overwhelmed.",
      'affirmations': "Can you give me some affirmations for overwhelmed moms?",
      'meltdown': "My child is having a meltdown and I don't know how to handle it.",
      'meals': "I need help with simple meal planning for my family.",
      'income': "I want to make money online but don't know where to start. Can you help me figure out what I'm good at and give me a plan?",
    };

    const prompt = quickToolPrompts[toolName];
    if (prompt) {
      setInput(prompt);
      setSidebarOpen(false);
      // Auto-send the message
      setTimeout(() => {
        const event = new KeyboardEvent('keypress', { key: 'Enter' });
        document.dispatchEvent(event);
      }, 100);
    }
  };

  const openTemplateModal = (templateType) => {
    setSelectedTemplate(templateType);
    setShowTemplateModal(true);
  };

  const quickPrompts = [
    "I'm feeling completely overwhelmed today",
    "My toddler is having constant meltdowns",
    "I feel guilty about everything",
    "I need a 2-minute reset"
  ];

  // ============================================================================
  // TEMPLATE GENERATOR FUNCTIONS
  // ============================================================================

  const generateBudgetPDF = (data) => {
    const { familyName, month } = data;
    
    const content = `
FAMILY BUDGET TRACKER
Family: ${familyName}
Month: ${month}

INCOME
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Source 1: $_________
Source 2: $_________
Other: $_________
TOTAL INCOME: $_________

FIXED EXPENSES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Rent/Mortgage: $_________
Utilities: $_________
Insurance: $_________
Car Payment: $_________
Childcare: $_________
TOTAL FIXED: $_________

VARIABLE EXPENSES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Groceries: $_________
Gas: $_________
Eating Out: $_________
Entertainment: $_________
Clothing: $_________
Personal Care: $_________
Miscellaneous: $_________
TOTAL VARIABLE: $_________

SAVINGS & DEBT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Emergency Fund: $_________
Savings Goal: $_________
Debt Payment: $_________
TOTAL SAVINGS/DEBT: $_________

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL EXPENSES: $_________
REMAINING: $_________

Notes:
_________________________________
_________________________________
_________________________________

Created with CalmMom Assistant
    `.trim();

    downloadAsPDF(content, `${familyName}_Budget_${month}.pdf`);
  };

  const generateChoresPDF = (data) => {
    const { childName, age } = data;
    
    const ageAppropriateChores = {
      '2-3': ['Put toys in bin', 'Help feed pets', 'Wipe up spills'],
      '4-5': ['Make bed', 'Set table', 'Water plants', 'Sort laundry'],
      '6-8': ['Vacuum room', 'Fold laundry', 'Pack lunch', 'Take out trash'],
      '9-12': ['Do dishes', 'Cook simple meals', 'Yard work', 'Clean bathroom'],
    };

    const ageGroup = age <= 3 ? '2-3' : age <= 5 ? '4-5' : age <= 8 ? '6-8' : '9-12';
    const chores = ageAppropriateChores[ageGroup];

    const content = `
${childName.toUpperCase()}'S CHORE CHART
Age: ${age} years old

DAILY CHORES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        Mon  Tue  Wed  Thu  Fri  Sat  Sun
${chores.map(chore => `${chore.padEnd(20)} ☐    ☐    ☐    ☐    ☐    ☐    ☐`).join('\n')}

WEEKLY GOALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. _____________________________  ☐
2. _____________________________  ☐
3. _____________________________  ☐

REWARDS THIS WEEK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5 chores = _____________________
10 chores = ____________________
All week = _____________________

Great job, ${childName}! 🌟

Created with CalmMom Assistant
    `.trim();

    downloadAsPDF(content, `${childName}_Chores.pdf`);
  };

  const generateJournalPDF = (data) => {
    const { userName, date } = data;
    
    const content = `
${userName.toUpperCase()}'S JOURNAL
${date}

HOW I'M FEELING TODAY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_____________________________________
_____________________________________
_____________________________________

WHAT'S ON MY MIND
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_____________________________________
_____________________________________
_____________________________________
_____________________________________
_____________________________________

WHAT WENT WELL TODAY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_____________________________________
_____________________________________
_____________________________________

WHAT WAS HARD TODAY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_____________________________________
_____________________________________
_____________________________________

TOMORROW I WILL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_____________________________________
_____________________________________
_____________________________________

GRATEFUL FOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. _________________________________
2. _________________________________
3. _________________________________

Created with CalmMom Assistant
    `.trim();

    downloadAsPDF(content, `Journal_${date}.pdf`);
  };

  const downloadAsPDF = (content, filename) => {
    // Create a simple text file (for MVP)
    // In production, you'd use a library like jsPDF for actual PDFs
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.replace('.pdf', '.txt'); // Using .txt for now
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ============================================================================
  // DAILY CHECK-IN COMPONENT
  // ============================================================================
  const DailyCheckInModal = () => {
    const [step, setStep] = useState(1);
    const [responses, setResponses] = useState({ mood: null, energy: null, priority: '' });

    const moods = [
      { emoji: '😫', label: 'Struggling', value: 1 },
      { emoji: '😔', label: 'Low', value: 2 },
      { emoji: '😐', label: 'Okay', value: 3 },
      { emoji: '🙂', label: 'Good', value: 4 },
      { emoji: '😊', label: 'Great', value: 5 },
    ];

    const energyLevels = [
      { label: 'Empty', value: 1 },
      { label: 'Low', value: 2 },
      { label: 'Medium', value: 3 },
      { label: 'Good', value: 4 },
      { label: 'Full', value: 5 },
    ];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
          <div className="text-center mb-6">
            <div className="inline-block p-3 bg-green-100 rounded-full mb-3">
              <Heart className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Daily Check-In</h2>
            <p className="text-gray-600 text-sm mt-1">Let's see how you're doing today</p>
          </div>

          <div className="flex gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`flex-1 h-1 rounded-full ${s <= step ? 'bg-green-600' : 'bg-gray-200'}`} />
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 text-center">How are you feeling right now?</h3>
              <div className="grid grid-cols-5 gap-2">
                {moods.map((mood) => (
                  <button
                    key={mood.value}
                    onClick={() => {
                      setResponses({ ...responses, mood: mood.value });
                      setTimeout(() => setStep(2), 300);
                    }}
                    className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-50"
                  >
                    <span className="text-3xl mb-1">{mood.emoji}</span>
                    <span className="text-xs text-gray-600">{mood.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 text-center">What's your energy level?</h3>
              <div className="space-y-2">
                {energyLevels.map((level) => (
                  <button
                    key={level.value}
                    onClick={() => {
                      setResponses({ ...responses, energy: level.value });
                      setTimeout(() => setStep(3), 300);
                    }}
                    className="w-full p-4 rounded-lg bg-green-100 hover:bg-green-200 transition-all text-left font-medium"
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 text-center">
                What's ONE thing you want to focus on today?
              </h3>
              <textarea
                value={responses.priority}
                onChange={(e) => setResponses({ ...responses, priority: e.target.value })}
                placeholder="Keep it simple... just one thing"
                className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                rows="3"
              />
              <button
                onClick={() => handleCheckInComplete(responses)}
                disabled={!responses.priority.trim()}
                className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg font-medium"
              >
                Start My Day
              </button>
              <button
                onClick={() => setShowCheckIn(false)}
                className="w-full py-2 text-gray-600 hover:text-gray-800 text-sm"
              >
                Skip for now
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ============================================================================
  // TEMPLATE CUSTOMIZATION MODAL
  // ============================================================================
  const TemplateModal = () => {
    const [formData, setFormData] = useState({});

    const handleSubmit = (e) => {
      e.preventDefault();
      
      if (selectedTemplate === 'budget') {
        generateBudgetPDF(formData);
      } else if (selectedTemplate === 'chores') {
        generateChoresPDF(formData);
      } else if (selectedTemplate === 'journal') {
        generateJournalPDF(formData);
      }
      
      setShowTemplateModal(false);
      setFormData({});
    };

    const renderForm = () => {
      if (selectedTemplate === 'budget') {
        return (
          <>
            <input
              type="text"
              placeholder="Family Name (e.g., Smith Family)"
              value={formData.familyName || ''}
              onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
            <input
              type="text"
              placeholder="Month (e.g., January 2025)"
              value={formData.month || ''}
              onChange={(e) => setFormData({ ...formData, month: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </>
        );
      } else if (selectedTemplate === 'chores') {
        return (
          <>
            <input
              type="text"
              placeholder="Child's Name"
              value={formData.childName || ''}
              onChange={(e) => setFormData({ ...formData, childName: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
            <input
              type="number"
              placeholder="Child's Age"
              min="2"
              max="18"
              value={formData.age || ''}
              onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </>
        );
      } else if (selectedTemplate === 'journal') {
        return (
          <>
            <input
              type="text"
              placeholder="Your Name"
              value={formData.userName || ''}
              onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
            <input
              type="date"
              value={formData.date || new Date().toISOString().split('T')[0]}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </>
        );
      }
    };

    const templateTitles = {
      budget: 'Budget Tracker',
      chores: 'Chore Chart',
      journal: 'Daily Journal'
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {templateTitles[selectedTemplate]}
            </h2>
            <button onClick={() => setShowTemplateModal(false)}>
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {renderForm()}
            
            <button
              type="submit"
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download Template
            </button>
          </form>
        </div>
      </div>
    );
  };

  // ============================================================================
  // RENDER LOGIC
  // ============================================================================

  // License activation screen
  if (checkingLicense) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <div className="inline-block p-4 bg-green-100 rounded-full mb-4">
            <Heart className="w-12 h-12 text-green-600 animate-pulse" />
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isLicensed) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="inline-block p-4 bg-green-100 rounded-full mb-4">
                <Heart className="w-12 h-12 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to CalmMom Assistant</h1>
              <p className="text-gray-600">Your safe space for motherhood support</p>
            </div>

            <form onSubmit={handleLicenseSubmit} className="space-y-4">
              <div>
                <label htmlFor="license" className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Your License Key
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="license"
                    type="text"
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value)}
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={verifying}
                    required
                  />
                </div>
              </div>

              {licenseError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {licenseError}
                </div>
              )}

              <button
                type="submit"
                disabled={verifying || !licenseKey.trim()}
                className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                {verifying ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Activate License
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                Don't have a license?{' '}
                <a href="https://gumroad.com/your-product" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 font-medium">
                  Purchase on Gumroad
                </a>
              </p>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Your license key was sent to your email after purchase</p>
          </div>
        </div>
      </div>
    );
  }

  // Main app
  return (
    <div className="flex h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {showCheckIn && <DailyCheckInModal />}
      {showTemplateModal && <TemplateModal />}

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static overflow-y-auto`}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-semibold text-green-800">CalmMom Assistant</h2>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Streak Display */}
          {streak > 0 && (
            <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-lg p-4 text-white mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs opacity-90">Streak</p>
                  <p className="text-2xl font-bold">{streak} days</p>
                </div>
                <TrendingUp className="w-8 h-8 opacity-75" />
              </div>
            </div>
          )}

          {/* Today's Progress */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Today's Focus
              </h3>
            </div>
            {checkInData && (
              <p className="text-sm text-gray-700 bg-green-50 p-2 rounded">
                {checkInData.priority}
              </p>
            )}
          </div>
          
          <div className="flex-1 space-y-4">
            <button
              onClick={() => setShowCheckIn(true)}
              className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
            >
              Daily Check-In
            </button>

            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-900 mb-3">Quick Tools</h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleQuickTool('reset')}
                  className="w-full text-left text-sm text-green-800 hover:text-green-900 hover:bg-green-100 p-2 rounded transition-colors"
                >
                  • 2-Minute Reset
                </button>
                <button
                  onClick={() => handleQuickTool('affirmations')}
                  className="w-full text-left text-sm text-green-800 hover:text-green-900 hover:bg-green-100 p-2 rounded transition-colors"
                >
                  • Affirmations
                </button>
                <button
                  onClick={() => handleQuickTool('meltdown')}
                  className="w-full text-left text-sm text-green-800 hover:text-green-900 hover:bg-green-100 p-2 rounded transition-colors"
                >
                  • Meltdown Guide
                </button>
                <button
                  onClick={() => handleQuickTool('meals')}
                  className="w-full text-left text-sm text-green-800 hover:text-green-900 hover:bg-green-100 p-2 rounded transition-colors"
                >
                  • Meal Planning
                </button>
                <button
                  onClick={() => handleQuickTool('income')}
                  className="w-full text-left text-sm text-green-800 hover:text-green-900 hover:bg-green-100 p-2 rounded transition-colors flex items-center gap-2"
                >
                  <DollarSign className="w-4 h-4" />
                  Make Money Online
                </button>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                <Download className="w-4 h-4" />
                Free Templates
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => openTemplateModal('budget')}
                  className="w-full text-left text-sm text-blue-800 hover:text-blue-900 hover:bg-blue-100 p-2 rounded transition-colors flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Budget Tracker
                </button>
                <button
                  onClick={() => openTemplateModal('chores')}
                  className="w-full text-left text-sm text-blue-800 hover:text-blue-900 hover:bg-blue-100 p-2 rounded transition-colors flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Kids Chore Chart
                </button>
                <button
                  onClick={() => openTemplateModal('journal')}
                  className="w-full text-left text-sm text-blue-800 hover:text-blue-900 hover:bg-blue-100 p-2 rounded transition-colors flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  Daily Journal
                </button>
              </div>
            </div>
            
            <button
              onClick={clearChat}
              className="w-full py-2 px-4 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors"
            >
              Clear Chat
            </button>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 mb-2">
              A safe space for overwhelmed moms
            </div>
            <div className="flex items-center text-xs text-green-700">
              <Check className="w-3 h-3 mr-1" />
              Licensed
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm p-4 flex items-center">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden mr-4"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          <Heart className="w-6 h-6 text-green-600 mr-2" />
          <h1 className="text-xl font-semibold text-gray-800">Your Safe Space</h1>
        </div>

        {/* Accountability Message */}
        {accountabilityMessage && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mx-6 mt-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm text-yellow-800">{accountabilityMessage.text}</p>
                <button
                  onClick={() => setAccountabilityMessage(null)}
                  className="text-xs text-yellow-600 hover:text-yellow-700 mt-1"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          {showWelcome && (
            <div className="max-w-2xl mx-auto text-center space-y-6 py-12">
              <div className="inline-block p-4 bg-green-100 rounded-full">
                <Sparkles className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800">Welcome to CalmMom Assistant 🌿</h2>
              <div className="space-y-3 text-gray-600 text-lg leading-relaxed">
                <p>This is your quiet place when life feels loud.</p>
                <p>Your reset button when overwhelm hits.</p>
                <p>Your support when you're carrying too much.</p>
              </div>
              <div className="pt-6 space-y-2">
                <p className="text-gray-700 font-medium">Tell me what you're struggling with right now —</p>
                <p className="text-gray-600">your stress, your schedule, your emotions, or your child's behavior —</p>
                <p className="text-gray-600">and I'll give you simple, personalized steps to help things feel calmer.</p>
              </div>
              <p className="text-green-700 font-semibold pt-4">You don't have to do everything alone anymore.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-8 max-w-xl mx-auto">
                {quickPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInput(prompt);
                      setShowWelcome(false);
                    }}
                    className="p-3 bg-white hover:bg-green-50 border border-green-200 rounded-lg text-sm text-gray-700 transition-colors text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
            >
              <div
                className={`inline-block max-w-xl p-4 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-800 shadow-sm'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="text-left mb-4">
              <div className="inline-block max-w-xl p-4 rounded-lg bg-white shadow-sm">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="max-w-3xl mx-auto flex gap-2">
            <button
              onClick={toggleVoiceInput}
              disabled={loading}
              className={`px-4 py-3 rounded-lg transition-colors flex items-center ${
                isListening 
                  ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } disabled:opacity-50`}
              title={isListening ? 'Stop listening' : 'Start voice input'}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder={isListening ? "Listening..." : "Share what's on your mind..."}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          {isListening && (
            <p className="text-center text-sm text-red-600 mt-2 animate-pulse">
              🎤 Listening...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
