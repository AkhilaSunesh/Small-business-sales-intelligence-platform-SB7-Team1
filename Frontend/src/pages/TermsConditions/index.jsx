import { useNavigate, Link } from 'react-router-dom';
import { usePageTitle } from '../../hooks/usePageTitle';
import { FiArrowLeft, FiFileText } from 'react-icons/fi';
import Button from '../../components/ui/Button';

function TermsConditionsPage() {
  usePageTitle('Terms & Conditions');
  const navigate = useNavigate();

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8 text-slate-100 flex justify-center">
      <div className="max-w-4xl w-full space-y-8">
        <div className="flex items-center justify-between">
          <Button
            variant="secondary"
            onClick={() => navigate(-1)}
            className="gap-2 text-xs py-2 px-4"
          >
            <FiArrowLeft className="text-sm" /> Back
          </Button>
          <Link
            to="/signup"
            className="text-xs text-cyan-400 hover:text-cyan-300 transition underline underline-offset-4"
          >
            Back to Sign Up
          </Link>
        </div>

        <section className="glass-panel rounded-[2rem] p-6 sm:p-10 space-y-6">
          <div className="border-b border-white/10 pb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300 font-bold">
                <FiFileText className="text-xl" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Terms & Conditions</h1>
            </div>
            <p className="text-xs text-slate-400">Last updated: August 2026</p>
          </div>

          <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                1. Acceptance of Terms
              </h2>
              <p>
                By creating an account, registering on, or accessing the MarketMind AI platform, you agree to be bound 
                by these Terms & Conditions. If you do not agree with any part of these terms, you must discontinue platform use.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                2. User Account & Responsibilities
              </h2>
              <p>
                When creating an account, you agree to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
                <li>Provide accurate, current, and complete registration details.</li>
                <li>Maintain the confidentiality of your login credentials and passwords.</li>
                <li>Promptly notify administrators of any unauthorized access or breach of security.</li>
                <li>Assume full responsibility for all activities conducted under your user account.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                3. Permitted Platform Use & Roles
              </h2>
              <p>
                Users are assigned specific platform roles (such as Business Owner, Store Manager, or Sales Executive). 
                You agree not to bypass security protections, abuse API rate limits, access data beyond your authorized permissions, 
                or reverse-engineer the intelligence models.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                4. Sales Invoicing & Billing
              </h2>
              <p>
                MarketMind AI provides tools for generating, calculating taxes, managing receipts, and recording payments. 
                Users are responsible for ensuring that all tax percentages, customer details, and invoice figures comply 
                with applicable regional sales tax laws and accounting guidelines.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                5. Intellectual Property & AI Models
              </h2>
              <p>
                All proprietary forecasting models, customer clustering algorithms, UI components, and software code 
                are the intellectual property of MarketMind AI. Your business maintains complete ownership of all 
                raw transactional data and invoices uploaded.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                6. Service Availability & Termination
              </h2>
              <p>
                We strive for continuous service uptime. We reserve the right to suspend or terminate accounts that violate 
                these terms, engage in malicious activities, or compromise the stability of our system.
              </p>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex justify-between items-center text-xs text-slate-400">
            <span>MarketMind AI Terms of Service</span>
            <Button onClick={() => navigate('/signup')} className="text-xs py-2 px-5">
              Proceed to Sign Up
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}

export default TermsConditionsPage;
