import React, { useEffect, useState, useMemo } from 'react';
import { fetchCompaniesWithCounts, fetchCompanyReport } from '../api/questions';
import CompanyInsightCard from '../components/CompanyInsightCard';
import { Download, FileText, Filter, Building2, Search, Calendar, BarChart3, Users, File } from 'lucide-react';
import jsPDF from 'jspdf';

// Utility to normalize tags
function normalizeTags(tags) {
  if (!tags) return [];
  return tags
    .flatMap(tag => tag.split(/[;,]/))
    .map(tag => tag.trim())
    .filter(Boolean);
}

const ReportsPage = () => {
  const [companiesData, setCompaniesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedRole, setSelectedRole] = useState('');  const [searchTerm, setSearchTerm] = useState('');
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const companiesWithCounts = await fetchCompaniesWithCounts();
        setCompaniesData(companiesWithCounts);
      } catch (error) {
        console.error('Error loading companies:', error);
      }
      setLoading(false);
    };
    load();
  }, []);

  // Load report data when company or role changes
  useEffect(() => {
    if (selectedCompany) {
      const loadReport = async () => {
        setLoadingReport(true);
        try {
          const data = await fetchCompanyReport(selectedCompany, selectedRole);
          setReportData(data);
        } catch (error) {
          console.error('Error loading report:', error);
          setReportData(null);
        }
        setLoadingReport(false);
      };
      loadReport();
    } else {
      setReportData(null);
    }
  }, [selectedCompany, selectedRole]);

  // Get unique roles for selected company
  const availableRoles = useMemo(() => {
    if (!reportData || !reportData.questions) return [];
    const roles = [...new Set(reportData.questions.map(q => q.job_role).filter(Boolean))];
    return roles.sort();
  }, [reportData]);
  // Filter companies based on search term
  const filteredCompanies = useMemo(() => {
    if (!searchTerm) return companiesData;
    return companiesData.filter(company => 
      company.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [companiesData, searchTerm]);

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowSearchDropdown(value.length > 0);
  };

  // Handle company selection from search dropdown
  const handleCompanySelect = (companyName) => {
    setSelectedCompany(companyName);
    setSelectedRole('');
    setSearchTerm('');
    setShowSearchDropdown(false);
  };

  // Handle clicking outside to close dropdown
  const handleSearchBlur = () => {
    // Delay hiding to allow click events on dropdown items
    setTimeout(() => setShowSearchDropdown(false), 200);
  };// Get filtered questions for report
  const reportQuestions = useMemo(() => {
    if (!reportData || !reportData.questions) return [];
    return reportData.questions.filter(q => {
      // If no role selected, show all questions
      if (!selectedRole) return true;
      
      // If role selected, include questions with that role OR questions with no role
      const roleMatch = q.job_role === selectedRole || !q.job_role || q.job_role.trim() === '';
      return roleMatch;
    });
  }, [reportData, selectedRole]);

  // Use analysis from backend or generate fallback
  const analysis = useMemo(() => {
    if (!reportData || !reportData.analysis) return null;
    return reportData.analysis;
  }, [reportData]);
  // Generate and download report
  const downloadReport = async (format = 'txt') => {
    if (!selectedCompany) {
      alert('Please select a company to generate a report');
      return;
    }

    setGenerating(true);
    try {
      const reportTitle = selectedRole 
        ? `${selectedCompany} - ${selectedRole} Interview Report`
        : `${selectedCompany} Company Interview Report`;

      if (format === 'pdf') {
        await downloadPDFReport(reportTitle);
      } else {
        await downloadTextReport(reportTitle);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report. Please try again.');
    }
    setGenerating(false);
  };

  const downloadTextReport = async (reportTitle) => {
    const reportContent = generateReportContent(reportTitle, analysis, reportQuestions);
    
    // Create and download file
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedCompany}${selectedRole ? '_' + selectedRole : ''}_interview_report_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  const downloadPDFReport = async (reportTitle) => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const lineHeight = 6;
    let yPosition = margin;

    // Helper function to add text with line wrapping and page breaks
    const addWrappedText = (text, x, y, maxWidth, fontSize = 10) => {
      pdf.setFontSize(fontSize);
      const lines = pdf.splitTextToSize(text, maxWidth);
      
      // Check if we need a new page
      if (y + (lines.length * lineHeight) > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }
      
      pdf.text(lines, x, y);
      return y + (lines.length * lineHeight);
    };

    // Helper function to check and add new page if needed
    const checkNewPage = (requiredSpace = 20) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }
      return yPosition;
    };

    // Add title
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    yPosition = addWrappedText(reportTitle, margin, yPosition, pageWidth - 2 * margin, 16) + 5;

    // Add date and filter info
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    yPosition = addWrappedText(`Generated on: ${new Date().toLocaleDateString()}`, margin, yPosition, pageWidth - 2 * margin) + 2;
    yPosition = addWrappedText(`Filter: ${selectedRole ? `Company: ${selectedCompany}, Role: ${selectedRole}` : `Company: ${selectedCompany}`}`, margin, yPosition, pageWidth - 2 * margin) + 2;
    yPosition = addWrappedText(`Total Questions: ${reportQuestions.length}`, margin, yPosition, pageWidth - 2 * margin) + 10;

    // Add analysis summary
    if (analysis) {
      checkNewPage(50);
      pdf.setFont(undefined, 'bold');
      yPosition = addWrappedText('EXECUTIVE SUMMARY', margin, yPosition, pageWidth - 2 * margin, 12) + 5;
      
      pdf.setFont(undefined, 'normal');
      const summaryItems = [
        `• Total Questions Analyzed: ${reportQuestions.length}`,
        `• Questions with Frequency Data: ${analysis.frequencyAnalysis?.totalWithFrequency || 0}`,
        `• Average Question Frequency: ${analysis.frequencyAnalysis?.averageFrequency || 0}`,
        `• Hot Questions Identified: ${analysis.frequencyAnalysis?.hotQuestions?.length || 0}`,
        `• Unique Job Roles: ${analysis.roleDistribution?.length || 0}`,
      ];

      for (const item of summaryItems) {
        yPosition = addWrappedText(item, margin, yPosition, pageWidth - 2 * margin) + 2;
      }
      yPosition += 10;

      // Add top topics
      if (analysis.topTopics && analysis.topTopics.length > 0) {
        checkNewPage(50);
        
        pdf.setFont(undefined, 'bold');
        yPosition = addWrappedText('TOP INTERVIEW TOPICS', margin, yPosition, pageWidth - 2 * margin, 12) + 5;
        
        pdf.setFont(undefined, 'normal');
        analysis.topTopics.slice(0, 10).forEach((topic, index) => {
          yPosition = addWrappedText(`${index + 1}. ${topic.tag} - ${topic.count} questions (${topic.percentage}%)`, margin, yPosition, pageWidth - 2 * margin) + 2;
        });
        yPosition += 10;
      }

      // Add role distribution
      if (analysis.roleDistribution && analysis.roleDistribution.length > 0) {
        checkNewPage(50);
        
        pdf.setFont(undefined, 'bold');
        yPosition = addWrappedText('ROLE DISTRIBUTION', margin, yPosition, pageWidth - 2 * margin, 12) + 5;
        
        pdf.setFont(undefined, 'normal');
        analysis.roleDistribution.forEach((role, index) => {
          yPosition = addWrappedText(`${index + 1}. ${role.role || 'No specific role'} - ${role.count} questions (${role.percentage}%)`, margin, yPosition, pageWidth - 2 * margin) + 2;
        });
        yPosition += 10;
      }

      // Add hot questions
      if (analysis.frequencyAnalysis?.hotQuestions && analysis.frequencyAnalysis.hotQuestions.length > 0) {
        checkNewPage(50);
        
        pdf.setFont(undefined, 'bold');
        yPosition = addWrappedText('MOST FREQUENTLY ASKED QUESTIONS', margin, yPosition, pageWidth - 2 * margin, 12) + 5;
        
        pdf.setFont(undefined, 'normal');
        analysis.frequencyAnalysis.hotQuestions.forEach((q, index) => {
          checkNewPage(30);
          
          yPosition = addWrappedText(`${index + 1}. [Frequency: ${q.frequency}] ${q.question}`, margin, yPosition, pageWidth - 2 * margin) + 1;
          if (q.job_role) yPosition = addWrappedText(`   Role: ${q.job_role}`, margin, yPosition, pageWidth - 2 * margin) + 1;
          if (q.link) yPosition = addWrappedText(`   Link: ${q.link}`, margin, yPosition, pageWidth - 2 * margin) + 1;
          if (normalizeTags(q.tags).length > 0) {
            yPosition = addWrappedText(`   Tags: ${normalizeTags(q.tags).join(', ')}`, margin, yPosition, pageWidth - 2 * margin) + 1;
          }
          yPosition += 3;
        });
        yPosition += 10;
      }
    }

    // Add ALL questions - not just a preview
    checkNewPage(30);
    
    pdf.setFont(undefined, 'bold');
    yPosition = addWrappedText(`ALL QUESTIONS DETAILED LIST (${reportQuestions.length} total)`, margin, yPosition, pageWidth - 2 * margin, 12) + 5;
    
    pdf.setFont(undefined, 'normal');
    
    reportQuestions.forEach((q, index) => {
      // Check if we need significant space for this question entry
      checkNewPage(40);
      
      // Question number and text
      yPosition = addWrappedText(`${index + 1}. ${q.question || 'No question text'}`, margin, yPosition, pageWidth - 2 * margin) + 1;
      
      // Company
      yPosition = addWrappedText(`   Company: ${q.company_name || 'N/A'}`, margin, yPosition, pageWidth - 2 * margin) + 1;
      
      // Role (if available)
      if (q.job_role) {
        yPosition = addWrappedText(`   Role: ${q.job_role}`, margin, yPosition, pageWidth - 2 * margin) + 1;
      }
      
      // Frequency (if available)
      if (q.frequency) {
        yPosition = addWrappedText(`   Frequency: ${q.frequency}`, margin, yPosition, pageWidth - 2 * margin) + 1;
      }
      
      // Date (if available)
      if (q.time) {
        yPosition = addWrappedText(`   Date: ${q.time}`, margin, yPosition, pageWidth - 2 * margin) + 1;
      }
      
      // Link (if available)
      if (q.link) {
        yPosition = addWrappedText(`   Link: ${q.link}`, margin, yPosition, pageWidth - 2 * margin) + 1;
      }
      
      // Tags (if available)
      if (normalizeTags(q.tags).length > 0) {
        yPosition = addWrappedText(`   Tags: ${normalizeTags(q.tags).join(', ')}`, margin, yPosition, pageWidth - 2 * margin) + 1;
      }
      
      // Source
      yPosition = addWrappedText(`   Source: ${q.source || 'N/A'}`, margin, yPosition, pageWidth - 2 * margin) + 1;
      
      // Add spacing between questions
      yPosition += 4;
    });

    // Add footer
    checkNewPage(20);
    yPosition += 10;
    pdf.setFont(undefined, 'italic');
    pdf.setFontSize(9);
    yPosition = addWrappedText('Generated by Interview Question Explorer', margin, yPosition, pageWidth - 2 * margin, 9) + 2;
    yPosition = addWrappedText(`Report generated on: ${new Date().toLocaleDateString()}`, margin, yPosition, pageWidth - 2 * margin, 9);

    // Save PDF
    const fileName = `${selectedCompany}${selectedRole ? '_' + selectedRole : ''}_interview_report_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  };
  const generateReportContent = (title, analysis, questions) => {
    const currentDate = new Date().toLocaleDateString();
    const filterText = selectedRole ? `Company: ${selectedCompany}, Role: ${selectedRole}` : `Company: ${selectedCompany}`;
    
    let content = `
${title}
${'='.repeat(title.length)}

Generated on: ${currentDate}
Filter: ${filterText}
Total Questions: ${questions.length}

`;

    if (analysis) {
      content += `
EXECUTIVE SUMMARY
================

• Total Questions Analyzed: ${questions.length}
• Questions with Frequency Data: ${analysis.frequencyAnalysis?.totalWithFrequency || 0}
• Average Question Frequency: ${analysis.frequencyAnalysis?.averageFrequency || 0}
• Hot Questions Identified: ${analysis.frequencyAnalysis?.hotQuestions?.length || 0}
• Unique Job Roles: ${analysis.roleDistribution?.length || 0}
• Data Sources: ${Object.keys(analysis.sourceDistribution || {}).join(', ')}

`;

      // Top Topics Analysis
      if (analysis.topTopics && analysis.topTopics.length > 0) {
        content += `
TOP INTERVIEW TOPICS
===================

`;
        analysis.topTopics.forEach((topic, index) => {
          content += `${index + 1}. ${topic.tag} - ${topic.count} questions (${topic.percentage}%)\n`;
        });
      }

      // Role Distribution
      if (analysis.roleDistribution && analysis.roleDistribution.length > 0) {
        content += `
ROLE DISTRIBUTION
================

`;
        analysis.roleDistribution.forEach((role, index) => {
          content += `${index + 1}. ${role.role} - ${role.count} questions (${role.percentage}%)\n`;
        });
      }

      // Hot Questions
      if (analysis.frequencyAnalysis?.hotQuestions && analysis.frequencyAnalysis.hotQuestions.length > 0) {
        content += `
MOST FREQUENTLY ASKED QUESTIONS
==============================

`;
        analysis.frequencyAnalysis.hotQuestions.forEach((q, index) => {
          content += `${index + 1}. [Frequency: ${q.frequency}] ${q.question}\n`;
          if (q.job_role) content += `   Role: ${q.job_role}\n`;
          if (q.link) content += `   Link: ${q.link}\n`;
          if (normalizeTags(q.tags).length > 0) {
            content += `   Tags: ${normalizeTags(q.tags).join(', ')}\n`;
          }
          content += '\n';
        });
      }

      // Time Distribution
      if (analysis.timeAnalysis && analysis.timeAnalysis.length > 0) {
        content += `
QUESTIONS BY YEAR
================

`;
        analysis.timeAnalysis.forEach(([year, count]) => {
          content += `${year}: ${count} questions\n`;
        });
      }

      // Source Distribution
      if (analysis.sourceDistribution) {
        content += `
DATA SOURCE BREAKDOWN
====================

`;
        Object.entries(analysis.sourceDistribution).forEach(([source, count]) => {
          content += `${source}: ${count} questions\n`;
        });
      }
    }

    // All Questions Details
    content += `
ALL QUESTIONS DETAILED LIST
===========================

`;

    questions.forEach((q, index) => {
      content += `${index + 1}. ${q.question || 'No question text'}\n`;
      content += `   Company: ${q.company_name || 'N/A'}\n`;
      if (q.job_role) content += `   Role: ${q.job_role}\n`;
      if (q.frequency) content += `   Frequency: ${q.frequency}\n`;
      if (q.time) content += `   Date: ${q.time}\n`;
      if (q.link) content += `   Link: ${q.link}\n`;
      if (normalizeTags(q.tags).length > 0) {
        content += `   Tags: ${normalizeTags(q.tags).join(', ')}\n`;
      }
      content += `   Source: ${q.source || 'N/A'}\n`;
      content += '\n';
    });

    content += `
REPORT END
==========
Generated by Interview Question Explorer
Date: ${currentDate}
`;

    return content;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading data...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-600" />
                Company Reports
              </h1>
              <p className="text-gray-600 mt-1">Generate comprehensive analysis reports for companies and roles</p>
            </div>
          </div>
        </div>
      </div>      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Companies Overview Stats */}
        {!loading && companiesData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              Database Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  <span className="text-sm font-medium">Total Companies</span>
                </div>
                <p className="text-2xl font-bold mt-1">{companiesData.length}</p>
              </div>
              
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  <span className="text-sm font-medium">Total Questions</span>
                </div>
                <p className="text-2xl font-bold mt-1">
                  {companiesData.reduce((acc, c) => acc + c.totalQuestions, 0).toLocaleString()}
                </p>
              </div>
              
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                <div className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  <span className="text-sm font-medium">Interview Questions</span>
                </div>
                <p className="text-2xl font-bold mt-1">
                  {companiesData.reduce((acc, c) => acc + c.interviewQuestions, 0).toLocaleString()}
                </p>
              </div>
              
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  <span className="text-sm font-medium">LeetCode Questions</span>
                </div>
                <p className="text-2xl font-bold mt-1">
                  {companiesData.reduce((acc, c) => acc + c.leetcodeQuestions, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Popular Companies Quick Actions */}
        {!loading && companiesData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Popular Companies
            </h2>
            <p className="text-gray-600 mb-4">Quick access to companies with the most questions</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {companiesData.slice(0, 8).map((company) => (
                <button
                  key={company.name}
                  onClick={() => {
                    setSelectedCompany(company.name);
                    setSelectedRole('');
                  }}
                  className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                    selectedCompany === company.name
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900">{company.name}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {company.totalQuestions} total questions
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {company.interviewQuestions} interview • {company.leetcodeQuestions} leetcode
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Report Configuration */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-600" />
            Report Configuration
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">            {/* Company Search */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Companies</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search companies..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onFocus={() => searchTerm.length > 0 && setShowSearchDropdown(true)}
                  onBlur={handleSearchBlur}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                {/* Search Dropdown */}
                {showSearchDropdown && filteredCompanies.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
                    {filteredCompanies.slice(0, 10).map((company) => (
                      <button
                        key={company.name}
                        onClick={() => handleCompanySelect(company.name)}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <div className="font-medium text-gray-900">{company.name}</div>
                        <div className="text-sm text-gray-600">
                          {company.totalQuestions} questions • {company.interviewQuestions} interview • {company.leetcodeQuestions} leetcode
                        </div>
                      </button>
                    ))}
                    {filteredCompanies.length > 10 && (
                      <div className="px-4 py-2 text-sm text-gray-500 bg-gray-50">
                        ... and {filteredCompanies.length - 10} more companies
                      </div>
                    )}
                  </div>
                )}
                
                {/* No results message */}
                {showSearchDropdown && searchTerm.length > 0 && filteredCompanies.length === 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50">
                    <div className="text-gray-500 text-center">No companies found matching "{searchTerm}"</div>
                  </div>
                )}
              </div>
            </div>{/* Company Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Company</label>
              <select
                value={selectedCompany}
                onChange={e => {
                  setSelectedCompany(e.target.value);
                  setSelectedRole(''); // Reset role when company changes
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a company...</option>
                {filteredCompanies.map(company => (
                  <option key={company.name} value={company.name}>
                    {company.name} ({company.totalQuestions} questions)
                  </option>
                ))}
              </select>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Role (Optional)</label>
              <select
                value={selectedRole}
                onChange={e => setSelectedRole(e.target.value)}
                disabled={!selectedCompany}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">All roles</option>
                {availableRoles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
          </div>          {/* Report Summary */}
          {selectedCompany && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-blue-900 mb-2">Report Preview</h3>
              {loadingReport ? (
                <div className="flex items-center gap-2 text-blue-800">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>Loading report data...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-800">Company: {selectedCompany}</span>
                  </div>
                  {selectedRole && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-600" />
                      <span className="text-purple-800">Role: {selectedRole}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-green-600" />
                    <span className="text-green-800">Questions: {reportQuestions.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-orange-600" />
                    <span className="text-orange-800">Date: {new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              )}
            </div>
          )}          {/* Download Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => downloadReport('txt')}
              disabled={!selectedCompany || generating}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="h-5 w-5" />
              {generating ? 'Generating...' : 'Download Text Report'}
            </button>
              <button
              onClick={() => downloadReport('pdf')}
              disabled={!selectedCompany || generating}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <File className="h-5 w-5" />
              {generating ? 'Generating...' : 'Download PDF Report'}
            </button>
          </div>
        </div>

        {/* Live Preview */}
        {selectedCompany && reportQuestions.length > 0 && (
          <div className="space-y-6">
            {/* Company Analysis Card */}
            <CompanyInsightCard company={selectedCompany} questions={reportQuestions} />

            {/* Questions Preview */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Questions Preview ({reportQuestions.length} total)
              </h3>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {reportQuestions.slice(0, 10).map((q, index) => (
                  <div key={q._id} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {q.link ? (
                          <a 
                            href={q.link} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                          >
                            {q.question}
                          </a>
                        ) : (
                          <p className="text-gray-900 font-medium">{q.question || 'No question text'}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          {q.job_role && <span>Role: {q.job_role}</span>}
                          {q.frequency && <span>Frequency: {q.frequency}</span>}
                          {q.time && <span>Date: {q.time}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {reportQuestions.length > 10 && (
                  <div className="text-center py-4 text-gray-500">
                    ... and {reportQuestions.length - 10} more questions in the full report
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!selectedCompany && (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Company to Generate Report</h3>
            <p className="text-gray-600">Choose a company from the dropdown above to see available data and generate a comprehensive report</p>
          </div>
        )}

        {selectedCompany && reportQuestions.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Questions Found</h3>
            <p className="text-gray-600">No questions found for the selected company and role combination</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
