// App.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as BookService from './services/BookService';
import './App.css';

const App = () => {
  const [books, setBooks] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState('');
  const [sortBy, setSortBy] = useState('title');
  const [viewMode, setViewMode] = useState('grid');
  
  const titleInputRef = useRef(null);
  const formRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    publishYear: ''
  });

  const fetchBooks = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await BookService.getBooks();
      setBooks(data);
    } catch (err) {
      console.error("Unable to fetch books:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const uniqueAuthors = useMemo(() => {
    const authors = books.map(book => book.author).filter(Boolean);
    return [...new Set(authors)].sort();
  }, [books]);

  const libraryStats = useMemo(() => {
    const totalBooks = books.length;
    const totalAuthors = uniqueAuthors.length;
    const totalPages = books.reduce((sum, book) => sum + (book.pages || 0), 0);
    const avgYear = books.reduce((sum, book) => sum + (book.publishYear || 0), 0) / (books.filter(b => b.publishYear).length || 1);
    
    return { totalBooks, totalAuthors, totalPages, avgYear: Math.round(avgYear) };
  }, [books, uniqueAuthors]);

  const processedBooks = useMemo(() => {
    let filtered = books.filter((book) => {
      const matchesSearch = searchTerm === '' || 
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (book.isbn && book.isbn.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesAuthor = selectedAuthor === '' || book.author === selectedAuthor;
      
      return matchesSearch && matchesAuthor;
    });
    
    filtered.sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'author') return a.author.localeCompare(b.author);
      if (sortBy === 'year') return (b.publishYear || 0) - (a.publishYear || 0);
      return 0;
    });
    
    return filtered;
  }, [books, searchTerm, selectedAuthor, sortBy]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingId) {
        await BookService.updateBook(editingId, formData);
      } else {
        await BookService.createBook(formData);
      }
      resetForm();
      setShowForm(false);
      await fetchBooks();
    } catch (err) {
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (book) => {
    setEditingId(book.id);
    setFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn || '',
      publishYear: book.publishYear || ''
    });
    setShowForm(true);
    
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      titleInputRef.current?.focus();
    }, 100);
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Remove "${title}" from your library?`)) {
      try {
        await BookService.deleteBook(id);
        await fetchBooks();
      } catch (err) {
        alert("Couldn't delete the book. Please try again.");
      }
    }
  };

  const resetForm = () => {
    setFormData({ title: '', author: '', isbn: '', publishYear: '' });
    setEditingId(null);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedAuthor('');
    setSortBy('title');
  };

  const currentYear = new Date().getFullYear();
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  return (
    <div className="app">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="logo">
            <div className="logo-icon">📚</div>
            <span className="logo-text">Vidyakosh</span>
          </div>
          <div className="nav-actions">
            <button 
              className={`nav-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              ⊞
            </button>
            <button 
              className={`nav-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              ≡
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="hero">
        <div className="hero-bg"></div>
        <div className="hero-container">
          <div className="hero-left">
            <div className="hero-badge">✨ Welcome to Vidyakosh</div>
            <h1 className="hero-title">
              {greeting},<br />
              fellow reader.
            </h1>
            <p className="hero-description">
              Curate your personal library, discover new worlds, 
              and keep track of every story that touches your soul.
            </p>
            <button 
              className="hero-cta"
              onClick={() => {
                setShowForm(true);
                resetForm();
                setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
              }}
            >
              <span>+</span> Add Your First Book
            </button>
          </div>
          <div className="hero-right">
            <div className="floating-card card-1">📖</div>
            <div className="floating-card card-2">✨</div>
            <div className="floating-card card-3">🌟</div>
            <div className="stats-preview">
              <div className="stat-preview-item">
                <span className="stat-preview-value">{libraryStats.totalBooks}</span>
                <span className="stat-preview-label">Books</span>
              </div>
              <div className="stat-preview-divider"></div>
              <div className="stat-preview-item">
                <span className="stat-preview-value">{libraryStats.totalAuthors}</span>
                <span className="stat-preview-label">Authors</span>
              </div>
              <div className="stat-preview-divider"></div>
              <div className="stat-preview-item">
                <span className="stat-preview-value">{libraryStats.avgYear || '—'}</span>
                <span className="stat-preview-label">Avg Year</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-emoji">📚</span>
          <div className="stat-details">
            <span className="stat-number">{libraryStats.totalBooks}</span>
            <span className="stat-name">Total Books</span>
          </div>
        </div>
        <div className="stat-item">
          <span className="stat-emoji">✍️</span>
          <div className="stat-details">
            <span className="stat-number">{libraryStats.totalAuthors}</span>
            <span className="stat-name">Authors</span>
          </div>
        </div>
        <div className="stat-item">
          <span className="stat-emoji">📄</span>
          <div className="stat-details">
            <span className="stat-number">{libraryStats.totalPages.toLocaleString()}</span>
            <span className="stat-name">Total Pages</span>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="action-bar">
        <button 
          className={`action-btn primary ${showForm ? 'active' : ''}`}
          onClick={() => {
            setShowForm(!showForm);
            if (!showForm) resetForm();
          }}
        >
          {showForm ? '✕ Cancel' : '+ Add New Book'}
        </button>
        {showForm && editingId && (
          <button className="action-btn secondary" onClick={resetForm}>
            Reset Form
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="form-wrapper" ref={formRef}>
          <div className="form-card">
            <div className="form-header">
              <h2>{editingId ? '📝 Edit Book' : '✨ Add New Book'}</h2>
              <p>{editingId ? 'Update the details below' : 'Share your latest read with the community'}</p>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Book Title <span className="required">*</span></label>
                <input 
                  ref={titleInputRef}
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter the book title"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Author Name <span className="required">*</span></label>
                <input 
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleChange}
                  placeholder="Enter author name"
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>ISBN Number</label>
                  <input 
                    type="text"
                    name="isbn"
                    value={formData.isbn}
                    onChange={handleChange}
                    placeholder="ISBN (optional)"
                  />
                </div>
                
                <div className="form-group">
                  <label>Publication Year</label>
                  <input 
                    type="number"
                    name="publishYear"
                    value={formData.publishYear}
                    onChange={handleChange}
                    placeholder="YYYY"
                    min="1000"
                    max={currentYear}
                  />
                </div>
              </div>
              
              <div className="form-buttons">
                <button type="submit" className="submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : (editingId ? 'Update Book' : 'Add to Library')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search & Filters Section */}
      <div className="search-section">
        <div className="search-container">
          <div className="search-icon">🔍</div>
          <input
            type="text"
            className="search-input"
            placeholder="Search by title, author, or ISBN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="search-clear" onClick={() => setSearchTerm('')}>
              ✕
            </button>
          )}
        </div>
        
        <div className="filters-container">
          {uniqueAuthors.length > 0 && (
            <select 
              value={selectedAuthor} 
              onChange={(e) => setSelectedAuthor(e.target.value)}
              className="filter-select"
            >
              <option value="">All Authors ({uniqueAuthors.length})</option>
              {uniqueAuthors.map(author => (
                <option key={author} value={author}>{author}</option>
              ))}
            </select>
          )}
          
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="title">Sort by Title</option>
            <option value="author">Sort by Author</option>
            <option value="year">Sort by Year (Newest)</option>
          </select>
          
          {(searchTerm || selectedAuthor) && (
            <button className="clear-filters" onClick={clearFilters}>
              Clear All Filters
            </button>
          )}
        </div>
        
        <div className="results-info">
          <span className="results-badge">{processedBooks.length}</span>
          <span className="results-text">
            {processedBooks.length === 1 ? 'book' : 'books'} found
          </span>
          {books.length > 0 && processedBooks.length !== books.length && (
            <span className="results-total">out of {books.length}</span>
          )}
        </div>
      </div>

      {/* Books Display Section */}
      <div className="books-section">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading your library...</p>
          </div>
        ) : processedBooks.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="books-grid">
              {processedBooks.map((book, index) => (
                <div className="book-card" key={book.id} style={{ animationDelay: `${index * 0.05}s` }}>
                  <div className="card-gradient"></div>
                  <div className="card-cover">
                    <div className="cover-emoji">
                      {book.publishYear && book.publishYear < 1900 ? '📜' : '📖'}
                    </div>
                  </div>
                  <div className="card-content">
                    <h3 className="card-title">{book.title}</h3>
                    <p className="card-author">{book.author}</p>
                    <div className="card-meta">
                      {book.isbn && <span className="meta-tag">ISBN: {book.isbn}</span>}
                      {book.publishYear && <span className="meta-tag year">{book.publishYear}</span>}
                    </div>
                    <div className="card-actions">
                      <button onClick={() => handleEdit(book)} className="card-edit">
                        ✏️ Edit
                      </button>
                      <button onClick={() => handleDelete(book.id, book.title)} className="card-delete">
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="books-list">
              {processedBooks.map((book, index) => (
                <div className="list-item" key={book.id} style={{ animationDelay: `${index * 0.03}s` }}>
                  <div className="list-cover">
                    <span className="list-emoji">
                      {book.publishYear && book.publishYear < 1900 ? '📜' : '📖'}
                    </span>
                  </div>
                  <div className="list-info">
                    <h3 className="list-title">{book.title}</h3>
                    <p className="list-author">{book.author}</p>
                    <div className="list-meta">
                      {book.isbn && <span className="list-badge">ISBN: {book.isbn}</span>}
                      {book.publishYear && <span className="list-badge year">{book.publishYear}</span>}
                    </div>
                  </div>
                  <div className="list-actions">
                    <button onClick={() => handleEdit(book)} className="list-edit">
                      ✏️ Edit
                    </button>
                    <button onClick={() => handleDelete(book.id, book.title)} className="list-delete">
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>Your library is empty</h3>
            <p>
              {searchTerm || selectedAuthor 
                ? "No books match your search criteria." 
                : "Start building your collection by adding your first book."}
            </p>
            {!showForm && (
              <button onClick={() => setShowForm(true)} className="empty-btn">
                + Add a Book
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-logo">📚 Vidyakosh</div>
          <p className="footer-text">Vidyakosh - All Rights Reserved</p>
          <p className="footer-year">© {currentYear}</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
