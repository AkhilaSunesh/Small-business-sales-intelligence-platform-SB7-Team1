import { useNavigate, Link } from 'react-router-dom';
import { usePageTitle } from '../../hooks/usePageTitle';
import { FiArrowLeft, FiShield, FiLock, FiCheckCircle } from 'react-icons/fi';
import Button from '../../components/ui/Button';

function PrivacyPolicyPage() {
  usePageTitle('Privacy Policy');
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
                <FiShield className="text-xl" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Privacy Policy</h1>
            </div>
            <p className="text-xs text-slate-400">Last updated: August 2026</p>
          </div>

          <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                1. Overview & Information Collection
              </h2>
              <p>
                MarketMind AI respects your privacy and is committed to protecting your personal and business data. 
                We collect information you provide directly to us when registering for an account, creating sales invoices, 
                managing user records, and using our business intelligence services.
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
                <li>Contact information (e.g., Full Name, Business Email, Phone Number).</li>
                <li>Account credentials (encrypted passwords and security tokens).</li>
                <li>Transaction and invoice metadata (product line items, payment methods, transaction amounts).</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                2. How We Use Your Data
              </h2>
              <p>
                We use the collected information for providing, maintaining, and improving our intelligence platform, including:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
                <li>Generating accurate sales forecasting and demand predictions.</li>
                <li>Detecting revenue anomalies and inventory stockout risks.</li>
                <li>Generating printable, downloadable, and compliant customer invoices.</li>
                <li>Securing your organization with role-based access control (RBAC).</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                3. Data Security & Storage
              </h2>
              <p>
                We employ industry-standard encryption (AES-256 and TLS/SSL) to safeguard your data both in transit and at rest. 
                User passwords are cryptographic salted hashes and are never stored in plaintext. Access to business databases 
                is strictly restricted to authorized services through API Gateway authentication.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                4. Third-Party Sharing
              </h2>
              <p>
                We do not sell, rent, or trade your personal or financial data to third-party advertisers. 
                Data is shared only with trusted infrastructure providers (such as hosting and database services) necessary 
                to operate the MarketMind AI platform.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                5. Your Rights & Contact Information
              </h2>
              <p>
                You retain full ownership of your data. You may request access to, export, or deletion of your personal account 
                and sales intelligence records by contacting support at <span className="text-cyan-300">privacy@marketmind.ai</span>.
              </p>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex justify-between items-center text-xs text-slate-400">
            <span>MarketMind AI Data Protection</span>
            <Button onClick={() => navigate('/signup')} className="text-xs py-2 px-5">
              Proceed to Sign Up
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}

export default PrivacyPolicyPage;
