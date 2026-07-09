import { FiUploadCloud, FiFileText, FiCheckCircle } from 'react-icons/fi';
import { usePageTitle } from '../../hooks/usePageTitle';
import SectionCard from '../../components/common/SectionCard';
import Button from '../../components/ui/Button';

function UploadPage() {
  usePageTitle('Upload');

  return (
    <SectionCard
      title="Upload workspace"
      subtitle="A clean placeholder for catalog, CSV, or inventory imports."
      action={<Button variant="secondary">Review format</Button>}
    >
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-dashed border-cyan-400/30 bg-cyan-400/5 p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-400/15 text-3xl text-cyan-300">
            <FiUploadCloud />
          </div>
          <h3 className="mt-5 text-xl font-semibold text-white">Drag and drop your file here</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Supported file types and validation logic will be connected in later phases.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button type="button">Select file</Button>
            <Button type="button" variant="ghost">
              Use sample template
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <FiFileText className="text-xl text-cyan-300" />
            <p className="mt-3 text-sm font-medium text-white">Accepted inputs</p>
            <p className="mt-1 text-sm text-slate-400">CSV, XLSX, and JSON placeholders.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <FiCheckCircle className="text-xl text-emerald-300" />
            <p className="mt-3 text-sm font-medium text-white">Validation ready</p>
            <p className="mt-1 text-sm text-slate-400">
              The layout is ready for file checks and backend upload flow integration.
            </p>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

export default UploadPage;