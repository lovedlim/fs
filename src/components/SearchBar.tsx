'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface Company {
  id: number;
  corp_code: string;
  corp_name: string;
  stock_code: string | null;
}

interface SearchBarProps {
  onCompanySelect: (company: Company) => void;
}

export default function SearchBar({ onCompanySelect }: SearchBarProps) {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 검색 실행
  const searchCompanies = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.get(`/api/companies/search?query=${encodeURIComponent(searchQuery)}`);
      setResults(response.data.companies || []);
    } catch (error) {
      console.error('회사 검색 오류:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 디바운스 처리
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) {
        searchCompanies(query);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative w-full max-w-md" ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="회사명 입력 (예: 삼성전자, LG, 아모레퍼시픽)"
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-600 text-gray-900 font-medium"
        />
        {isLoading && (
          <div className="absolute right-3 top-2.5">
            <div className="animate-spin h-5 w-5 border-2 border-gray-500 rounded-full border-t-transparent"></div>
          </div>
        )}
      </div>

      {showDropdown && results.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {results.map((company) => (
            <div
              key={company.id}
              className="px-4 py-2 cursor-pointer hover:bg-gray-100"
              onClick={() => {
                onCompanySelect(company);
                setQuery(company.corp_name);
                setShowDropdown(false);
              }}
            >
              <div className="font-medium text-gray-900">{company.corp_name}</div>
              {company.stock_code && (
                <div className="text-sm text-gray-700 font-medium">증권코드: {company.stock_code}</div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {showDropdown && query && results.length === 0 && !isLoading && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg p-4">
          <p className="text-center text-gray-800 font-medium mb-2">검색 결과가 없습니다</p>
          <p className="text-xs text-gray-700 text-center font-medium">
            회사명을 정확히 입력해보세요.<br />
            예시: 삼성전자, LG전자, 아모레퍼시픽
          </p>
        </div>
      )}
    </div>
  );
} 