import React, { useState, useEffect, use } from 'react';
import { Search, Home, Star, Menu, Mic, MoreVertical, Plus, Edit, Maximize, Heart, LogOut, Trash } from 'lucide-react';
import { Card, Button, Modal, Form } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";


const NotesApp = ({setIsAuthenticated}) => {
  const navigate = useNavigate()
  const [notes, setNotes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [newNote, setNewNote] = useState({ title: '', content: '', type: 'text', image: null });
  const [recognition, setRecognition] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeView, setActiveView] = useState('home'); // 'home' or 'favorites'
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false); // Track if we're editing a note
  const[showSidebar,setShowSidebar] = useState(false)
  // Fetch notes from the backend when the component mounts
  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const response = await axios.get('https://notetaker-backend-data.onrender.com/notes');
      setNotes(response.data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const handleShowModal = () => setShowModal(true);
  const handleCloseModal = () => {
    setShowModal(false);
    setTranscribedText('');
    setNewNote({ title: '', content: '', type: 'text', image: null });
    setIsEditing(false); // Reset editing state
    if (recognition) recognition.stop();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewNote({ ...newNote, [name]: value });
  };

  const handleSaveNote = async () => {
    try {
      const noteData = {
        title: newNote.title,
        content: newNote.content || transcribedText,
        timestamp: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
        type: newNote.type,
        duration: newNote.type === 'audio' ? '00:01' : undefined, // Use undefined instead of null
        favorite: false, // Default value
        image: newNote.image || undefined, // Use undefined instead of null
      };
  
      if (isEditing) {
        // Update existing note
        await axios.put(`https://notetaker-backend-data.onrender.com/notes/${newNote._id}`, noteData);
      } else {
        // Create new note
        await axios.post('https://notetaker-backend-data.onrender.com/notes', noteData);
      }
  
      fetchNotes(); // Refresh the notes list
      handleCloseModal();
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = false;
    recognitionInstance.lang = 'en-US';

    recognitionInstance.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setTranscribedText(transcript);
    };

    recognitionInstance.onend = () => {
      setIsRecording(false);
    };

    recognitionInstance.start();
    setIsRecording(true);
    setRecognition(recognitionInstance);
  };

  const stopRecording = () => {
    if (recognition) recognition.stop();
    setIsRecording(false);
  };

  const handleNoteClick = (note) => {
    setSelectedNote(note);
  };

  const handleCloseNoteModal = () => {
    setSelectedNote(null);
    setIsFullscreen(false);
  };

  const handleFavorite = async (id) => {
    try {
      const noteToUpdate = notes.find(note => note._id === id);
      const updatedNote = { ...noteToUpdate, favorite: !noteToUpdate.favorite };
      await axios.put(`https://notetaker-backend-data.onrender.com/notes/${id}`, updatedNote);
      fetchNotes(); // Refresh the notes list
    } catch (error) {
      console.error('Error updating favorite status:', error);
    }
  };

  const handleEditNote = async (updatedNote) => {
    try {
      await axios.put(`https://notetaker-backend-data.onrender.com/notes/${updatedNote._id}`, updatedNote);
      fetchNotes(); // Refresh the notes list
      setSelectedNote(updatedNote);
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  

  const handleImageUpload = (e, note) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const updatedNote = { ...note, image: reader.result };
        handleEditNote(updatedNote);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value.toLowerCase());
  };

  const handleLogout = async () => {
    try {
      // Send logout request to backend
      await axios.post('https://notetaker-backend-authenication.onrender.com/logout', {}, { withCredentials: true });
  
      // Clear any local storage or session storage if used
      localStorage.removeItem("token");  
      sessionStorage.removeItem("token");
  
      // Redirect user to login page
      navigate('/login');
      setIsAuthenticated(false)
      console.log('Logged out successfully');
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };


  

  const handleUpdateNote = (note) => {
    setNewNote(note); // Pre-fill the form with the note's data
    setIsEditing(true); // Set editing state to true
    handleShowModal(); // Open the modal
  };

  const handleDeleteNote = async (id) => {
    try {
      await axios.delete(`https://notetaker-backend-data.onrender.com/notes/${id}`);
      fetchNotes(); // Refresh the notes list
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };



  const filteredNotes = (Array.isArray(notes) ? notes : []).filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery) ||
                         note.content.toLowerCase().includes(searchQuery);
    const matchesView = activeView === 'home' || (activeView === 'favorites' && note.favorite);
    return matchesSearch && matchesView;
  });


  return (
    <div className="d-flex vh-100">
    {/* Sidebar */}
    <div className="border-end bg-white p-3 d-none d-md-block" style={{ minWidth: '200px', maxWidth: '200px' }}>
      <div className="d-flex align-items-center mb-4">
        <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>AI</div>
        <span className="ms-2 fw-bold">AI Notes</span>
      </div>
  
      {/* Navigation */}
      <nav>
        <button 
          className={`btn w-100 mb-2 text-start ${activeView === 'home' ? 'btn-primary' : 'btn-light'}`}
          onClick={() => setActiveView('home')}
        >
          <Home size={20} className="me-2" /> Home
        </button>
        <button 
          className={`btn w-100 text-start ${activeView === 'favorites' ? 'btn-primary' : 'btn-light'}`}
          onClick={() => setActiveView('favorites')}
        >
          <Star size={20} className="me-2" /> Favourites
        </button>
      </nav>
    </div>
  
    {/* Main Content */}
    <div className="flex-grow-1 p-3 p-md-4">
      {/* Mobile Sidebar Toggle */}
      <button className="btn btn-light d-md-none mb-3" onClick={() => setShowSidebar(!showSidebar)}>
        <Menu size={20} />
      </button>
  
      {/* Search Bar and Logout */}
      <div className="d-flex flex-column flex-md-row align-items-center mb-3">
        <div className="input-group mb-2 mb-md-0">
          <span className="input-group-text"><Search size={20} /></span>
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search" 
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
        <button className="btn btn-danger ms-md-2" onClick={handleLogout}>
          <LogOut size={20} />
        </button>
      </div>
  
      {/* View Title */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>{activeView === 'home' ? 'All Notes' : 'Favorite Notes'}</h4>
        <Button onClick={handleShowModal}>
          <Plus size={20} className="me-2" /> Add Note
        </Button>
      </div>
  
      {/* Notes Grid */}
      <div className="row g-3" style={{ height: '80vh', overflow: 'scroll' }}>
        {filteredNotes.map((note) => (
          <div key={note._id} className="col-12 col-md-6 col-lg-4">
            <Card className="p-3 shadow-sm" style={{ minHeight: '200px', maxHeight: '200px', overflow: 'scroll' }}>
              <div className="d-flex justify-content-between align-items-start">
                <div className="flex-grow-1" onClick={() => handleNoteClick(note)} style={{ cursor: 'pointer' }}>
                  <h5 className="mb-2">{note.title}</h5>
                  <p className="text-muted small mb-3">{note.content}</p>
                </div>
                <div className="d-flex">
                  <Button 
                    variant="light" 
                    className="me-2" 
                    onClick={() => handleFavorite(note._id)}
                  >
                    <Heart size={20} fill={note.favorite ? 'red' : 'none'} />
                  </Button>
                  <Button 
                    variant="light" 
                    className="me-2" 
                    onClick={() => handleUpdateNote(note)}
                  >
                    <Edit size={20} />
                  </Button>
                  <Button 
                    variant="light" 
                    onClick={() => handleDeleteNote(note._id)}
                  >
                    <Trash size={20} />
                  </Button>
                </div>
              </div>
              <div className="d-flex justify-content-between text-muted small">
                <span>{note.timestamp}</span>
                {note.type === 'audio' ? (
                  <div className="d-flex align-items-center">
                    <Mic size={14} className="me-1" />
                    <span>{note.duration}</span>
                  </div>
                ) : (
                  <span className="badge bg-secondary">Text</span>
                )}
              </div>
            </Card>
          </div>
        ))}
      </div>
  
      {filteredNotes.length === 0 && (
        <div className="text-center text-muted mt-5">
          <h5>No notes found</h5>
          {searchQuery ? (
            <p>Try adjusting your search query</p>
          ) : activeView === 'favorites' ? (
            <p>You haven't added any favorites yet</p>
          ) : (
            <p>Click the "Add Note" button to create your first note</p>
          )}
        </div>
      )}
    </div>
  
    {/* Mobile Sidebar */}
    {showSidebar && (
      <div className="position-fixed top-0 start-0 vh-100 bg-white p-3" style={{ width: '200px', zIndex: 1000 }}>
        <div className="d-flex align-items-center mb-4">
          <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>AI</div>
          <span className="ms-2 fw-bold">AI Notes</span>
        </div>
        <nav>
          <button 
            className={`btn w-100 mb-2 text-start ${activeView === 'home' ? 'btn-primary' : 'btn-light'}`}
            onClick={() => { setActiveView('home'); setShowSidebar(false); }}
          >
            <Home size={20} className="me-2" /> Home
          </button>
          <button 
            className={`btn w-100 text-start ${activeView === 'favorites' ? 'btn-primary' : 'btn-light'}`}
            onClick={() => { setActiveView('favorites'); setShowSidebar(false); }}
          >
            <Star size={20} className="me-2" /> Favourites
          </button>
        </nav>
      </div>
    )}
  
    {/* Modal for Note Creation/Editing */}
    <Modal show={showModal} onHide={handleCloseModal} fullscreen={window.innerWidth < 768}>
      <Modal.Header closeButton>
        <Modal.Title>{isEditing ? 'Edit Note' : 'Create New Note'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Title</Form.Label>
            <Form.Control
              type="text"
              name="title"
              value={newNote.title}
              onChange={handleInputChange}
              placeholder="Enter title"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Content</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="content"
              value={newNote.content || transcribedText}
              onChange={handleInputChange}
              placeholder="Enter content"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Note Type</Form.Label>
            <Form.Select
              name="type"
              value={newNote.type}
              onChange={handleInputChange}
            >
              <option value="text">Text</option>
              <option value="audio">Audio</option>
            </Form.Select>
          </Form.Group>
          {newNote.type === 'audio' && (
            <div className="mb-3">
              <Button
                variant={isRecording ? 'danger' : 'primary'}
                onClick={isRecording ? stopRecording : startRecording}
              >
                <Mic size={16} className="me-2" />
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </Button>
            </div>
          )}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleCloseModal}>
          Close
        </Button>
        <Button variant="primary" onClick={handleSaveNote}>
          {isEditing ? 'Update Note' : 'Save Note'}
        </Button>
      </Modal.Footer>
    </Modal>
  
    {/* Modal for Note Details */}
    <Modal show={!!selectedNote} onHide={handleCloseNoteModal} fullscreen={window.innerWidth < 768 || isFullscreen}>
      <Modal.Header closeButton>
        <Modal.Title>{selectedNote?.title}</Modal.Title>
        <div>
          <Button variant="light" onClick={() => setIsFullscreen(!isFullscreen)} className="me-2">
            <Maximize size={20} />
          </Button>
          <Button variant="light" onClick={() => handleFavorite(selectedNote._id)}>
            <Heart size={20} fill={selectedNote?.favorite ? 'red' : 'none'} />
          </Button>
        </div>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Title</Form.Label>
            <Form.Control
              type="text"
              name="title"
              value={selectedNote?.title || ''}
              onChange={(e) => handleEditNote({ ...selectedNote, title: e.target.value })}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Content</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="content"
              value={selectedNote?.content || ''}
              onChange={(e) => handleEditNote({ ...selectedNote, content: e.target.value })}
            />
          </Form.Group>
          {selectedNote?.type === 'audio' && (
            <div className="mb-3">
              <p><strong>Transcript:</strong> {selectedNote.content}</p>
            </div>
          )}
          <Form.Group className="mb-3">
            <Form.Label>Upload Image</Form.Label>
            <Form.Control
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, selectedNote)}
            />
            {selectedNote?.image && (
              <img src={selectedNote.image} alt="Note" className="img-fluid mt-2" />
            )}
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleCloseNoteModal}>
          Close
        </Button>
        <Button variant="primary" onClick={handleCloseNoteModal}>
          Save Changes
        </Button>
      </Modal.Footer>
    </Modal>
  </div>
  );
};

export default NotesApp;
