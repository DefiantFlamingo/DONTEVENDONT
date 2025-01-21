import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Enhanced stop words list
const stopWords = new Set(['the', 'a', 'an', 'in', 'to', 'for', 'of', 'and', 'is', 'are', 'on', 'at', 'it', 'as']);

// Simple POS patterns
const posPatterns = {
  noun: /^[A-Z][a-z]+$|.*[^s]s$|.*ing$/,
  verb: /ed$|ing$/,
  adjective: /able$|ible$|al$|ful$|ous$/
};

// Synonym data
const synonymsDB = {
  'good': ['excellent', 'great', 'wonderful', 'fantastic'],
  'bad': ['poor', 'terrible', 'awful', 'horrible'],
  'big': ['large', 'huge', 'enormous', 'gigantic'],
  'small': ['tiny', 'little', 'miniature', 'compact'],
  'interesting': ['fascinating', 'intriguing', 'engaging', 'compelling'],
  'important': ['crucial', 'essential', 'vital', 'significant'],
  'very': ['extremely', 'highly', 'particularly', 'notably']
};

const processText = (text) => {
  const words = text.toLowerCase().match(/\b[a-z']+\b/g) || [];
  
  // Process word frequency
  const frequency = words
    .filter(word => !stopWords.has(word))
    .reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {});

  // Find phrases (2-word combinations)
  const phrases = [];
  for (let i = 0; i < words.length - 1; i++) {
    const phrase = words[i] + ' ' + words[i + 1];
    phrases.push(phrase);
  }
  
  const phraseFrequency = phrases.reduce((acc, phrase) => {
    acc[phrase] = (acc[phrase] || 0) + 1;
    return acc;
  }, {});

  // Identify parts of speech
  const wordCategories = Object.entries(frequency).reduce((acc, [word, count]) => {
    let category = 'other';
    for (const [pos, pattern] of Object.entries(posPatterns)) {
      if (pattern.test(word)) {
        category = pos;
        break;
      }
    }
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push({ word, count });
    return acc;
  }, {});

  return {
    frequency,
    phraseFrequency,
    wordCategories
  };
};

function App() {
  const [text, setText] = useState('');
  const [wordData, setWordData] = useState([]);
  const [phraseData, setPhraseData] = useState([]);
  const [posData, setPosData] = useState({});
  const [sortMethod, setSortMethod] = useState('alphabetical');
  const [fileName, setFileName] = useState('');
  const [redundantWords, setRedundantWords] = useState([]);
  const [suggestions, setSuggestions] = useState({});
  const fileInputRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisView, setAnalysisView] = useState('words');

  const handleTextChange = (e) => {
    setText(e.target.value);
    processInputRealTime(e.target.value);
  };

  const processInputRealTime = (currentText) => {
    const { frequency } = processText(currentText);
    
    // Find redundant words (used more than twice)
    const redundant = Object.entries(frequency)
      .filter(([_, count]) => count > 2)
      .map(([word]) => word);
    
    setRedundantWords(redundant);

    // Generate synonym suggestions
    const newSuggestions = {};
    redundant.forEach(word => {
      if (synonymsDB[word]) {
        newSuggestions[word] = synonymsDB[word];
      }
    });
    setSuggestions(newSuggestions);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        setText(e.target.result);
        processInputRealTime(e.target.result);
      };
      reader.readAsText(file);
    }
  };

  const processInput = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const { frequency, phraseFrequency, wordCategories } = processText(text);
      
      // Process word data
      const wordArray = Object.entries(frequency).map(([word, count]) => ({ word, count }));
      setWordData(wordArray);
      
      // Process phrase data
      const phraseArray = Object.entries(phraseFrequency)
        .filter(([_, count]) => count > 1)
        .map(([phrase, count]) => ({ phrase, count }));
      setPhraseData(phraseArray);
      
      // Process POS data
      setPosData(wordCategories);
      
      setSortMethod('alphabetical');
      setIsProcessing(false);
    }, 500);
  }
  const sortAlphabetically = () => setSortMethod('alphabetical');
  const sortByRank = () => setSortMethod('rank');

  const getSortedData = () => {
    if (analysisView === 'words') {
      return [...wordData].sort((a, b) => {
        if (sortMethod === 'alphabetical') {
          return a.word.localeCompare(b.word);
        }
        return b.count - a.count || a.word.localeCompare(b.word);
      });
    }
    
    if (analysisView === 'phrases') {
      return [...phraseData].sort((a, b) => {
        if (sortMethod === 'alphabetical') {
          return a.phrase.localeCompare(b.phrase);
        }
        return b.count - a.count || a.phrase.localeCompare(b.phrase);
      });
    }
    
    return [];
  };

  const renderAnalysisContent = () => {
    if (analysisView === 'pos') {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          {Object.entries(posData).map(([category, words]) => (
            <div key={category} style={{
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              padding: '15px',
              borderRadius: '10px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{ color: '#2c3e50', marginBottom: '10px', textTransform: 'capitalize' }}>{category}</h3>
              <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                {words.map(({ word, count }) => (
                  <li key={word} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '5px 0'
                  }}>
                    <span>{word}</span>
                    <span style={{
                      backgroundColor: '#3498db',
                      color: 'white',
                      borderRadius: '20px',
                      padding: '2px 8px',
                      fontSize: '0.8rem'
                    }}>{count}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );
    }

    const sortedData = getSortedData();
    return (
      <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
        {sortedData.map((item, index) => (
          <motion.li 
            key={item.word || item.phrase}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.03 }}
            style={{ 
              marginBottom: '10px', 
              padding: '10px 15px', 
              backgroundColor: index % 2 === 0 ? 'rgba(236, 240, 241, 0.6)' : 'rgba(255, 255, 255, 0.6)',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}
          >
            <div>
              <strong style={{ color: '#2c3e50' }}>{item.word || item.phrase}</strong>
              {suggestions[item.word] && (
                <div style={{ fontSize: '0.8rem', color: '#7f8c8d', marginTop: '4px' }}>
                  Try: {suggestions[item.word].join(', ')}
                </div>
              )}
            </div>
            <span style={{ 
              backgroundColor: '#3498db', 
              color: 'white', 
              borderRadius: '20px', 
              padding: '3px 10px', 
              fontSize: '0.8rem' 
            }}>{item.count}</span>
          </motion.li>
        ))}
      </ul>
    );
  };

  return (
    <div style={{
      fontFamily: "'Poppins', sans-serif",
      maxWidth: '900px',
      margin: '0 auto',
      padding: '40px 20px',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      minHeight: '100vh',
      boxSizing: 'border-box'
    }}>
      <motion.h1 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{ 
          color: '#2c3e50', 
          textAlign: 'center', 
          fontSize: '3.5rem', 
          marginBottom: '30px',
          textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        RedunDON'T App Pro
      </motion.h1>
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <textarea
          value={text}
          onChange={handleTextChange}
          placeholder="Enter your text here or upload a document"
          rows="8"
          style={{
            width: '100%',
            padding: '15px',
            marginBottom: '20px',
            borderRadius: '10px',
            border: '1px solid #bdc3c7',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            fontSize: '1rem',
            resize: 'vertical'
          }}
        />
        {redundantWords.length > 0 && (
          <div style={{
            backgroundColor: 'rgba(231, 76, 60, 0.1)',
            padding: '10px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <p style={{ color: '#c0392b', margin: '0 0 5px 0' }}>Redundant words detected:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {redundantWords.map(word => (
                <span key={word} style={{
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.8rem'
                }}>
                  {word}
                  {suggestions[word] && ` (Try: ${suggestions[word][0]})`}
                </span>
              ))}
            </div>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            onChange={handleFileUpload} 
            accept=".txt"
          />
          <div style={{ display: 'flex', gap: '10px' }}>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fileInputRef.current.click()} 
              style={{
                padding: '12px 24px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '30px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease'
              }}
            >
              Upload
            </motion.button>
            {fileName && <span style={{ color: '#34495e', alignSelf: 'center' }}>Uploaded: {fileName}</span>}
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={processInput} 
            disabled={isProcessing}
            style={{
              padding: '12px 24px',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '30px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease'
            }}
          >
            {isProcessing ? 'Processing...' : 'Analyze Text'}
          </motion.button>
        </div>
      </motion.div>
      <AnimatePresence>
        {wordData.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.5 }}
            style={{ marginTop: '30px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={sortAlphabetically} 
                style={{
                  padding: '10px 20px',
                  backgroundColor: sortMethod === 'alphabetical' ? '#2ecc71' : '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease'
                }}
              >
                Alphabetical
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={sortByRank} 
                style={{
                  padding: '10px 20px',
                  backgroundColor: sortMethod === 'rank' ? '#2ecc71' : '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease'
                }}
              >
                Rank
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setAnalysisView('words')} 
                style={{
                  padding: '10px 20px',
                  backgroundColor: analysisView === 'words' ? '#2ecc71' : '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease'
                }}
              >
                Words
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setAnalysisView('phrases')} 
                style={{
                  padding: '10px 20px',
                  backgroundColor: analysisView === 'phrases' ? '#2ecc71' : '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease'
                }}
              >
                Phrases
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setAnalysisView('pos')} 
                style={{
                  padding: '10px 20px',
                  backgroundColor: analysisView === 'pos' ? '#2ecc71' : '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease'
                }}
              >
                Parts of Speech
              </motion.button>
            </div>
            <div style={{ 
              height: '400px', 
              overflowY: 'auto', 
              borderRadius: '10px', 
              padding: '15px',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)'
            }}>
              {renderAnalysisContent()}
            </div>
            <p style={{ color: '#7f8c8d', fontSize: '0.9em', marginTop: '10px', textAlign: 'center' }}>
              {analysisView === 'words' && `Showing ${wordData.length} unique words`}
              {analysisView === 'phrases' && `Showing ${phraseData.length} repeated phrases`}
              {analysisView === 'pos' && 'Showing words by part of speech'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;