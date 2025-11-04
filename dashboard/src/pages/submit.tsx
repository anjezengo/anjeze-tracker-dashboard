/**
 * Submit Page - Form to append new records to tracker_raw
 * Enhanced with smart dropdowns that pull existing values from database
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Head from 'next/head';
import { supabase } from '@/lib/supabase';
import { SmartSelect } from '@/components/SmartSelect';
import dayjs from 'dayjs';

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
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Fetch existing values for dropdowns
  useEffect(() => {
    async function fetchOptions() {
      try {
        const { data, error } = await supabase.from('facts_clean').select('*');

        if (error) throw error;
        if (!data) return;

        const yearsSet = new Set<string>();
        const projectsSet = new Set<string>();
        const subProjectsSet = new Set<string>();
        const institutesSet = new Set<string>();
        const typesSet = new Set<string>();

        data.forEach((row) => {
          if (row.year_label) yearsSet.add(row.year_label);
          if (row.project) projectsSet.add(row.project);
          if (row.sub_project) subProjectsSet.add(row.sub_project);
          if (row.institute) institutesSet.add(row.institute);
          if (row.type_of_institution) typesSet.add(row.type_of_institution);
        });

        setOptions({
          years: Array.from(yearsSet).sort(),
          projects: Array.from(projectsSet).sort(),
          subProjects: Array.from(subProjectsSet).sort(),
          institutes: Array.from(institutesSet).sort(),
          types: Array.from(typesSet).sort(),
        });
      } catch (error) {
        console.error('Error fetching dropdown options:', error);
      } finally {
        setIsLoadingOptions(false);
      }
    }

    fetchOptions();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const canonicalizeText = (text: string) => {
    if (!text) return null;
    return text
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const parseNumeric = (value: string) => {
    if (!value) return null;
    const cleaned = value.replace(/[,₹$]/g, '');
    const parsed = parseFloat(cleaned);
    return !isNaN(parsed) && isFinite(parsed) ? parsed : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      // Parse date
      const dateIso = formData.date
        ? dayjs(formData.date).format('YYYY-MM-DD')
        : null;

      // Parse year
      let yearStart = null;
      let yearEnd = null;
      let yearLabel = formData.year;

      if (formData.year) {
        const rangeMatch = formData.year.match(/^(\d{4})\s*-\s*(\d{2,4})$/);
        if (rangeMatch) {
          yearStart = parseInt(rangeMatch[1], 10);
          let endYear = parseInt(rangeMatch[2], 10);
          if (endYear < 100) {
            const century = Math.floor(yearStart / 100) * 100;
            endYear = century + endYear;
            if (endYear < yearStart) {
              endYear += 100;
            }
          }
          yearEnd = endYear;
          yearLabel = `${yearStart}-${yearEnd}`;
        } else if (/^\d{4}$/.test(formData.year)) {
          yearStart = parseInt(formData.year, 10);
          yearEnd = yearStart;
        }
      }

      // Build row
      const row = {
        year: formData.year || null,
        date: formData.date || null,
        project: formData.project || null,
        sub_project: formData.subProject || null,
        institute: formData.institute || null,
        type_of_institution: formData.typeOfInstitution || null,
        quantity: formData.quantity || null,
        no_of_beneficiaries: formData.beneficiaries || null,
        amount: formData.amount || null,
        remarks: formData.remarks || null,
        project_canon: canonicalizeText(formData.project),
        sub_project_canon: canonicalizeText(formData.subProject),
        institute_canon: canonicalizeText(formData.institute),
        type_of_institution_canon: canonicalizeText(formData.typeOfInstitution),
        remarks_canon: canonicalizeText(formData.remarks),
        year_start: yearStart,
        year_end: yearEnd,
        year_label: yearLabel,
        date_iso: dateIso,
        quantity_num: parseNumeric(formData.quantity),
        no_of_beneficiaries_num: parseNumeric(formData.beneficiaries),
        amount_num: parseNumeric(formData.amount),
        row_hash: `manual-${Date.now()}-${Math.random()}`,
      };

      const { error } = await supabase.from('tracker_raw').insert([row]);

      if (error) throw error;

      setMessage({
        type: 'success',
        text: 'Record submitted successfully!',
      });

      // Reset form
      setFormData({
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
    } catch (error: any) {
      console.error('Submit error:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to submit record',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Submit Data - Anjeze Tracker</title>
        <meta name="description" content="Submit new tracker records" />
      </Head>

      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold text-accent-primary mb-2">
            Submit New Record
          </h2>
          <p className="text-accent-secondary mb-4">
            Add a new entry to the tracker database
          </p>
          <p className="text-sm text-accent-tertiary mb-8">
            💡 <strong>Tip:</strong> Select from existing values or click "Add New" to type your own
          </p>

          {isLoadingOptions ? (
            <div className="glass-effect rounded-xl p-8">
              <div className="flex items-center justify-center space-x-3">
                <div className="shimmer h-8 w-8 rounded-full"></div>
                <span className="text-accent-secondary">Loading form options...</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="glass-effect rounded-xl p-8">
              <div className="space-y-6">
                {/* Year & Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SmartSelect
                    label="Year"
                    name="year"
                    value={formData.year}
                    onChange={(value) =>
                      setFormData({ ...formData, year: value })
                    }
                    options={options.years}
                    placeholder="Select year or type (e.g., 2023 or 2023-24)"
                    allowCustom={true}
                  />
                  <div>
                    <label className="block text-sm font-medium text-accent-secondary mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2 text-accent-primary focus:border-highlight-blue transition-colors"
                    />
                  </div>
                </div>

                {/* Project & Sub-Project */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SmartSelect
                    label="Project"
                    name="project"
                    value={formData.project}
                    onChange={(value) =>
                      setFormData({ ...formData, project: value })
                    }
                    options={options.projects}
                    placeholder="Select or type project name"
                    required={true}
                    allowCustom={true}
                  />
                  <SmartSelect
                    label="Sub-Project"
                    name="subProject"
                    value={formData.subProject}
                    onChange={(value) =>
                      setFormData({ ...formData, subProject: value })
                    }
                    options={options.subProjects}
                    placeholder="Select or type sub-project"
                    allowCustom={true}
                  />
                </div>

                {/* Institute & Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SmartSelect
                    label="Institute"
                    name="institute"
                    value={formData.institute}
                    onChange={(value) =>
                      setFormData({ ...formData, institute: value })
                    }
                    options={options.institutes}
                    placeholder="Select or type institute"
                    allowCustom={true}
                  />
                  <SmartSelect
                    label="Type of Institution"
                    name="typeOfInstitution"
                    value={formData.typeOfInstitution}
                    onChange={(value) =>
                      setFormData({ ...formData, typeOfInstitution: value })
                    }
                    options={options.types}
                    placeholder="Select or type institution type"
                    allowCustom={true}
                  />
                </div>

                {/* Quantity, Beneficiaries, Amount */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-accent-secondary mb-2">
                      Quantity
                    </label>
                    <input
                      type="text"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      placeholder="e.g., 100 or Multiple"
                      className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2 text-accent-primary focus:border-highlight-blue transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-accent-secondary mb-2">
                      Beneficiaries
                    </label>
                    <input
                      type="text"
                      name="beneficiaries"
                      value={formData.beneficiaries}
                      onChange={handleChange}
                      placeholder="e.g., 50"
                      className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2 text-accent-primary focus:border-highlight-blue transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-accent-secondary mb-2">
                      Amount
                    </label>
                    <input
                      type="text"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      placeholder="e.g., 10000"
                      className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2 text-accent-primary focus:border-highlight-blue transition-colors"
                    />
                  </div>
                </div>

                {/* Remarks */}
                <div>
                  <label className="block text-sm font-medium text-accent-secondary mb-2">
                    Remarks
                  </label>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    rows={3}
                    className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2 text-accent-primary focus:border-highlight-blue transition-colors resize-none"
                  />
                </div>

              {/* Message */}
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg ${
                    message.type === 'success'
                      ? 'bg-highlight-green/10 border border-highlight-green'
                      : 'bg-highlight-red/10 border border-highlight-red'
                  }`}
                >
                  <p
                    className={
                      message.type === 'success'
                        ? 'text-highlight-green'
                        : 'text-highlight-red'
                    }
                  >
                    {message.text}
                  </p>
                </motion.div>
              )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-highlight-blue hover:bg-highlight-blue/80 disabled:bg-dark-600 disabled:text-accent-tertiary text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-[1.02]"
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
