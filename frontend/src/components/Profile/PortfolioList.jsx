import React, { useState } from 'react';
import { FiTrash2, FiExternalLink, FiPlus, FiImage } from 'react-icons/fi';
import toast from 'react-hot-toast';

const PortfolioList = ({ portfolio = [], onAdd, onRemove }) => {
  const [showForm, setShowForm] = useState(false);
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    link: '',
    image: null
  });
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewItem({ ...newItem, image: file });
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleAdd = async () => {
    if (!newItem.title) {
      toast.error('Please enter a title');
      return;
    }
    
    setUploading(true);
    const formData = new FormData();
    formData.append('title', newItem.title);
    formData.append('description', newItem.description);
    formData.append('link', newItem.link);
    if (newItem.image) {
      formData.append('image', newItem.image);
    }
    
    await onAdd(formData);
    setNewItem({ title: '', description: '', link: '', image: null });
    setImagePreview(null);
    setShowForm(false);
    setUploading(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg">Portfolio</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-secondary text-sm flex items-center space-x-1"
        >
          <FiPlus size={14} />
          <span>Add Project</span>
        </button>
      </div>

      {showForm && (
        <div className="mb-4 p-4 border rounded-lg">
          <input
            type="text"
            placeholder="Project Title *"
            value={newItem.title}
            onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
            className="input-field mb-2"
          />
          <textarea
            placeholder="Description"
            rows="2"
            value={newItem.description}
            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
            className="input-field mb-2"
          />
          <input
            type="url"
            placeholder="Live Link (optional)"
            value={newItem.link}
            onChange={(e) => setNewItem({ ...newItem, link: e.target.value })}
            className="input-field mb-2"
          />
          <div className="mb-2">
            <label className="block text-sm font-medium mb-1">
              <FiImage className="inline mr-1" /> Project Image
            </label>
            {imagePreview && (
              <div className="mb-2">
                <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded" />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="input-field"
            />
          </div>
          <div className="flex space-x-2">
            <button onClick={handleAdd} disabled={uploading} className="btn-primary">
              {uploading ? 'Uploading...' : 'Add to Portfolio'}
            </button>
            <button onClick={() => {
              setShowForm(false);
              setImagePreview(null);
              setNewItem({ title: '', description: '', link: '', image: null });
            }} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {portfolio.length === 0 ? (
          <p className="text-gray-500 text-center col-span-2 py-8">No portfolio items yet. Add your first project!</p>
        ) : (
          portfolio.map((item, index) => (
            <div key={index} className="border rounded-lg overflow-hidden hover:shadow-lg transition">
              {item.imageUrl && (
                <div className="w-full h-48 overflow-hidden bg-gray-100">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Image failed to load:', item.imageUrl);
                      e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                    }}
                  />
                </div>
              )}
              <div className="p-3">
                <h4 className="font-semibold text-lg">{item.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                {item.link && (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 text-sm flex items-center space-x-1 mt-2 hover:underline"
                  >
                    <FiExternalLink size={12} />
                    <span>View Project</span>
                  </a>
                )}
                <button
                  onClick={() => onRemove(item._id)}
                  className="text-red-600 text-sm flex items-center space-x-1 mt-2 hover:text-red-800"
                >
                  <FiTrash2 size={12} />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PortfolioList;