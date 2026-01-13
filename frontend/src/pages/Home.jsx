import { useState, useEffect } from "react";
import { analyzeResume } from "../services/api";
import ResultDashboard from "../components/ResultDashboard";

export default function Home() {
  const [resume, setResume] = useState(null);
  const [jd, setJd] = useState("");
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Apply gradient background to body
    document.body.style.background = 'linear-gradient(135deg, rgb(102, 126, 234) 0%, rgb(118, 75, 162) 100%)';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.minHeight = '100vh';

    // Cleanup function to reset body styles when component unmounts
    return () => {
      document.body.style.background = '';
      document.body.style.margin = '';
      document.body.style.padding = '';
      document.body.style.minHeight = '';
    };
  }, []);

  const handleSubmit = async () => {
    if (!resume || !jd) {
      alert("Resume and Job Description are required");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append("resume", resume);
    formData.append("jobDescription", jd);

    try {
      const { data } = await analyzeResume(formData);
      setResult(data.analysis);
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert("Error analyzing resume. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const containerStyle = {
    minHeight: '100vh',
    padding: '20px',
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
  };

  const cardStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '20px',
    padding: '40px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
    backdropFilter: 'blur(10px)'
  };

  const titleStyle = {
    textAlign: 'center',
    color: '#2d3748',
    fontSize: '2.5rem',
    fontWeight: '700',
    marginBottom: '10px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  };

  const subtitleStyle = {
    textAlign: 'center',
    color: '#718096',
    fontSize: '1.1rem',
    marginBottom: '40px'
  };

  const sectionStyle = {
    marginBottom: '30px',
    padding: '25px',
    background: '#f7fafc',
    borderRadius: '15px',
    border: '1px solid #e2e8f0'
  };

  const labelStyle = {
    display: 'block',
    color: '#2d3748',
    fontSize: '1.1rem',
    fontWeight: '600',
    marginBottom: '12px'
  };

  const fileInputStyle = {
    width: '100%',
    padding: '12px',
    border: '2px dashed #cbd5e0',
    borderRadius: '10px',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textAlign: 'center'
  };

  const textareaStyle = {
    width: '100%',
    padding: '15px',
    border: '2px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '14px',
    lineHeight: '1.5',
    resize: 'vertical',
    fontFamily: 'inherit',
    transition: 'border-color 0.3s ease',
    backgroundColor: '#ffffff'
  };

  const buttonStyle = {
    display: 'block',
    margin: '40px auto',
    background: isLoading ? '#a0aec0' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '15px 40px',
    fontSize: '1.1rem',
    fontWeight: '600',
    borderRadius: '50px',
    cursor: isLoading ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: isLoading ? 'none' : '0 10px 20px rgba(102, 126, 234, 0.3)'
  };

  const resultStyle = {
    marginTop: '40px',
    padding: '30px',
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    borderRadius: '15px',
    color: 'white'
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>ATS Resume Intelligence Tool</h1>
        <p style={subtitleStyle}>
          Get intelligent insights about your resume's ATS compatibility and optimization suggestions
        </p>
        
        <div style={sectionStyle}>
          <label style={labelStyle}>📄 Upload Your Resume</label>
          <div style={fileInputStyle}>
            <input 
              type="file" 
              onChange={(e) => setResume(e.target.files[0])}
              accept=".pdf,.doc,.docx"
              style={{ width: '100%', border: 'none', background: 'none', outline: 'none' }}
            />
            {resume && (
              <p style={{ margin: '10px 0 0 0', color: '#48bb78', fontSize: '14px' }}>
                ✓ {resume.name} selected
              </p>
            )}
          </div>
        </div>

        <div style={sectionStyle}>
          <label style={labelStyle}>💼 Job Description</label>
          <textarea
            rows={12}
            style={textareaStyle}
            placeholder="Paste the job description here..."
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            onFocus={(e) => e.target.style.borderColor = '#667eea'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          />
          {jd && (
            <p style={{ margin: '10px 0 0 0', color: '#48bb78', fontSize: '14px' }}>
              ✓ {jd.split(' ').length} words entered
            </p>
          )}
        </div>

        <button 
          onClick={handleSubmit} 
          style={buttonStyle}
          disabled={isLoading || !resume || !jd}
          onMouseOver={(e) => {
            if (!isLoading && resume && jd) {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 15px 25px rgba(102, 126, 234, 0.4)';
            }
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = isLoading ? 'none' : '0 10px 20px rgba(102, 126, 234, 0.3)';
          }}
        >
          {isLoading ? '🔄 Analyzing...' : '🚀 Analyze Resume'}
        </button>

        {result && (
          <div style={resultStyle}>
            <ResultDashboard result={result} />
          </div>
        )}
      </div>
    </div>
  );
}
