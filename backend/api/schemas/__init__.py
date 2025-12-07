"""
Schemas (DTOs) para la API REST
"""
from .common import (
    APIResponse,
    ErrorDetail,
    ErrorResponse,
    HealthStatus,
    PaginatedResponse,
    PaginationMeta,
    PaginationParams,
)
from .interaction import (
    InteractionHistory,
    InteractionRequest,
    InteractionResponse,
    InteractionSummary,
)
from .session import (
    SessionCreate,
    SessionDetailResponse,
    SessionListResponse,
    SessionResponse,
    SessionUpdate,
)
from .activity import (
    ActivityCreate,
    ActivityUpdate,
    ActivityResponse,
    ActivityListResponse,
    ActivityPublishRequest,
    ActivityArchiveRequest,
    PolicyConfig,
)

# Sprint 5-6 schemas
from .sprint5_6 import (
    # Enums
    InterviewType,
    DifficultyLevel,
    IncidentType,
    IncidentSeverity,
    AlertType,
    AlertSeverity,
    AlertScope,
    AlertStatus,
    PlanType,
    PlanStatus,
    ReportType,
    # Interview Session (HU-EST-011)
    InterviewSessionCreate,
    InterviewSessionResponse,
    InterviewQuestion,
    InterviewResponse as InterviewAnswerResponse,
    EvaluationBreakdown,
    # Incident Simulation (HU-EST-012)
    IncidentSimulationCreate,
    IncidentSimulationResponse,
    DiagnosisStep,
    IncidentEvaluation,
    # LTI Integration (HU-SYS-010)
    LTIDeploymentCreate,
    LTIDeploymentResponse,
    LTISessionCreate,
    LTISessionResponse,
    # Course Report (HU-DOC-009)
    CourseReportCreate,
    CourseReportResponse,
    SummaryStats,
    StudentSummary,
    # Remediation Plan (HU-DOC-010)
    RemediationPlanCreate,
    RemediationPlanUpdate,
    RemediationPlanResponse,
    RecommendedAction,
    SuccessMetrics,
    # Risk Alert (HU-DOC-010)
    RiskAlertCreate,
    RiskAlertUpdate,
    RiskAlertResponse,
    # Trace Sequence
    TraceSequenceCreate,
    TraceSequenceResponse,
    # Student Profile
    StudentProfileCreate,
    StudentProfileUpdate,
    StudentProfileResponse,
)

__all__ = [
    # Common
    "APIResponse",
    "ErrorDetail",
    "ErrorResponse",
    "HealthStatus",
    "PaginatedResponse",
    "PaginationMeta",
    "PaginationParams",
    # Session
    "SessionCreate",
    "SessionUpdate",
    "SessionResponse",
    "SessionListResponse",
    "SessionDetailResponse",
    # Interaction
    "InteractionRequest",
    "InteractionResponse",
    "InteractionHistory",
    "InteractionSummary",
    # Activity
    "ActivityCreate",
    "ActivityUpdate",
    "ActivityResponse",
    "ActivityListResponse",
    "ActivityPublishRequest",
    "ActivityArchiveRequest",
    "PolicyConfig",
    # Sprint 5-6 Enums
    "InterviewType",
    "DifficultyLevel",
    "IncidentType",
    "IncidentSeverity",
    "AlertType",
    "AlertSeverity",
    "AlertScope",
    "AlertStatus",
    "PlanType",
    "PlanStatus",
    "ReportType",
    # Interview Session (HU-EST-011)
    "InterviewSessionCreate",
    "InterviewSessionResponse",
    "InterviewQuestion",
    "InterviewAnswerResponse",
    "EvaluationBreakdown",
    # Incident Simulation (HU-EST-012)
    "IncidentSimulationCreate",
    "IncidentSimulationResponse",
    "DiagnosisStep",
    "IncidentEvaluation",
    # LTI Integration (HU-SYS-010)
    "LTIDeploymentCreate",
    "LTIDeploymentResponse",
    "LTISessionCreate",
    "LTISessionResponse",
    # Course Report (HU-DOC-009)
    "CourseReportCreate",
    "CourseReportResponse",
    "SummaryStats",
    "StudentSummary",
    # Remediation Plan (HU-DOC-010)
    "RemediationPlanCreate",
    "RemediationPlanUpdate",
    "RemediationPlanResponse",
    "RecommendedAction",
    "SuccessMetrics",
    # Risk Alert (HU-DOC-010)
    "RiskAlertCreate",
    "RiskAlertUpdate",
    "RiskAlertResponse",
    # Trace Sequence
    "TraceSequenceCreate",
    "TraceSequenceResponse",
    # Student Profile
    "StudentProfileCreate",
    "StudentProfileUpdate",
    "StudentProfileResponse",
]