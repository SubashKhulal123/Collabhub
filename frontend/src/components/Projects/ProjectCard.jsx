import React from 'react';
import { Link } from 'react-router-dom';
import { FiCalendar, FiDollarSign, FiUser } from 'react-icons/fi';

const ProjectCard = ({ project }) => {
  const statusStyles = {
    open: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    in_progress: 'bg-amber-50 text-amber-700 border border-amber-200',
    completed: 'bg-gray-50 text-gray-600 border border-gray-200'
  };

  return (
    <Link to={`/projects/${project._id}`} className="block group">
      <div className="card-hover">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors">
          {project.title}
        </h3>
        <p className="text-gray-500 text-sm mb-4 line-clamp-2">
          {project.description}
        </p>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-1.5">
            <FiDollarSign size={14} className="text-emerald-500" />
            <span className="font-medium text-gray-700">${project.budget}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FiCalendar size={14} />
            <span>{new Date(project.deadline).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FiUser size={14} />
            <span>{project.client?.name?.split(' ')[0]}</span>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className={`px-2.5 py-1 text-xs rounded-lg font-medium ${statusStyles[project.status] || statusStyles.completed}`}>
            {project.status === 'in_progress' ? 'In Progress' : project.status?.charAt(0).toUpperCase() + project.status?.slice(1)}
          </span>
          <span className="px-2.5 py-1 text-xs bg-indigo-50 text-indigo-600 rounded-lg font-medium">
            {project.category}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ProjectCard;