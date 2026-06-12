import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Head from 'next/head';

type DropdownOptions = {
  years: string[];
  projects: string[];
  subProjects: string[];
  institutes: string[];
  types: string[];
};

export default function Submit() {
  const [formData, setFormData] = useState({
    year: '',
    date: '',
    project: '',
    subProject: '',
    institute: '',
    typeOfInstitution: '',
    quantity: '',
    beneficiaries: '',
    amount: '',
    remarks: '',
  });

  const [options, setOptions] = useState<DropdownOptions>({
    years: [],
    projects: [],
    subProjects: [],
    institutes: [],
    types: [],
  });

  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function fetchOptions() {
      try {
        const res = await fetch('/api/filter-options');
        const result = await res.json();
        if (result.success && result.data) {
          setOptions({
            years: result.data.years.map(String),
            projects: result.data.projects,
            subProjects: result.data.subProjects,
            institutes: result.data.institutes,
            types: result.data.types,
          });
        }
      } catch (error) {
        console.error('Error fetching options:', error);
      } finally {
        setIsLoadingOptions(false);
      }
    }
    fetchOptions();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await res.json();

      if (!result.success) throw new Error(result.error || 'Submit failed');

      setMessage({ type: 'success', text: 'Record submitted successfully!' });
      setFormData({ year: '', date: '', project: '', subProject: '', institute: '', typeOfInstitution: '', quantity: '', beneficiaries: '', amount: '', remarks: '' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to submit record' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = 'w-full bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-600 rounded-lg px-4 py-2 text-gray-900 dark:text-accent-primary focus:border-highlight-blue transition-colors';
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-accent-secondary mb-2';

  return (
    <>
      <Head>
        <title>Submit Data - Anjeze Tracker</title>
        <meta name="description" content="Submit new tracker records" />
      </Head>

      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-accent-primary mb-2">Submit New Record</h2>
          <p className="text-gray-600 dark:text-accent-secondary mb-8">Add a new entry to the tracker database</p>

          {isLoadingOptions ? (
            <div className="glass-effect rounded-xl p-8">
              <div className="flex items-center justify-center space-x-3">
                <div className="shimmer h-8 w-8 rounded-full"></div>
                <span className="text-gray-600 dark:text-accent-secondary">Loading form options...</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="glass-effect rounded-xl p-8">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>Year</label>
                    <select name="year" value={formData.year} onChange={handleChange} className={inputClass}>
                      <option value="">Select year</option>
                      {options.years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Date</label>
                    <input type="date" name="date" value={formData.date} onChange={handleChange} className={inputClass} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>Project *</label>
                    <select name="project" value={formData.project} onChange={handleChange} required className={inputClass}>
                      <option value="">Select project</option>
                      {options.projects.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Sub-Project</label>
                    <select name="subProject" value={formData.subProject} onChange={handleChange} className={inputClass}>
                      <option value="">Select sub-project</option>
                      {options.subProjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>Institute</label>
                    <select name="institute" value={formData.institute} onChange={handleChange} className={inputClass}>
                      <option value="">Select institute</option>
                      {options.institutes.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Type of Institution</label>
                    <select name="typeOfInstitution" value={formData.typeOfInstitution} onChange={handleChange} className={inputClass}>
                      <option value="">Select type</option>
                      {options.types.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className={labelClass}>Quantity</label>
                    <input type="text" name="quantity" value={formData.quantity} onChange={handleChange} placeholder="e.g., 100 or Multiple" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Beneficiaries</label>
                    <input type="text" name="beneficiaries" value={formData.beneficiaries} onChange={handleChange} placeholder="e.g., 50" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Amount</label>
                    <input type="text" name="amount" value={formData.amount} onChange={handleChange} placeholder="e.g., 10000" className={inputClass} />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Remarks</label>
                  <textarea name="remarks" value={formData.remarks} onChange={handleChange} rows={3} className={inputClass + ' resize-none'} />
                </div>

                {message && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 border border-green-400 dark:bg-green-900/20 dark:border-green-600' : 'bg-red-50 border border-red-400 dark:bg-red-900/20 dark:border-red-600'}`}
                  >
                    <p className={message.type === 'success' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}>
                      {message.text}
                    </p>
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-highlight-blue hover:bg-highlight-blue/80 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 hover:scale-[1.02]"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Record'}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </>
  );
}
