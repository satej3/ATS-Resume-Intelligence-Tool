import { useState } from 'react';
import './ResultDashboard.css';

export default function ResultDashboard({ result }) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!result) return null;

  const { 
    atsScore, 
    strongMatches = [], 
    partialMatches = [], 
    missingSkills = [],
    sectionFeedback = {},
    insights = [],
    checklist = []
  } = result;

  // Get score interpretation
  const getScoreInterpretation = (score) => {
    if (score >= 85) return { level: 'Excellent Match', stars: '⭐⭐⭐⭐⭐', class: 'excellent' };
    if (score >= 70) return { level: 'Good Match', stars: '⭐⭐⭐⭐', class: 'good' };
    if (score >= 55) return { level: 'Fair Match', stars: '⭐⭐⭐', class: 'moderate' };
    if (score >= 40) return { level: 'Poor Match', stars: '⭐⭐', class: 'fair' };
    return { level: 'Very Poor Match', stars: '⭐', class: 'poor' };
  };

  const scoreInterpretation = getScoreInterpretation(atsScore || 0);

  return (
    <div className="result-dashboard">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="score-container">
          <div className={`score-circle ${scoreInterpretation.class}`}>
            <span className="score-number">{atsScore || 0}</span>
            <span className="score-label">ATS Score</span>
          </div>
          <div className="score-details">
            <h2 className="match-quality">{scoreInterpretation.level} {scoreInterpretation.stars}</h2>
            <p className="keyword-summary">
              <strong>{strongMatches.length}</strong> strong matches, 
              <strong>{partialMatches.length}</strong> partial matches, 
              <strong>{missingSkills.length}</strong> missing skills
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="dashboard-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'matches' ? 'active' : ''}`}
          onClick={() => setActiveTab('matches')}
        >
          Skill Matches
        </button>
        <button 
          className={`tab ${activeTab === 'insights' ? 'active' : ''}`}
          onClick={() => setActiveTab('insights')}
        >
          Insights
        </button>
        <button 
          className={`tab ${activeTab === 'checklist' ? 'active' : ''}`}
          onClick={() => setActiveTab('checklist')}
        >
          Action Plan
        </button>
      </div>

      {/* Content Area */}
      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <OverviewTab 
            strongMatches={strongMatches}
            partialMatches={partialMatches}
            missingSkills={missingSkills}
            sectionFeedback={sectionFeedback}
          />
        )}

        {activeTab === 'matches' && (
          <MatchesTab 
            strongMatches={strongMatches}
            partialMatches={partialMatches}
            missingSkills={missingSkills}
          />
        )}

        {activeTab === 'insights' && (
          <InsightsTab insights={insights} />
        )}

        {activeTab === 'checklist' && (
          <ChecklistTab checklist={checklist} />
        )}
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ strongMatches, partialMatches, missingSkills, sectionFeedback }) {
  return (
    <div className="overview-tab">
      {/* Quick Stats */}
      <div className="stats-grid">
        <div className="stat-card strong">
          <div className="stat-number">{strongMatches.length}</div>
          <div className="stat-label">Strong Matches</div>
        </div>
        <div className="stat-card partial">
          <div className="stat-number">{partialMatches.length}</div>
          <div className="stat-label">Partial Matches</div>
        </div>
        <div className="stat-card missing">
          <div className="stat-number">{missingSkills.length}</div>
          <div className="stat-label">Missing Skills</div>
        </div>
        <div className="stat-card structure">
          <div className="stat-number">{sectionFeedback?.skillCount || 0}</div>
          <div className="stat-label">Skills Listed</div>
        </div>
      </div>

      {/* Section Analysis */}
      <div className="analysis-section">
        <h3>Resume Structure Analysis</h3>
        <div className="section-info">
          <div className="section-checks">
            <div className={`check-item ${sectionFeedback?.hasSkillsSection ? 'pass' : 'fail'}`}>
              {sectionFeedback?.hasSkillsSection ? '✓' : '✗'} Skills Section
            </div>
            <div className={`check-item ${sectionFeedback?.hasExperienceSection ? 'pass' : 'fail'}`}>
              {sectionFeedback?.hasExperienceSection ? '✓' : '✗'} Experience Section
            </div>
            <div className={`check-item ${sectionFeedback?.hasMetrics ? 'pass' : 'fail'}`}>
              {sectionFeedback?.hasMetrics ? '✓' : '✗'} Quantifiable Metrics
            </div>
          </div>
          {sectionFeedback?.sections && (
            <div className="section-order">
              <strong>Section Order:</strong> {sectionFeedback.sections.join(' → ')}
            </div>
          )}
        </div>
      </div>

      {/* Top Missing Skills Preview */}
      {missingSkills.length > 0 && (
        <div className="analysis-section">
          <h3>Critical Missing Skills</h3>
          <div className="missing-skills-preview">
            {missingSkills.slice(0, 6).map((skill, index) => (
              <span key={index} className={`skill-tag missing ${skill.importance}`}>
                {skill.skill}
              </span>
            ))}
            {missingSkills.length > 6 && (
              <span className="skill-tag more">+{missingSkills.length - 6} more</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Matches Tab Component
function MatchesTab({ strongMatches, partialMatches, missingSkills }) {
  return (
    <div className="matches-tab">
      {/* Strong Matches */}
      <div className="match-section">
        <h3>✅ Strong Matches ({strongMatches.length})</h3>
        {strongMatches.length > 0 ? (
          <div className="matches-list">
            {strongMatches.map((match, index) => (
              <div key={index} className="match-item strong">
                <div className="match-header">
                  <span className="skill-name">{match.skill}</span>
                  <div className="match-badges">
                    {match.inSkillsSection && <span className="badge listed">Listed</span>}
                    {match.demonstrated && <span className="badge demonstrated">Demonstrated</span>}
                    {match.importance === 'required' && <span className="badge required">Required</span>}
                  </div>
                </div>
                {match.matchedAs && (
                  <div className="match-detail">
                    Matched as: <em>{match.matchedAs}</em>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="no-matches">No strong matches found. Focus on adding relevant skills.</p>
        )}
      </div>

      {/* Partial Matches */}
      {partialMatches.length > 0 && (
        <div className="match-section">
          <h3>⚠️ Partial Matches ({partialMatches.length})</h3>
          <div className="matches-list">
            {partialMatches.map((match, index) => (
              <div key={index} className="match-item partial">
                <div className="match-header">
                  <span className="skill-name">{match.skill}</span>
                  <div className="match-badges">
                    <span className="badge similarity">{match.similarity}% similar</span>
                    {match.importance === 'required' && <span className="badge required">Required</span>}
                  </div>
                </div>
                {match.matchedAs && (
                  <div className="match-detail">
                    Matched as: <em>{match.matchedAs}</em>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Missing Skills */}
      <div className="match-section">
        <h3>❌ Missing Skills ({missingSkills.length})</h3>
        {missingSkills.length > 0 ? (
          <div className="missing-skills-grid">
            {missingSkills.map((skill, index) => (
              <div key={index} className={`missing-skill-item ${skill.importance} ${skill.impact}`}>
                <span className="skill-name">{skill.skill}</span>
                <div className="skill-info">
                  <span className={`importance ${skill.importance}`}>{skill.importance}</span>
                  <span className={`impact ${skill.impact}`}>{skill.impact} impact</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-missing">Great! All required skills are present.</p>
        )}
      </div>
    </div>
  );
}

// Insights Tab
function InsightsTab({ insights }) {
  return (
    <div className="insights-tab">
      <h3>💡 AI-Powered Insights</h3>
      {insights?.length > 0 ? (
        <div className="insights-list">
          {insights.map((insight, index) => (
            <div key={index} className={`insight-card ${insight.type} ${insight.priority}`}>
              <div className="insight-header">
                <div className="insight-type">
                  {getInsightIcon(insight.type)} {insight.category.replace('_', ' ')}
                </div>
                <span className={`priority-badge ${insight.priority}`}>
                  {insight.priority}
                </span>
              </div>
              
              <div className="insight-message">{insight.message}</div>
              
              {insight.suggestion && (
                <div className="insight-suggestion">
                  <strong>Suggestion:</strong> {insight.suggestion}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="no-insights">No specific insights available.</p>
      )}
    </div>
  );
}

// Checklist Tab
function ChecklistTab({ checklist }) {
  return (
    <div className="checklist-tab">
      <h3>📋 Action Plan</h3>
      {checklist?.length > 0 ? (
        <div className="checklist-sections">
          {checklist.map((section, index) => (
            <div key={index} className={`checklist-section ${section.priority}`}>
              <h4>{section.title}</h4>
              <div className="checklist-items">
                {section.items.map((item, itemIndex) => (
                  <label key={itemIndex} className="checklist-item">
                    <input type="checkbox" disabled />
                    <span className="checkmark"></span>
                    {item}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="no-checklist">No action items needed.</p>
      )}
    </div>
  );
}

// Helper functions
function getInsightIcon(type) {
  const icons = {
    critical: '🚨',
    warning: '⚠️',
    improvement: '💡',
    optimization: '⚡'
  };
  return icons[type] || '💡';
}
