import React, { useState } from 'react';
import { FiX, FiPlus } from 'react-icons/fi';

const SkillsInput = ({ skills = [], onSkillsChange }) => {
  const [inputValue, setInputValue] = useState('');

  const addSkill = () => {
    if (inputValue.trim() && !skills.includes(inputValue.trim())) {
      onSkillsChange([...skills, inputValue.trim()]);
      setInputValue('');
    }
  };

  const removeSkill = (skillToRemove) => {
    onSkillsChange(skills.filter(skill => skill !== skillToRemove));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {skills.map((skill, index) => (
          <span
            key={index}
            className="inline-flex items-center space-x-1 px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm"
          >
            <span>{skill}</span>
            <button
              type="button"
              onClick={() => removeSkill(skill)}
              className="hover:text-indigo-600"
            >
              <FiX size={14} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex space-x-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Add a skill (e.g., React, Python)"
          className="input-field flex-1"
        />
        <button
          type="button"
          onClick={addSkill}
          className="btn-secondary px-3"
        >
          <FiPlus />
        </button>
      </div>
    </div>
  );
};

export default SkillsInput;