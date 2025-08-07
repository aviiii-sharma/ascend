// src/pages/LandingPage.jsx (Updated)

import React, { useState, useEffect, memo, useRef, forwardRef } from 'react'; // MODIFIED: Imported useRef and forwardRef
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, useUser } from "@clerk/clerk-react";

// --- Component Definitions ---

const AscendLogo = ({ width = "30px", height = "30px" }) => (
  <svg width={width} height={height} viewBox="0 0 108 108" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logoGradient" x1="0.5" y1="0" x2="0.5" y2="1">
        <stop offset="0%" stopColor="#8E2DE2" />
        <stop offset="100%" stopColor="#4A00E0" />
      </linearGradient>
    </defs>
    <rect width="24" height="60" x="12" y="48" fill="url(#logoGradient)" rx="4" />
    <rect width="24" height="80" x="42" y="28" fill="url(#logoGradient)" rx="4" />
    <rect width="24" height="100" x="72" y="8" fill="url(#logoGradient)" rx="4" />
  </svg>
);

const Header = memo(() => (
  <motion.header 
    className="flex justify-between items-center py-5"
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: 'easeOut' }}
  >
    <div className="flex items-center gap-3">
      <AscendLogo />
      <span className="text-2xl font-bold text-white">Ascend</span>
    </div>
    
    <div className="flex items-center">
      <SignedOut>
        <div className="flex items-center gap-4">
          <SignInButton mode="modal">
            <motion.button 
              className="px-5 py-2.5 bg-transparent text-white rounded-lg font-semibold" 
              whileHover={{ y: -2 }} 
              whileTap={{ scale: 0.95 }}
            >
              Sign In
            </motion.button>
          </SignInButton>
          <SignUpButton mode="modal">
            <motion.button 
              className="px-5 py-2.5 bg-white text-brand-dark rounded-lg font-semibold" 
              whileHover={{ scale: 1.05, boxShadow: '0 4px 15px rgba(255, 255, 255, 0.1)' }}
              whileTap={{ scale: 0.95 }}
            >
              Sign Up
            </motion.button>
          </SignUpButton>
        </div>
      </SignedOut>

      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </div>
  </motion.header>
));

// MODIFIED: The component now accepts an onGetDemoClick prop to handle the scroll
const HeroSection = memo(({ onGetDemoClick }) => (
  <motion.section 
    className="text-center py-24 sm:py-32"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
  >
    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-5 leading-tight">Turn Reviews into Revenue</h1>
    <p className="text-lg max-w-2xl mx-auto mb-8 text-brand-gray">
      Ascend is the AI-powered talent intelligence platform that replaces biased reviews with fair, data-driven insights to help you retain and develop top performers.
    </p>
    {/* MODIFIED: Added onClick handler to trigger the scroll */}
    <motion.button 
      className="px-8 py-4 text-base font-semibold text-white rounded-lg bg-purple-gradient"
      whileHover={{ scale: 1.05, boxShadow: '0 4px 20px rgba(142, 45, 226, 0.5)' }}
      whileTap={{ scale: 0.95 }}
      onClick={onGetDemoClick}
    >
      Get the app
    </motion.button>
  </motion.section>
));

const sectionVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut', staggerChildren: 0.1 } 
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const FeaturesSection = memo(() => (
  <motion.section 
    className="py-20"
    variants={sectionVariants}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.2 }}
  >
    <h2 className="text-center text-3xl sm:text-4xl font-bold mb-12 text-white">An Evaluation Platform That Actually Works</h2>
    <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8">
      {[
          { 
            title: "AI Feedback Summarization", 
            text: "Our AI intelligently processes unstructured peer comments and manager notes, converting subjective feedback into objective, actionable insights and creating a fair, holistic performance narrative." 
          },
          { 
            title: "Predictive Analytics", 
            text: "Leverage historical performance data to forecast promotion readiness, identify hidden flight risks, and make proactive talent management decisions that align with your business goals." 
          },
          { 
            title: "Automated Anomaly Detection", 
            text: "The system actively monitors performance data to automatically flag significant deviations, providing early warnings for issues like employee burnout, disengagement, or sudden skill gaps." 
          },
          { 
            title: "Interactive AI Chatbot", 
            text: "Empower employees with a self-service tool to conversationally query their performance data, understand their KPIs, and receive personalized advice for career development and upskilling." 
          }
      ].map((feature) => (
          <motion.div key={feature.title} className="bg-card-bg backdrop-blur-lg p-8 rounded-xl border border-brand-gray-dark flex flex-col" variants={cardVariants} whileHover={{ y: -5, boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)' }}>
              <h3 className="text-xl font-semibold mb-2.5 text-white">{feature.title}</h3>
              <p className="text-brand-gray flex-grow">{feature.text}</p>
          </motion.div>
      ))}
    </motion.div>
  </motion.section>
));

const UserRolesSection = memo(() => {
  const [activeTab, setActiveTab] = useState('Employees');
  
  const content = {
      Employees: { title: "Empower Your Growth Journey", points: ["Transparent, role-specific scoring criteria.", "Real-time access to feedback and AI summaries.", "Personalized suggestions for upskilling."] },
      Managers: { title: "Build High-Performing Teams", points: ["Save hours with AI-generated performance summaries.", "Ensure fair, role-based evaluations for your team.", "Get proactive alerts for burnout or morale drops."] },
      HRLeaders: { title: "Drive Strategic Workforce Planning", points: ["Predictive insights into attrition and promotion readiness.", "Visualize organization-wide performance trends.", "Use anomaly detection for compliance and equity."] }
  };
  
  const getTabClasses = (tabName) => {
    const baseClasses = "px-5 py-2.5 text-base rounded-lg transition-colors duration-200";
    if (activeTab === tabName) {
      return `${baseClasses} bg-white text-brand-dark border border-white`;
    }
    return `${baseClasses} bg-transparent text-brand-gray border border-brand-gray-dark hover:bg-brand-gray-dark/50`;
  }

  return (
    <motion.section 
      className="py-20"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      <h2 className="text-center text-3xl sm:text-4xl font-bold mb-12 text-white">Built for the Entire Organization</h2>
      <div className="flex justify-center flex-wrap mb-10 gap-4">
        {['Employees', 'Managers', 'HR Leaders'].map(tab => (
          <motion.button key={tab} className={getTabClasses(tab)} onClick={() => setActiveTab(tab)} whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}>
            For {tab}
          </motion.button>
        ))}
      </div>
      <div className="bg-card-bg backdrop-blur-lg p-10 rounded-xl border border-brand-gray-dark min-h-[220px] overflow-hidden">
        <motion.div key={activeTab} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} transition={{ duration: 0.3 }}>
          <h3 className="text-2xl font-semibold mb-4">{content[activeTab.replace(' ', '')].title}</h3>
          <ul className="list-none p-0 text-brand-gray space-y-2.5">
            {content[activeTab.replace(' ', '')].points.map((point, index) => (
              <motion.li key={index} className="flex items-start" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: index * 0.1 }}>
                <span className="text-primary-purple mr-2.5 mt-1">✓</span>{point}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>
    </motion.section>
  );
});

// MODIFIED: The component is wrapped in forwardRef so it can be targeted for scrolling
const PricingSection = memo(forwardRef((props, ref) => {
    const [selectedPlan, setSelectedPlan] = useState(null);
    const { isSignedIn } = useUser();
    const navigate = useNavigate();

    const pricingPlans = [
        { name: "Team", price: "29", per: "Monthly Billing", description: "For small teams looking to establish a fair and transparent evaluation process.", features: [ "Role-Based KPI Scoring", "AI Feedback Summarization", "Employee & Manager Dashboards", "Standard Reporting" ], cta: "Get Started" },
        { name: "Business", price: "69", per: "Monthly Billing", description: "For growing companies ready to leverage predictive insights and proactive alerts.", features: [ "Everything in Team, plus:", "Predictive Attrition Risk", "Promotion Readiness Analysis", "Automated Anomaly Detection", "HR Leader Dashboard" ], cta: "Choose Business" },
        { name: "Enterprise", price: "Custom", per: "Annual Billing", description: "For large organizations needing advanced customization, security, and support.", features: [ "Everything in Business, plus:", "Interactive AI Chatbot", "Custom API Integrations", "Dedicated Account Manager", "Advanced Security & Compliance" ], cta: "Contact Sales" }
    ];

    const handleCTAClick = (e, planName) => {
      e.stopPropagation();
      if (isSignedIn && planName === 'Team') {
        navigate('/login');
      }
    };

    return (
      // MODIFIED: The ref is attached to the section element
      <motion.section 
        ref={ref}
        className="py-20"
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <h2 className="text-center text-3xl sm:text-4xl font-bold mb-12 text-white">Flexible Pricing for Teams of All Sizes</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {pricingPlans.map((plan) => {
            const isSelected = selectedPlan === plan.name;
            const cardClasses = `bg-card-bg backdrop-blur-lg p-10 rounded-xl border flex flex-col cursor-pointer transition-all duration-300 ease-in-out ${isSelected ? 'border-2 border-primary-purple scale-105' : 'border-brand-gray-dark'}`;
            const buttonClasses = `px-8 py-4 text-base font-semibold rounded-lg mt-auto transition-colors duration-200 ${isSelected ? 'bg-purple-gradient text-white border-none' : 'bg-transparent text-white border border-white hover:bg-white hover:text-brand-dark'}`;

            return (
              <motion.div 
                key={plan.name} 
                className={cardClasses}
                variants={cardVariants} 
                whileHover={{ y: -10, boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)' }}
                onClick={() => setSelectedPlan(plan.name)}
              >
                  <h3 className="text-2xl font-semibold text-white mb-4">{plan.name}</h3>
                  <div className="text-5xl font-bold text-white mb-2.5">{plan.price.startsWith('Custom') ? 'Custom' : `$${plan.price}`}</div>
                  <p className="text-base text-brand-gray mb-5">{plan.per}</p>
                  <p className="text-brand-gray mb-8 flex-grow">{plan.description}</p>
                  <ul className="list-none p-0 mb-10 text-left space-y-4">
                    {plan.features.map((feature) => (<li key={feature} className="flex items-center"><span className="text-primary-purple mr-2.5">✓</span><span>{feature}</span></li>))}
                  </ul>
                  <motion.button 
                    className={buttonClasses}
                    whileHover={{ scale: isSelected ? 1 : 1.05 }} 
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => handleCTAClick(e, plan.name)}
                  >
                    {plan.cta}
                  </motion.button>
              </motion.div>
            )
          })}
        </div>
      </motion.section>
    );
}));

const Footer = memo(() => (
  <motion.footer 
    className="text-center py-10 border-t border-brand-gray-dark text-brand-gray mt-10"
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 1 }}
  >
    <p>© {new Date().getFullYear()} Ascend. All rights reserved.</p>
  </motion.footer>
));


// --- Main App Component ---
const LandingPage = () => {
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  
  // MODIFIED: Create a ref for the pricing section
  const pricingSectionRef = useRef(null);

  // MODIFIED: Create a handler to scroll to the pricing section
  const handleScrollToPricing = () => {
    pricingSectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  useEffect(() => {
    const handleMouseMove = (event) => {
      setCursorPosition({ x: event.clientX, y: event.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="bg-brand-dark text-brand-gray-light font-sans leading-relaxed overflow-x-hidden">
      <motion.div
        className="fixed top-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none z-0 blur-3xl bg-cursor-gradient"
        style={{
          transform: `translate(calc(${cursorPosition.x}px - 50%), calc(${cursorPosition.y}px - 50%))`
        }}
      />
      <div className="max-w-7xl mx-auto px-5 relative z-10">
        <Header />
        <main>
          {/* MODIFIED: Pass the scroll handler to the HeroSection */}
          <HeroSection onGetDemoClick={handleScrollToPricing} />
          <FeaturesSection />
          <UserRolesSection />
          {/* MODIFIED: Pass the ref to the PricingSection */}
          <PricingSection ref={pricingSectionRef} />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default LandingPage;