import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as BookService from './services/BookService';
import './App.css';

const App = () => {
  const [books, setBooks] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const titleInputRef = useRef(null);

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
      console.error("Vidyakosh: Sync Error", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const processedBooks = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return books
      .filter((book) => 
        book.title.toLowerCase().includes(searchLower) ||
        book.author.toLowerCase().includes(searchLower) ||
        book.isbn?.toLowerCase().includes(searchLower)
      )
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [books, searchTerm]);

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
      await fetchBooks();
    } catch (err) {
      alert("System Error: Could not save the record.");
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      titleInputRef.current?.focus();
    }, 100);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to remove this volume?")) {
      try {
        await BookService.deleteBook(id);
        await fetchBooks();
      } catch (err) {
        alert("Delete failed.");
      }
    }
  };

  const resetForm = () => {
    setFormData({ title: '', author: '', isbn: '', publishYear: '' });
    setEditingId(null);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>✍️ Vidyakosh ✍️</h1>
      </header>

      {/* --- FORM SECTION --- */}
      <section className="form-section">
        <h2 className="section-title">
          {editingId ? '✍️ Update Record' : '➕ Add New Entry'}
        </h2>
        
        <form onSubmit={handleSubmit} className="entry-form">
          <div className="input-grid">
            <input 
              ref={titleInputRef}
              type="text"
              name="title" 
              value={formData.title} 
              onChange={handleChange} 
              placeholder="Book Title" 
              required 
            />
            <input 
              type="text"
              name="author" 
              value={formData.author} 
              onChange={handleChange} 
              placeholder="Author Name" 
              required 
            />
            <input 
              type="text"
              name="isbn" 
              value={formData.isbn} 
              onChange={handleChange} 
              placeholder="ISBN Number" 
            />
            <input 
              type="number"
              name="publishYear" 
              value={formData.publishYear} 
              onChange={handleChange} 
              placeholder="Publication Year" 
            />
          </div>
          
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingId ? 'Update Record' : 'Add to Collection'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="btn-secondary">
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </section>

      {/* --- SEARCH BAR SECTION --- */}
      <div className="search-container">
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search archives by title, author, or ISBN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              ×
            </button>
          )}
        </div>
        <p className="results-count">
          Indexing <strong>{processedBooks.length}</strong> of {books.length} volumes
        </p>
      </div>

      {/* --- DISPLAY SECTION --- */}
      <section className="table-section">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Accessing Archives...</p>
          </div>
        ) : processedBooks.length > 0 ? (
          <div className="table-responsive">
            <table className="book-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>ISBN</th>
                  <th>Year</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {processedBooks.map((book) => (
                  <tr key={book.id}>
                    <td className="book-title">{book.title}</td>
                    <td className="book-author">{book.author}</td>
                    <td className="isbn-text">{book.isbn || '—'}</td>
                    <td className="year-badge">{book.publishYear || '—'}</td>
                    <td className="actions-cell">
                      <button onClick={() => handleEdit(book)} className="btn-edit">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(book.id)} className="btn-delete">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>📭 No matching records found.</p>
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="btn-link">
                View all books
              </button>
            )}
          </div>
        )}
      </section>

      <footer className="app-footer">
        <p>© {new Date().getFullYear()} Vidyakosh - All Rights Reserved</p>
      </footer>
    </div>
  );
};

export default App;
