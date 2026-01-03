from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, HttpUrl
from enum import Enum


class ProjectStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    HIBERNATION = "hibernation"
    ARCHIVED = "archived"


class ProjectPriority(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class DeploymentStatus(str, Enum):
    NOT_DEPLOYED = "not_deployed"
    IN_DEVELOPMENT = "in_development"
    STAGING = "staging"
    PRODUCTION = "production"
    DEPRECATED = "deprecated"


class TimeUnit(str, Enum):
    HOURS = "hours"
    DAYS = "days"
    WEEKS = "weeks"


class EstimatedTime(BaseModel):
    value: Optional[float] = None
    unit: TimeUnit = TimeUnit.HOURS


class Blocker(BaseModel):
    description: str
    priority: ProjectPriority = ProjectPriority.MEDIUM
    status: str = "active"  # active | resolved
    createdAt: datetime = Field(default_factory=datetime.utcnow)


class SuccessCriterion(BaseModel):
    text: str
    completed: bool = False
    order: int = 0


class QuickLink(BaseModel):
    label: str
    url: str
    icon: str = "🔗"


class Note(BaseModel):
    id: str = Field(default_factory=lambda: str(datetime.utcnow().timestamp()))
    title: str
    content: str = ""
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)


class ProjectIcon(BaseModel):
    type: str = "emoji"  # emoji | upload | initials | default
    value: str = "📁"


class GitHubSyncSettings(BaseModel):
    autoFetchInterval: str = "hourly"  # never | 5min | 15min | hourly | 6hours | daily
    issueLabels: List[str] = []
    trackMilestones: bool = True


class GitHubData(BaseModel):
    stars: int = 0
    forks: int = 0
    openIssues: int = 0
    watchers: int = 0
    lastUpdated: Optional[datetime] = None
    lastFetched: Optional[datetime] = None
    fetched: bool = False
    issues: List[Any] = []
    commits: List[Any] = []
    readme: str = ""


class Project(BaseModel):
    id: Optional[str] = None
    projectId: Optional[str] = None  # Custom unique ID for linking

    # Required fields
    name: str
    priority: ProjectPriority = ProjectPriority.MEDIUM

    # Auto-set fields
    status: ProjectStatus = ProjectStatus.ACTIVE
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    # Basic Information
    description: str = ""
    colorCode: str = "#3B82F6"
    projectType: List[str] = ["personal"]

    # Timeline & Tracking
    startDate: Optional[datetime] = None
    targetDate: Optional[datetime] = None
    completionDate: Optional[datetime] = None
    estimatedTime: EstimatedTime = Field(default_factory=EstimatedTime)
    completionPercentage: float = 0.0
    autoCalculateProgress: bool = False

    # Technical Details
    githubRepoUrl: str = ""
    repositoryUrl: str = ""  # Backward compatibility
    githubToken: str = ""  # GitHub Personal Access Token for Projects V2 access
    defaultBranch: str = "main"
    currentBranch: str = ""
    techStack: List[str] = []
    deploymentStatus: DeploymentStatus = DeploymentStatus.NOT_DEPLOYED

    # Organization & Relationships
    tags: List[str] = []
    parentProjectId: Optional[str] = None
    relatedProjectIds: List[str] = []
    relatedCourseIds: List[str] = []
    isPinned: bool = False

    # Documentation & Notes
    readme: str = ""
    technicalNotes: str = ""
    notes: List[Note] = []
    blockers: List[Blocker] = []
    motivation: str = ""
    learningGoals: str = ""
    successCriteria: List[SuccessCriterion] = []

    # Links & Resources
    quickLinks: List[QuickLink] = []
    designFileLinks: List[str] = []
    externalIssueTracker: str = ""

    # GitHub Integration Settings
    githubSync: GitHubSyncSettings = Field(default_factory=GitHubSyncSettings)
    githubData: GitHubData = Field(default_factory=GitHubData)

    # Advanced Options
    projectIcon: ProjectIcon = Field(default_factory=ProjectIcon)
    environmentNotes: str = ""
    setupCommands: str = ""

    # Session tracking (for backup/cross-checking)
    sessions: List[str] = []  # Array of session IDs

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Time Tracker App",
                "description": "A full-stack time tracking application",
                "priority": "high",
                "status": "active",
                "colorCode": "#3B82F6",
                "projectType": ["personal", "learning"],
                "githubRepoUrl": "https://github.com/user/time-tracker",
                "techStack": ["react", "fastapi", "mongodb"],
                "tags": ["fullstack", "productivity"],
                "completionPercentage": 75.0,
                "isPinned": True
            }
        }


class ProjectCreate(BaseModel):
    """Schema for creating a new project"""
    name: str
    priority: ProjectPriority = ProjectPriority.MEDIUM
    description: str = ""
    colorCode: str = "#3B82F6"
    projectType: List[str] = ["personal"]
    status: ProjectStatus = ProjectStatus.ACTIVE
    startDate: Optional[datetime] = None
    targetDate: Optional[datetime] = None
    completionDate: Optional[datetime] = None
    estimatedTime: EstimatedTime = Field(default_factory=EstimatedTime)
    githubRepoUrl: str = ""
    githubToken: str = ""
    defaultBranch: str = "main"
    currentBranch: str = ""
    techStack: List[str] = []
    deploymentStatus: DeploymentStatus = DeploymentStatus.NOT_DEPLOYED
    tags: List[str] = []
    parentProjectId: Optional[str] = None
    relatedProjectIds: List[str] = []
    relatedCourseIds: List[str] = []
    isPinned: bool = False
    readme: str = ""
    technicalNotes: str = ""
    notes: List[Note] = []
    blockers: List[Blocker] = []
    motivation: str = ""
    learningGoals: str = ""
    successCriteria: List[SuccessCriterion] = []
    quickLinks: List[QuickLink] = []
    designFileLinks: List[str] = []
    externalIssueTracker: str = ""
    githubSync: GitHubSyncSettings = Field(default_factory=GitHubSyncSettings)
    projectIcon: ProjectIcon = Field(default_factory=ProjectIcon)
    environmentNotes: str = ""
    setupCommands: str = ""


class ProjectUpdate(BaseModel):
    """Schema for updating an existing project"""
    name: Optional[str] = None
    priority: Optional[ProjectPriority] = None
    description: Optional[str] = None
    colorCode: Optional[str] = None
    projectType: Optional[List[str]] = None
    status: Optional[ProjectStatus] = None
    startDate: Optional[datetime] = None
    targetDate: Optional[datetime] = None
    completionDate: Optional[datetime] = None
    estimatedTime: Optional[EstimatedTime] = None
    completionPercentage: Optional[float] = None
    autoCalculateProgress: Optional[bool] = None
    githubRepoUrl: Optional[str] = None
    githubToken: Optional[str] = None
    defaultBranch: Optional[str] = None
    currentBranch: Optional[str] = None
    techStack: Optional[List[str]] = None
    deploymentStatus: Optional[DeploymentStatus] = None
    tags: Optional[List[str]] = None
    parentProjectId: Optional[str] = None
    relatedProjectIds: Optional[List[str]] = None
    relatedCourseIds: Optional[List[str]] = None
    isPinned: Optional[bool] = None
    readme: Optional[str] = None
    technicalNotes: Optional[str] = None
    notes: Optional[List[Note]] = None
    blockers: Optional[List[Blocker]] = None
    motivation: Optional[str] = None
    learningGoals: Optional[str] = None
    successCriteria: Optional[List[SuccessCriterion]] = None
    quickLinks: Optional[List[QuickLink]] = None
    designFileLinks: Optional[List[str]] = None
    externalIssueTracker: Optional[str] = None
    githubSync: Optional[GitHubSyncSettings] = None
    projectIcon: Optional[ProjectIcon] = None
    environmentNotes: Optional[str] = None
    setupCommands: Optional[str] = None
