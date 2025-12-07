"""
Router para gestión de riesgos y evaluaciones
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel, Field
from datetime import datetime

from ...database.repositories import (
    RiskRepository,
    EvaluationRepository,
    SessionRepository,
)
from ...models.risk import Risk, RiskLevel, RiskDimension
from ...models.evaluation import EvaluationReport
from ..deps import (
    get_risk_repository,
    get_evaluation_repository,
    get_session_repository,
)
from ..schemas.common import APIResponse, PaginatedResponse, PaginationMeta
from ..exceptions import SessionNotFoundError

router = APIRouter(prefix="/risks", tags=["Risks & Evaluation"])


# Schemas para risks
class RiskResponse(BaseModel):
    """Response con información de un riesgo"""

    id: str
    session_id: str  # REQUIRED - Un riesgo siempre tiene sesión asociada
    student_id: str
    activity_id: str
    risk_type: str
    risk_level: str
    dimension: str
    description: str
    evidence: List[str]
    trace_ids: List[str]
    recommendations: List[str]
    resolved: bool
    resolution_notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class RiskStatistics(BaseModel):
    """Estadísticas de riesgos"""

    total_risks: int
    by_level: dict
    by_dimension: dict
    by_type: dict
    resolution_rate: float  # Porcentaje de riesgos resueltos


# Schemas para evaluaciones
class DimensionEvaluation(BaseModel):
    """Evaluación de una dimensión específica"""
    dimension: str
    score: float
    level: str  # 'novice', 'advanced_beginner', 'competent', 'proficient', 'expert'
    evidence: List[str] = []
    feedback: str = ""


class ReasoningAnalysisResponse(BaseModel):
    """Análisis del razonamiento del estudiante"""
    phases_identified: List[str] = []
    phase_transitions: List[str] = []
    reasoning_quality: str = ""
    conceptual_errors: List[dict] = []
    metacognitive_evidence: List[str] = []
    problem_solving_strategy: str = ""
    completeness_score: float = 0.0


class GitAnalysisResponse(BaseModel):
    """Análisis de código Git"""
    commits_analyzed: int = 0
    code_evolution_quality: str = ""
    consistency_score: float = 0.0
    patterns_detected: List[str] = []
    ai_generated_code_percentage: float = 0.0
    copy_paste_detected: bool = False


class EvaluationResponse(BaseModel):
    """Response con información de una evaluación"""

    id: str
    session_id: str
    student_id: str
    activity_id: str
    overall_competency_level: str
    overall_score: float
    dimensions: List[DimensionEvaluation] = []  # List of dimension evaluations
    key_strengths: List[str] = []
    improvement_areas: List[str] = []
    reasoning_analysis: Optional[ReasoningAnalysisResponse] = None  # JSON object, not string
    git_analysis: Optional[GitAnalysisResponse] = None  # JSON object, not string
    ai_dependency_score: float = 0.0  # Score de dependencia de IA (0-1)
    ai_dependency_metrics: dict = {}  # Métricas detalladas de dependencia de IA
    created_at: datetime

    class Config:
        from_attributes = True


@router.get(
    "/session/{session_id}",
    response_model=APIResponse[List[RiskResponse]],
    summary="Get Session Risks",
    description="Obtiene todos los riesgos detectados en una sesión",
)
async def get_session_risks(
    session_id: str,
    resolved: Optional[bool] = Query(None, description="Filtrar por estado de resolución"),
    dimension: Optional[str] = Query(None, description="Filtrar por dimensión de riesgo"),
    session_repo: SessionRepository = Depends(get_session_repository),
    risk_repo: RiskRepository = Depends(get_risk_repository),
) -> APIResponse[List[RiskResponse]]:
    """
    Obtiene riesgos de una sesión con filtros opcionales.

    Args:
        session_id: ID de la sesión
        resolved: Filtrar por riesgos resueltos/no resueltos
        dimension: Filtrar por dimensión (COGNITIVE, ETHICAL, etc.)
        session_repo: Repositorio de sesiones (inyectado)
        risk_repo: Repositorio de riesgos (inyectado)

    Returns:
        APIResponse con lista de riesgos

    Raises:
        SessionNotFoundError: Si la sesión no existe
    """
    # Verificar que la sesión existe
    db_session = session_repo.get_by_id(session_id)
    if not db_session:
        raise SessionNotFoundError(session_id)

    # Obtener riesgos
    risks = risk_repo.get_by_session(session_id)

    # Aplicar filtros
    if resolved is not None:
        risks = [r for r in risks if r.resolved == resolved]

    if dimension:
        risks = [r for r in risks if r.dimension == dimension]

    # Convertir a schemas de respuesta
    risks_data = [
        RiskResponse(
            id=r.id,
            session_id=r.session_id,
            student_id=r.student_id,
            activity_id=r.activity_id,
            risk_type=r.risk_type,
            risk_level=r.risk_level,
            dimension=r.dimension,
            description=r.description,
            evidence=r.evidence or [],
            trace_ids=r.trace_ids or [],
            recommendations=r.recommendations or [],
            resolved=r.resolved,
            resolution_notes=r.resolution_notes,
            created_at=r.created_at,
        )
        for r in risks
    ]

    return APIResponse(
        success=True,
        data=risks_data,
        message=f"Retrieved {len(risks_data)} risks for session {session_id}",
    )


@router.get(
    "/student/{student_id}",
    response_model=APIResponse[List[RiskResponse]],
    summary="Get Student Risks",
    description="Obtiene todos los riesgos de un estudiante a través de todas sus sesiones",
)
async def get_student_risks(
    student_id: str,
    resolved: Optional[bool] = Query(None),
    dimension: Optional[str] = Query(None),
    risk_repo: RiskRepository = Depends(get_risk_repository),
) -> APIResponse[List[RiskResponse]]:
    """
    Obtiene riesgos de un estudiante.

    Útil para análisis de perfil de riesgo del estudiante.

    Args:
        student_id: ID del estudiante
        resolved: Filtrar por estado de resolución
        dimension: Filtrar por dimensión
        risk_repo: Repositorio de riesgos (inyectado)

    Returns:
        APIResponse con lista de riesgos del estudiante
    """
    # Obtener riesgos del estudiante
    risks = risk_repo.get_by_student(student_id)

    # Aplicar filtros
    if resolved is not None:
        risks = [r for r in risks if r.resolved == resolved]

    if dimension:
        risks = [r for r in risks if r.dimension == dimension]

    # Convertir a schemas de respuesta
    risks_data = [
        RiskResponse(
            id=r.id,
            session_id=r.session_id,
            student_id=r.student_id,
            activity_id=r.activity_id,
            risk_type=r.risk_type,
            risk_level=r.risk_level,
            dimension=r.dimension,
            description=r.description,
            evidence=r.evidence or [],
            trace_ids=r.trace_ids or [],
            recommendations=r.recommendations or [],
            resolved=r.resolved,
            resolution_notes=r.resolution_notes,
            created_at=r.created_at,
        )
        for r in risks
    ]

    return APIResponse(
        success=True,
        data=risks_data,
        message=f"Retrieved {len(risks_data)} risks for student {student_id}",
    )


@router.get(
    "/student/{student_id}/statistics",
    response_model=APIResponse[RiskStatistics],
    summary="Get Student Risk Statistics",
    description="Obtiene estadísticas de riesgos de un estudiante",
)
async def get_student_risk_statistics(
    student_id: str,
    risk_repo: RiskRepository = Depends(get_risk_repository),
) -> APIResponse[RiskStatistics]:
    """
    Calcula estadísticas de riesgos del estudiante.

    Args:
        student_id: ID del estudiante
        risk_repo: Repositorio de riesgos (inyectado)

    Returns:
        APIResponse con estadísticas de riesgos
    """
    # Obtener todos los riesgos del estudiante
    all_risks = risk_repo.get_by_student(student_id)

    # Calcular estadísticas por nivel
    by_level = {}
    for risk in all_risks:
        level = risk.risk_level
        by_level[level] = by_level.get(level, 0) + 1

    # Calcular estadísticas por dimensión
    by_dimension = {}
    for risk in all_risks:
        dim = risk.dimension
        by_dimension[dim] = by_dimension.get(dim, 0) + 1

    # Calcular estadísticas por tipo
    by_type = {}
    for risk in all_risks:
        rtype = risk.risk_type
        by_type[rtype] = by_type.get(rtype, 0) + 1

    # Calcular tasa de resolución
    resolved_count = sum(1 for r in all_risks if r.resolved)
    resolution_rate = (resolved_count / len(all_risks) * 100) if all_risks else 0

    # Construir estadísticas
    statistics = RiskStatistics(
        total_risks=len(all_risks),
        by_level=by_level,
        by_dimension=by_dimension,
        by_type=by_type,
        resolution_rate=round(resolution_rate, 2),
    )

    return APIResponse(
        success=True,
        data=statistics,
        message=f"Calculated risk statistics for student {student_id}",
    )


@router.get(
    "/critical",
    response_model=APIResponse[List[RiskResponse]],
    summary="Get Critical Risks",
    description="Obtiene todos los riesgos críticos no resueltos del sistema",
)
async def get_critical_risks(
    student_id: Optional[str] = Query(None, description="Filtrar por estudiante"),
    risk_repo: RiskRepository = Depends(get_risk_repository),
) -> APIResponse[List[RiskResponse]]:
    """
    Obtiene riesgos críticos no resueltos.

    Útil para dashboard de instructores y gobernanza.

    Args:
        student_id: Filtro opcional por estudiante
        risk_repo: Repositorio de riesgos (inyectado)

    Returns:
        APIResponse con lista de riesgos críticos
    """
    # Obtener riesgos críticos (DB stores lowercase)
    if student_id:
        all_risks = risk_repo.get_by_student(student_id)
        critical_risks = [
            r for r in all_risks
            if r.risk_level == "critical" and not r.resolved
        ]
    else:
        critical_risks = risk_repo.get_critical_risks()

    # Convertir a schemas de respuesta
    risks_data = [
        RiskResponse(
            id=r.id,
            session_id=r.session_id,
            student_id=r.student_id,
            activity_id=r.activity_id,
            risk_type=r.risk_type,
            risk_level=r.risk_level,
            dimension=r.dimension,
            description=r.description,
            evidence=r.evidence or [],
            trace_ids=r.trace_ids or [],
            recommendations=r.recommendations or [],
            resolved=r.resolved,
            resolution_notes=r.resolution_notes,
            created_at=r.created_at,
        )
        for r in critical_risks
    ]

    return APIResponse(
        success=True,
        data=risks_data,
        message=f"Retrieved {len(risks_data)} critical risks",
    )


# =============================================================================
# Endpoints de Evaluaciones
# =============================================================================


@router.get(
    "/evaluation/session/{session_id}",
    response_model=APIResponse[EvaluationResponse],
    summary="Get Session Evaluation",
    description="Obtiene el reporte de evaluación de una sesión",
)
async def get_session_evaluation(
    session_id: str,
    session_repo: SessionRepository = Depends(get_session_repository),
    eval_repo: EvaluationRepository = Depends(get_evaluation_repository),
) -> APIResponse[EvaluationResponse]:
    """
    Obtiene la evaluación de proceso de una sesión.

    La evaluación es generada por E-IA-Proc al finalizar la sesión.

    Args:
        session_id: ID de la sesión
        session_repo: Repositorio de sesiones (inyectado)
        eval_repo: Repositorio de evaluaciones (inyectado)

    Returns:
        APIResponse con el reporte de evaluación

    Raises:
        SessionNotFoundError: Si la sesión no existe
        HTTPException(404): Si no hay evaluación para la sesión
    """
    # Verificar que la sesión existe
    db_session = session_repo.get_by_id(session_id)
    if not db_session:
        raise SessionNotFoundError(session_id)

    # Obtener evaluación
    evaluations = eval_repo.get_by_session(session_id)

    if not evaluations:
        raise HTTPException(
            status_code=404,
            detail=f"No evaluation found for session {session_id}. Session may not be completed yet.",
        )

    # Tomar la evaluación más reciente
    latest_eval = evaluations[-1]

    # Convertir dimensions de JSON a lista de DimensionEvaluation
    dimensions_list = []
    if latest_eval.dimensions:
        for dim in latest_eval.dimensions:
            if isinstance(dim, dict):
                dimensions_list.append(DimensionEvaluation(**dim))

    # Convertir reasoning_analysis de JSON a ReasoningAnalysisResponse
    reasoning = None
    if latest_eval.reasoning_analysis and isinstance(latest_eval.reasoning_analysis, dict):
        reasoning = ReasoningAnalysisResponse(**latest_eval.reasoning_analysis)

    # Convertir git_analysis de JSON a GitAnalysisResponse
    git_analysis = None
    if latest_eval.git_analysis and isinstance(latest_eval.git_analysis, dict):
        git_analysis = GitAnalysisResponse(**latest_eval.git_analysis)

    # Convertir a schema de respuesta
    eval_data = EvaluationResponse(
        id=latest_eval.id,
        session_id=latest_eval.session_id,
        student_id=latest_eval.student_id,
        activity_id=latest_eval.activity_id,
        overall_competency_level=latest_eval.overall_competency_level,
        overall_score=latest_eval.overall_score,
        dimensions=dimensions_list,
        key_strengths=latest_eval.key_strengths or [],
        improvement_areas=latest_eval.improvement_areas or [],
        reasoning_analysis=reasoning,
        git_analysis=git_analysis,
        ai_dependency_score=latest_eval.ai_dependency_score or 0.0,
        ai_dependency_metrics=latest_eval.ai_dependency_metrics or {},
        created_at=latest_eval.created_at,
    )

    return APIResponse(
        success=True,
        data=eval_data,
        message=f"Retrieved evaluation for session {session_id}",
    )


@router.get(
    "/evaluation/student/{student_id}",
    response_model=APIResponse[List[EvaluationResponse]],
    summary="Get Student Evaluations",
    description="Obtiene todas las evaluaciones de un estudiante",
)
async def get_student_evaluations(
    student_id: str,
    eval_repo: EvaluationRepository = Depends(get_evaluation_repository),
) -> APIResponse[List[EvaluationResponse]]:
    """
    Obtiene todas las evaluaciones de un estudiante.

    Útil para análisis de progreso y evolución del estudiante.

    Args:
        student_id: ID del estudiante
        eval_repo: Repositorio de evaluaciones (inyectado)

    Returns:
        APIResponse con lista de evaluaciones
    """
    # Obtener evaluaciones del estudiante
    evaluations = eval_repo.get_by_student(student_id)

    # Convertir a schemas de respuesta
    evals_data = []
    for e in evaluations:
        # Convertir dimensions
        dimensions_list = []
        if e.dimensions:
            for dim in e.dimensions:
                if isinstance(dim, dict):
                    dimensions_list.append(DimensionEvaluation(**dim))

        # Convertir reasoning_analysis
        reasoning = None
        if e.reasoning_analysis and isinstance(e.reasoning_analysis, dict):
            reasoning = ReasoningAnalysisResponse(**e.reasoning_analysis)

        # Convertir git_analysis
        git_analysis = None
        if e.git_analysis and isinstance(e.git_analysis, dict):
            git_analysis = GitAnalysisResponse(**e.git_analysis)

        evals_data.append(EvaluationResponse(
            id=e.id,
            session_id=e.session_id,
            student_id=e.student_id,
            activity_id=e.activity_id,
            overall_competency_level=e.overall_competency_level,
            overall_score=e.overall_score,
            dimensions=dimensions_list,
            key_strengths=e.key_strengths or [],
            improvement_areas=e.improvement_areas or [],
            reasoning_analysis=reasoning,
            git_analysis=git_analysis,
            ai_dependency_score=e.ai_dependency_score or 0.0,
            ai_dependency_metrics=e.ai_dependency_metrics or {},
            created_at=e.created_at,
        ))

    return APIResponse(
        success=True,
        data=evals_data,
        message=f"Retrieved {len(evals_data)} evaluations for student {student_id}",
    )