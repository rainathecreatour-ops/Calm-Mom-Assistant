import React, { useState, useEffect, useRef } from 'react';
import { Heart, Send, Sparkles, Menu, X, Lock, Check } from 'lucide-react';

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

  const SYSTEM_PROMPT = `You are CalmMom Assistant — a warm, soothing, emotionally supportive assistant for overwhelmed mothers.

CORE BEHAVIOR RULES:
- Always speak in a calm, gentle, reassuring tone.
- Validate the mom's feelings BEFORE offering guidance.
- Never shame, judge, or pressure.
- Never promote perfectionism.
- Never give medical or unsafe advice.
- Keep responses simple, realistic, and guilt-free.
- Never overwhelm with long explanations or lists.
- Offer no more than 2–3 steps unless the user asks for more.
- Always prioritize emotional regulation, clarity, and calm.
- Use gentle parenting language only.

WHEN RESPONDING:
- First: emotionally validate the mom ("That sounds really heavy…").
- Second: offer simple reassurance ("You're not failing. You're human.").
- Third: give 2–3 calm, doable steps.
- End with a reminder that she is doing better than she thinks.

FOR MELTDOWNS / TANTRUMS:
Always include BOTH:
1) What mom can SAY (a gentle script)
2) What mom can DO (simple actions)

ASK CLARIFYING QUESTIONS WHEN NEEDED:
- Child's age
- Number of children
- Time of day
- Stress level (low / medium / high)
- What feels hardest right now

NEVER:
- Shame moms
- Suggest unsafe actions
- Give medical advice
- Push productivity over emotional safety`;

  // Check for existing license on mount
  useEffect(() => {
    const checkStoredLicense = async () => {
      try {
        const result = await window.storage.get('calmmom-license');
        if (result?.value) {
          const storedKey = result.value;
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isLicensed) {
      const loadMessages = async () => {
        try {
          const result = await window.storage.get('calmmom-messages');
          if (result?.value) {
            const saved = JSON.parse(result.value);
            setMessages(saved);
            setShowWelcome(saved.length === 0);
          }
        } catch (error) {
          console.log('No saved messages');
        }
      };
      loadMessages();
    }
  }, [isLicensed]);

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
      try {
        await window.storage.set('calmmom-license', licenseKey);
      } catch (error) {
        console.error('Failed to save license:', error);
      }
    } else {
      setLicenseError('Invalid license key. Please check and try again.');
    }

    setVerifying(false);
  };

  const saveMessages = async (msgs) => {
    try {
      await window.storage.set('calmmom-messages', JSON.stringify(msgs));
    } catch (error) {
      console.error('Failed to save messages:', error);
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

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: newMessages,
        }),
      });

      const data = await response.json();
      const assistantMessage = {
        role: 'assistant',
        content: data.content[0].text,
      };

      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);
      await saveMessages(updatedMessages);
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

  const clearChat = async () => {
    setMessages([]);
    setShowWelcome(true);
    try {
      await window.storage.delete('calmmom-messages');
    } catch (error) {
      console.error('Failed to clear messages:', error);
    }
    setSidebarOpen(false);
  };

  const quickPrompts = [
    "I'm feeling completely overwhelmed today",
    "My toddler is having constant meltdowns",
    "I feel guilty about everything",
    "I need a 2-minute reset"
  ];

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

  // Main app (same as before)
  return (
    <div className="flex h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static`}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-semibold text-green-800">CalmMom Assistant</h2>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>
          
          <div className="flex-1 space-y-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-900 mb-2">Quick Tools</h3>
              <ul className="space-y-2 text-sm text-green-800">
                <li>• 2-Minute Reset</li>
                <li>• Affirmations</li>
                <li>• Meltdown Guide</li>
                <li>• Meal Planning</li>
              </ul>
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
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Share what's on your mind..."
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
        </div>
      </div>
    </div>
  );
};

export default App;
