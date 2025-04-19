import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import mammoth from 'mammoth';
import { CCC_StrictMode } from "../ccc_modules/ccc_strict_mode";
import { CCC_BanList } from "../ccc_modules/ccc_banlist";
import { CCC_TopOffenders } from "../ccc_modules/top_offenders";

const stopWords = new Set(['the', 'a', 'an', 'in', 'to', 'for', 'of', 'and', 'is', 'are', 'on', 'at', 'it', 'as']);

const synonymsDB = {
  'good': ['excellent', 'great', 'wonderful', 'fantastic'],
  'bad': ['poor', 'terrible', 'awful', 'horrible'],
  'big': ['large', 'huge', 'enormous', 'gigantic'],
  'small': ['tiny', 'little', 'miniature', 'compact']
};

const clean = (str) =>
  str
    .toLowerCase()
    .replace(/[\u2018\u2019\u201C\u201D‘’“”"”’,:;.!?—–\-…()]/g, '') // remove punctuation
    .replace(/\s+/g, ' ')
    .trim();

const posPatterns = {
  noun: /^[a-z]+(?:s|tion|ment|ness|ity|hood)$/, // basic noun endings
  verb: /^(?:\w+ed|\w+ing|\w+s)$/,               // ends in ed, ing, or s
  adjective: /(?:ous|ful|able|ible|ic|al|ive|less)$/,
  adverb: /(?:ly|ward|wise|fast|soon|now|always|never|very|too|so|often|quickly)$/
};

const processText = (text) => {
  const words = text
    .toLowerCase()
    .match(/\b[a-z']{2,}\b/g) || []; // basic cleanup

  const frequency = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {});

  const phrases = [];
  for (let i = 0; i < words.length - 1; i++) {
    phrases.push(words[i] + ' ' + words[i + 1]);
  }

  const phraseFrequency = phrases.reduce((acc, phrase) => {
    acc[phrase] = (acc[phrase] || 0) + 1;
    return acc;
  }, {});

  const posPatterns = {
    noun: /(?:tion|ment|ness|ity|ship|ance|ence|er|or|ist|ism|hood|dom|s)$/,
    verb: /(?:ed|ing|en|ify|ise|ize)$/,
    adjective: /(?:ous|ful|ish|ive|able|ible|al|ic|ical)$/,
    adverb: /(?:ly|ward|wise|wards|fast|hard|soon|now|then|already|always|often|never|sometimes)$/
  };

  const wordCategories = words.reduce((acc, word) => {
    let category = 'other';
    for (const [pos, pattern] of Object.entries(posPatterns)) {
      if (pattern.test(word)) {
        category = pos;
        break;
      }
    }
    if (!acc[category]) acc[category] = [];
    acc[category].push(word);
    return acc;
  }, {});

  const categorizedCounts = {};
  for (const [category, list] of Object.entries(wordCategories)) {
    categorizedCounts[category] = [];
    const seen = new Set();
    list.forEach(word => {
      if (!seen.has(word)) {
        seen.add(word);
        categorizedCounts[category].push({ word, count: frequency[word] });
      }
    });
  }

  return {
    frequency,
    phraseFrequency,
    wordCategories: categorizedCounts
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
  const [cccFlags, setCccFlags] = useState([]);
  const [offenders, setOffenders] = useState([]);
  const [tab, setTab] = useState('words');
  const [isProcessing, setIsProcessing] = useState(false);
  const [posOpenStates, setPosOpenStates] = useState({});
  const fileInputRef = useRef(null);
  const debounceTimeout = useRef(null);

  const handleTextChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      processInputRealTime(newText);
    }, 300);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    try {
      let text;
      if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
      } else {
        text = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target.result);
          reader.readAsText(file);
        });
      }
      setText(text);
      processInputRealTime(text);
    } catch (err) {
      console.error('Here for it:', err);
      alert('Feed me redundancies!');
    }
  };

  const processInputRealTime = (inputText) => {
    const { frequency, phraseFrequency, wordCategories } = processText(inputText);
  
    setWordData(Object.entries(frequency).map(([word, count]) => ({ word, count })));
    setPhraseData(
      Object.entries(phraseFrequency)
        .filter(([_, count]) => count > 1)
        .map(([phrase, count]) => ({ phrase, count }))
    );
    const filteredCategories = Object.entries(wordCategories)
  .filter(([_, words]) => words.length > 0)
  .reduce((acc, [category, words]) => {
    acc[category] = words;
    return acc;
  }, {});
setPosData(filteredCategories);
  
    const redundant = Object.entries(frequency)
      .filter(([_, count]) => count > 2)
      .map(([word]) => word);
    setRedundantWords(redundant);
  
    const suggestionsMap = {};
    redundant.forEach(word => {
      if (synonymsDB[word]) {
        suggestionsMap[word] = synonymsDB[word];
      }
    });
    setSuggestions(suggestionsMap);

    const strictFlags = CCC_StrictMode.enableStrictMode(inputText, frequency);
    setCccFlags([...strictFlags, ...CCC_BanList(inputText)]);
  
    const topOffenders = CCC_TopOffenders.getTopOffenders(inputText);
    setOffenders(topOffenders);
  };

  const processInput = () => {
    setIsProcessing(true);
    setTimeout(() => {
      processInputRealTime(text);
      setIsProcessing(false);
    }, 500);
  };

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ textAlign: 'center', fontSize: '3rem', marginBottom: '30px' }}>
        RedunDON<span style={{ color: '#e74c3c' }}>🗡️</span>T Pro
      </h1>

      <textarea
        value={text}
        onChange={handleTextChange}
        placeholder="Paste your text or upload a document"
        rows="8"
        style={{
          width: '100%',
          padding: '20px',
          fontSize: '1.1rem',
          borderRadius: '12px',
          border: '1px solid #444',
          backgroundColor: '#1e1e1e',
          color: '#f5f5f5',
          boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.3)',
          outline: 'none',
          transition: '0.3s ease',
        }}
        onFocus={(e) => {
          e.target.style.boxShadow = '0 0 10px #00bfff, inset 0 2px 6px rgba(0, 0, 0, 0.3)';
          e.target.style.borderColor = '#00bfff';
        }}
        onBlur={(e) => {
          e.target.style.boxShadow = 'inset 0 2px 6px rgba(0, 0, 0, 0.3)';
          e.target.style.borderColor = '#444';
        }}
      />

      <div style={{ textAlign: 'center', margin: '20px 0' }}>
        <label htmlFor="file-upload" style={{
          display: 'inline-block',
          padding: '10px 22px',
          backgroundColor: '#9b59b6',
          color: '#fff',
          borderRadius: '30px',
          cursor: 'pointer',
          fontWeight: '600',
          fontSize: '0.95rem',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 10px rgba(155, 89, 182, 0.4)',
        }}>
          📄 Upload Document
        </label>
        <input
          id="file-upload"
          type="file"
          accept=".txt,.docx"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          ref={fileInputRef}
        />
        {fileName && (
          <div style={{ marginTop: '10px', color: '#aaa', fontSize: '0.9rem' }}>
            📎 {fileName}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '25px' }}>
        {[
          { key: 'words', label: 'Words', color: '#e74c3c' },
          { key: 'phrases', label: 'Phrases', color: '#8e44ad' },
          { key: 'offenders', label: 'Top Offenders', color: '#d35400' },
          { key: 'flags', label: 'Red Pen Flags', color: '#c0392b' },
          { key: 'pos', label: 'Parts of Speech', color: '#27ae60' },
        ].map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: '10px 22px',
              backgroundColor: tab === key ? color : '#333',
              color: tab === key ? '#fff' : '#ccc',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: 600,
              transition: 'all 0.25s ease',
              boxShadow: tab === key ? `0 4px 10px ${color}55` : 'none',
              textShadow: tab === key ? '1px 1px 2px #000' : 'none'
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Sort Buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '30px', flexWrap: 'wrap' }}>
        {[
          { key: 'alphabetical', label: 'Sort A–Z', color: '#2980b9' },
          { key: 'rank', label: 'Sort by Rank', color: '#16a085' }
        ].map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => setSortMethod(key)}
            style={{
              padding: '10px 22px',
              backgroundColor: sortMethod === key ? color : '#444',
              color: sortMethod === key ? '#fff' : '#ccc',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '600',
              transition: 'all 0.25s ease',
              boxShadow: sortMethod === key ? `0 4px 10px ${color}55` : 'none',
              textShadow: sortMethod === key ? '1px 1px 2px #000' : 'none'
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Results Container */}
      <div style={{
        backgroundColor: '#fdfdfd',
        padding: '25px',
        borderRadius: '14px',
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.08)',
        minHeight: '350px',
        marginBottom: '40px',
        border: '1px solid #e1e4e8'
      }}>
        {tab === 'words' && (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {[...wordData].sort((a, b) => {
              if (sortMethod === 'alphabetical') return a.word.localeCompare(b.word);
              return b.count - a.count || a.word.localeCompare(b.word);
            }).map(({ word, count }) => (
              <li key={word} style={{ marginBottom: '10px' }}>
                <strong>{word}</strong> — {count}
                {suggestions[word] && (
                  <div style={{
                    fontSize: '0.85rem',
                    backgroundColor: '#fff8e1',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    marginTop: '6px',
                    color: '#6c4c00',
                    boxShadow: 'inset 0 0 4px rgba(0,0,0,0.05)'
                  }}>
                    ✏️ Try: {suggestions[word].join(', ')}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

{tab === 'phrases' && (
  <ul style={{ listStyle: 'none', padding: 0 }}>
    {[...phraseData].sort((a, b) => {
      if (sortMethod === 'alphabetical') return a.phrase.localeCompare(b.phrase);
      return b.count - a.count || a.phrase.localeCompare(b.phrase);
    }).map(({ phrase, count }) => (
      <li key={phrase} style={{ marginBottom: '10px' }}>
        <strong>{phrase}</strong> — {count}
      </li>
    ))}
  </ul>
)}

{tab === 'offenders' && (
  <ul style={{ listStyle: 'none', padding: 0 }}>
    {offenders.length === 0 ? (
      <li style={{ color: '#aaa', fontStyle: 'italic' }}>No top offenders detected.</li>
    ) : (
      offenders.map((entry, i) => {
        const [word, count] = typeof entry === 'string' ? entry.split(' — ') : [entry.word, entry.count];
        return (
          <li key={i} style={{ marginBottom: '10px' }}>
            <strong>{word}</strong> — {count}
          </li>
        );
      })
    )}
  </ul>
)}

        {tab === 'flags' && (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {cccFlags.length === 0 ? (
              <li style={{ color: '#aaa', fontStyle: 'italic' }}>No red flags found.</li>
            ) : (
              cccFlags.map((flag, i) => (
                <li key={i} style={{ marginBottom: '10px' }}>
                  {typeof flag === 'string' ? (
                    flag
                  ) : (
                    <>
                      <strong>{flag.word}</strong> — {flag.count} <br />
                      <em>{flag.message}</em>
                    </>
                  )}
                </li>
              ))
            )}
          </ul>
        )}

{tab === 'pos' && (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
    {Object.entries(posData).map(([category, words]) => (
      <div
        key={category}
        style={{
          padding: '10px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          backgroundColor: '#fafafa'
        }}
      >
        <h3
          onClick={() =>
            setPosOpenStates(prev => ({
              ...prev,
              [category]: !prev[category]
            }))
          }
          style={{
            cursor: 'pointer',
            color: '#2c3e50',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px'
          }}
        >
          {category.charAt(0).toUpperCase() + category.slice(1)}
          <span>{posOpenStates[category] ? '▲' : '▼'}</span>
        </h3>
        {posOpenStates[category] && (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {[...words]
              .sort((a, b) => {
                if (sortMethod === 'alphabetical') return a.word.localeCompare(b.word);
                return b.count - a.count || a.word.localeCompare(b.word);
              })
              .map(({ word, count }) => (
                <li key={word} style={{ marginBottom: '6px' }}>
                  <strong>{word}</strong> — {count}
                </li>
              ))}
          </ul>
        )}
      </div>
    ))}
  </div>
)}
      </div>
    </div>
  );
}

export default App;