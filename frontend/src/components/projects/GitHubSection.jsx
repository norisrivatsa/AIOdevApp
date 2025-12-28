import { useState } from 'react';
import { Star, GitFork, Eye, AlertCircle, GitCommit, ExternalLink, Calendar } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

const GitHubSection = ({ githubData, repoUrl }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!githubData || !githubData.fetched) {
    return (
      <Card>
        <Card.Header>
          <h3 className="text-lg font-semibold">GitHub Integration</h3>
        </Card.Header>
        <Card.Body>
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No GitHub data synced yet. Click the "Sync" button to fetch data from your repository.
            </p>
          </div>
        </Card.Body>
      </Card>
    );
  }

  const { stars, forks, watchers, openIssues, commits = [], issues = [], lastFetched, hasProjects } = githubData;

  // Group issues by status for Kanban
  const todoIssues = issues.filter(i => i.status === 'todo');
  const inProgressIssues = issues.filter(i => i.status === 'in_progress');
  const doneIssues = issues.filter(i => i.status === 'done');

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <Card.Header>
        <div className="flex items-center justify-between w-full">
          <h3 className="text-lg font-semibold text-white">GitHub Repository</h3>
          {lastFetched && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Last synced: {formatDateTime(lastFetched)}
            </span>
          )}
        </div>
      </Card.Header>
      <Card.Body>
        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2 px-1 font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('kanban')}
            className={`pb-2 px-1 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'kanban'
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Issues Kanban
            {hasProjects && (
              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                Live
              </span>
            )}
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 mb-2">
                  <Star size={20} />
                  <span className="text-sm font-medium">Stars</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stars}</p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 mb-2">
                  <GitFork size={20} />
                  <span className="text-sm font-medium">Forks</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{forks}</p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                  <Eye size={20} />
                  <span className="text-sm font-medium">Watchers</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{watchers}</p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
                  <AlertCircle size={20} />
                  <span className="text-sm font-medium">Open Issues</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{openIssues}</p>
              </div>
            </div>

            {/* Recent Commits */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <GitCommit size={16} />
                Recent Commits
              </h4>
              <div className="space-y-2">
                {commits.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No commits found</p>
                ) : (
                  commits.map((commit) => (
                    <a
                      key={commit.sha}
                      href={commit.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block bg-gray-50 dark:bg-gray-800 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 dark:text-white font-medium line-clamp-1">
                            {commit.message.split('\n')[0]}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {commit.author}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {formatDate(commit.date)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded font-mono">
                            {commit.sha}
                          </code>
                          <ExternalLink size={14} className="text-gray-400" />
                        </div>
                      </div>
                    </a>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Kanban Tab */}
        {activeTab === 'kanban' && (
          <div className="space-y-4">
            {/* Info Banner */}
            {hasProjects ? (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <p className="text-sm text-green-800 dark:text-green-300">
                  <strong>Live sync enabled:</strong> Issues are organized exactly as they appear in your GitHub Projects board.
                </p>
              </div>
            ) : (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  <strong>Auto-organized:</strong> Issues are categorized based on their state and labels.
                  Create a GitHub Projects board to see live organization.
                </p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
            {/* To Do Column */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 h-fit">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900 dark:text-white">To Do</h4>
                <Badge variant="danger">{todoIssues.length}</Badge>
              </div>
              <div className="space-y-3">
                {todoIssues.map((issue) => (
                  <a
                    key={issue.number}
                    href={issue.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-white dark:bg-gray-900 rounded-lg p-3 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">#{issue.number}</span>
                      <ExternalLink size={12} className="text-gray-400 flex-shrink-0" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-2">
                      {issue.title}
                    </p>
                    {issue.labels.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {issue.labels.slice(0, 3).map((label) => (
                          <span
                            key={label}
                            className="text-xs px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    )}
                  </a>
                ))}
                {todoIssues.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    No issues
                  </p>
                )}
              </div>
            </div>

            {/* In Progress Column */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 h-fit">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900 dark:text-white">In Progress</h4>
                <Badge variant="primary">{inProgressIssues.length}</Badge>
              </div>
              <div className="space-y-3">
                {inProgressIssues.map((issue) => (
                  <a
                    key={issue.number}
                    href={issue.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-white dark:bg-gray-900 rounded-lg p-3 hover:shadow-md transition-shadow border-l-4 border-primary-500"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">#{issue.number}</span>
                      <ExternalLink size={12} className="text-gray-400 flex-shrink-0" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-2">
                      {issue.title}
                    </p>
                    {issue.labels.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {issue.labels.slice(0, 3).map((label) => (
                          <span
                            key={label}
                            className="text-xs px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    )}
                  </a>
                ))}
                {inProgressIssues.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    No issues
                  </p>
                )}
              </div>
            </div>

            {/* Done Column */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 h-fit">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900 dark:text-white">Done</h4>
                <Badge variant="success">{doneIssues.length}</Badge>
              </div>
              <div className="space-y-3">
                {doneIssues.map((issue) => (
                  <a
                    key={issue.number}
                    href={issue.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-white dark:bg-gray-900 rounded-lg p-3 hover:shadow-md transition-shadow opacity-75"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">#{issue.number}</span>
                      <ExternalLink size={12} className="text-gray-400 flex-shrink-0" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-2 line-through">
                      {issue.title}
                    </p>
                    {issue.labels.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {issue.labels.slice(0, 3).map((label) => (
                          <span
                            key={label}
                            className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    )}
                  </a>
                ))}
                {doneIssues.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    No issues
                  </p>
                )}
              </div>
            </div>
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default GitHubSection;
