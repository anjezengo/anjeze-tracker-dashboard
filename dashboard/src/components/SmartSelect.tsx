/**
 * Smart Select Component
 * Dropdown with existing values + "Add New" option
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

type SmartSelectProps = {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
  allowCustom?: boolean;
};

export function SmartSelect({
  label,
  name,
  value,
  onChange,
  options,
  placeholder = 'Select or type...',
  required = false,
  allowCustom = true,
}: SmartSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (option: string) => {
    onChange(option);
    setSearchQuery('');
    setIsOpen(false);
    setIsCustomMode(false);
  };

  const handleCustom = () => {
    setIsCustomMode(true);
    setIsOpen(false);
    onChange('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (isCustomMode) {
      onChange(val);
    } else {
      setSearchQuery(val);
      setIsOpen(true);
    }
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-accent-secondary mb-2">
        {label} {required && <span className="text-highlight-red">*</span>}
      </label>

      <div className="relative">
        <input
          type="text"
          name={name}
          value={isCustomMode ? value : searchQuery || value}
          onChange={handleInputChange}
          onFocus={() => !isCustomMode && setIsOpen(true)}
          placeholder={placeholder}
          required={required}
          className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2 text-accent-primary focus:border-highlight-blue transition-colors pr-10"
        />

        {!isCustomMode && (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-accent-secondary hover:text-accent-primary"
          >
            <svg
              className={clsx(
                'w-5 h-5 transition-transform',
                isOpen && 'rotate-180'
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        )}

        {isCustomMode && (
          <button
            type="button"
            onClick={() => {
              setIsCustomMode(false);
              onChange('');
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-accent-secondary hover:text-highlight-red text-xs"
            title="Cancel custom input"
          >
            ✕
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && !isCustomMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-2 glass-effect rounded-lg border border-dark-600 max-h-60 overflow-y-auto shadow-2xl"
          >
            {/* Add Custom Option */}
            {allowCustom && (
              <button
                type="button"
                onClick={handleCustom}
                className="w-full px-4 py-3 text-left hover:bg-dark-700 transition-colors border-b border-dark-600 flex items-center gap-2 text-highlight-blue font-medium"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add New (Type Custom Value)
              </button>
            )}

            {/* Existing Options */}
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className="w-full px-4 py-2 text-left hover:bg-dark-700 transition-colors text-accent-primary"
                >
                  {option}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-accent-tertiary italic">
                {searchQuery
                  ? `No matches for "${searchQuery}"`
                  : 'No existing values'}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {isCustomMode && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-1 text-xs text-highlight-blue"
        >
          ✏️ Custom mode - Type your own value
        </motion.div>
      )}
    </div>
  );
}
