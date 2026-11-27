import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ProfileImageUpload = ({ currentImage, onImageUpload, size = 'large' }) => {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(currentImage);

  useEffect(() => {
    // Update when currentImage changes from props
    setImageUrl(currentImage);
  }, [currentImage]);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    // Show preview immediately
    const previewUrl = URL.createObjectURL(file);
    setImageUrl(previewUrl);
    
    const formData = new FormData();
    formData.append('image', file);
    
    setUploading(true);
    
    try {
      const result = await onImageUpload(formData);
      if (result && result.profilePicture) {
        setImageUrl(result.profilePicture);
      }
    } catch (error) {
      setImageUrl(currentImage);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  }, [onImageUpload, currentImage]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 1,
    multiple: false
  });

  const sizeClass = size === 'large' ? 'w-32 h-32' : 'w-24 h-24';

  return (
    <div className="flex flex-col items-center">
      <div
        {...getRootProps()}
        className={`relative ${sizeClass} rounded-full overflow-hidden cursor-pointer group bg-gray-100`}
      >
        <input {...getInputProps()} />
        {imageUrl && imageUrl !== 'https://via.placeholder.com/150' ? (
          <img
            src={imageUrl}
            alt="Profile"
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error('Image failed to load:', imageUrl);
              e.target.src = 'https://via.placeholder.com/150';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FiUser size={size === 'large' ? 48 : 32} className="text-gray-400" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
          {uploading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          ) : (
            <FiUpload className="text-white" size={24} />
          )}
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-2">Click to change photo</p>
    </div>
  );
};

export default ProfileImageUpload;