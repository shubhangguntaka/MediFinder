
import React, { useState } from 'react';
import { SearchIcon } from './icons';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-2xl mx-auto">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <SearchIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
      </div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for a medicine (e.g., Paracetamol) or a pharmacy..."
        className="block w-full pl-11 pr-32 py-3.5 text-base border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-800 dark:border-slate-600 dark:placeholder-gray-400 dark:text-white"
        disabled={isLoading}
        aria-label="Search for medicines or pharmacies"
      />
      <button
        type="submit"
        disabled={isLoading || !query.trim()}
        className="absolute inset-y-0 right-0 flex items-center justify-center w-28 m-1.5 font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed dark:disabled:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
      >
        {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        ) : 'Search'}
      </button>
    </form>
  );
};

export default SearchBar;
