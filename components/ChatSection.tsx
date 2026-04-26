import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { PetProfile, ChatMessage } from '../types';
import { calculateAge } from '../utils';
import { Send, Sparkles, Bot, User as UserIcon } from 'lucide-react';

interface ChatSectionProps {
  profile: PetProfile;
  latestWeight?: number;
}

export const ChatSection: React.FC<ChatSectionProps> = ({ profile, latestWeight }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Construct system context based on pet profile
  const getSystemContext = () => {
    const age = calculateAge(profile.birthDate);
    const weightInfo = latestWeight ? `Current weight is ${latestWeight}kg.` : 'Weight is unknown.';
    const clinicInfo = profile.vetContact?.clinicName 
      ? `Their vet is at ${profile.vetContact.clinicName} (Phone: ${profile.vetContact.phone}).` 
      : '';

    return `You are a helpful, warm, and knowledgeable veterinary assistant for a pet owner.
    The pet's name is ${profile.name || 'the pet'}.
    Species/Breed: ${profile.breed || 'Unknown'}.
    Gender: ${profile.gender}.
    Age: ${age}.
    ${weightInfo}
    ${clinicInfo}
    
    Answer questions concisely and with a friendly tone. 
    If the question is a medical emergency, advise them to contact their vet immediately.
    Use formatting like bullet points for readability if needed.
    `;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      const chat = ai.chats.create({
        model: 'gemini-2.0-flash',
        config: {
          systemInstruction: getSystemContext(),
        },
        history: messages.map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        })),
      });

      const result = await chat.sendMessageStream({ message: userMsg });
      
      let fullResponse = "";
      setMessages(prev => [...prev, { role: 'model', text: '' }]);

      for await (const chunk of result) {
        const c = chunk as GenerateContentResponse;
        const text = c.text;
        if (text) {
          fullResponse += text;
          setMessages(prev => {
            const newArr = [...prev];
            newArr[newArr.length - 1] = { role: 'model', text: fullResponse };
            return newArr;
          });
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "I'm sorry, I'm having trouble connecting right now. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] animate-fade-in">
      <div className="bg-white/80 text-ink p-5 rounded-3xl mb-4 flex items-center gap-4 border border-white/90 shadow-soft">
        <div className="bg-white p-2.5 rounded-full shadow-sm text-clay">
          <Sparkles size={20} />
        </div>
        <div>
          <h3 className="font-serif text-lg leading-tight">AI Companion</h3>
          <p className="text-xs text-pencil uppercase tracking-wider font-medium">Always here to help</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 p-2 custom-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-[60%] text-center text-pencil/60">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-sand">
               <Bot size={28} className="text-warm" />
            </div>
            <p className="text-sm px-8 leading-relaxed">
              Hello! I'm here to chat about {profile.name || 'your pet'}'s health, diet, or habits.
            </p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border ${
               msg.role === 'user' 
               ? 'bg-ink border-ink text-paper' 
               : 'bg-white border-sand text-pencil'
            }`}>
              {msg.role === 'user' ? <UserIcon size={14} /> : <Bot size={16} />}
            </div>
            <div className={`max-w-[85%] p-4 text-sm leading-relaxed shadow-sm ${
              msg.role === 'user' 
                ? 'bg-ink text-paper rounded-[1.5rem] rounded-tr-none' 
                : 'bg-white border border-sand text-ink rounded-[1.5rem] rounded-tl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
           <div className="flex gap-3">
             <div className="w-8 h-8 rounded-full bg-white border border-sand flex items-center justify-center text-pencil">
                <Bot size={16} />
             </div>
             <div className="bg-white border border-sand p-4 rounded-[1.5rem] rounded-tl-none shadow-sm">
                <div className="flex gap-1.5">
                  <span className="w-1.5 h-1.5 bg-warm rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-warm rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-warm rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="mt-4 relative group">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask a question..."
          className="w-full pl-5 pr-14 py-4 bg-card rounded-[2rem] shadow-sm border border-sand text-ink placeholder-warm focus:shadow-md focus:border-warm transition-all"
        />
        <button 
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="absolute right-2 top-2 p-2.5 bg-ink text-paper rounded-full hover:bg-ink/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};
