"""
Router para consultas de trazabilidad N4
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status

from ...database.repositories import TraceRepository, SessionRepository
from ...models.trace import CognitiveTrace
from ..deps import get_trace_repository, get_session_repository
from ..schemas.common import APIResponse, PaginatedResponse, PaginationParams, PaginationMeta
from ..exceptions import SessionNotFoundError
from pydantic import BaseModel, Field
from datetime import datetime

router = APIRouter(prefix="/traces", tags=["Traceability"])


# Schemas específicos para trazas
class TraceResponse(BaseModel):
    """
    Response con información de una traza N4

    Alineado con CognitiveTraceDB en database/models.py
    """

    id: str
    session_id: str
    student_id: str
    activity_id: str
    trace_level: str
    interaction_type: str
    cognitive_state: Optional[str] = None
    cognitive_intent: Optional[str] = None
    content: str
    ai_involvement: Optional[float] = None
    # N4 Cognitive fields
    context: Optional[dict] = None
    metadata: Optional[dict] = None  # Mapped from trace_metadata in ORM
    decision_justification: Optional[str] = None
    alternatives_considered: Optional[List[str]] = None
    strategy_type: Optional[str] = None
    # Relationships
    agent_id: Optional[str] = None
    parent_trace_id: Optional[str] = None
    # Timestamps
    timestamp: datetime
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


@router.get(
    "/{session_id}",
    response_model=PaginatedResponse[TraceResponse],
    summary="Get Session Traces",
    description="Obtiene todas las trazas de una sesión con filtros opcionales",
)
async def get_session_traces(
    session_id: str,
    trace_level: Optional[str] = Query(None, description="Filtrar por nivel: N1, N2, N3, N4"),
    interaction_type: Optional[str] = Query(None, description="Filtrar por tipo de interacción"),
    cognitive_state: Optional[str] = Query(None, description="Filtrar por estado cognitivo"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    session_repo: SessionRepository = Depends(get_session_repository),
    trace_repo: TraceRepository = Depends(get_trace_repository),
) -> PaginatedResponse[TraceResponse]:
    """
    Obtiene todas las trazas de una sesión.

    Permite filtrar por nivel, tipo de interacción y estado cognitivo.

    Args:
        session_id: ID de la sesión
        trace_level: Filtro por nivel (N1, N2, N3, N4)
        interaction_type: Filtro por tipo de interacción
        cognitive_state: Filtro por estado cognitivo
        page: Número de página
        page_size: Elementos por página
        session_repo: Repositorio de sesiones (inyectado)
        trace_repo: Repositorio de trazas (inyectado)

    Returns:
        PaginatedResponse con lista de trazas

    Raises:
        SessionNotFoundError: Si la sesión no existe
    """
    # Verificar que la sesión existe
    db_session = session_repo.get_by_id(session_id)
    if not db_session:
        raise SessionNotFoundError(session_id)

    # Obtener trazas de la sesión
    all_traces = trace_repo.get_by_session(session_id)

    # Aplicar filtros
    filtered_traces = all_traces

    if trace_level:
        filtered_traces = [t for t in filtered_traces if t.trace_level == trace_level]

    if interaction_type:
        filtered_traces = [t for t in filtered_traces if t.interaction_type == interaction_type]

    if cognitive_state:
        filtered_traces = [t for t in filtered_traces if t.cognitive_state == cognitive_state]

    # Calcular paginación
    total_items = len(filtered_traces)
    offset = (page - 1) * page_size
    total_pages = (total_items + page_size - 1) // page_size

    # Aplicar paginación
    paginated_traces = filtered_traces[offset : offset + page_size]

    # Convertir a schemas de respuesta
    traces_data = [
        TraceResponse(
            id=t.id,
            session_id=t.session_id,
            student_id=t.student_id,
            activity_id=t.activity_id,
            trace_level=t.trace_level,
            interaction_type=t.interaction_type,
            cognitive_state=t.cognitive_state,
            cognitive_intent=t.cognitive_intent,
            content=t.content,
            ai_involvement=t.ai_involvement,
            context=t.context,
            metadata=t.trace_metadata,  # Usar trace_metadata del ORM
            decision_justification=t.decision_justification,
            alternatives_considered=t.alternatives_considered,
            strategy_type=t.strategy_type,
            agent_id=t.agent_id,
            parent_trace_id=t.parent_trace_id,
            timestamp=t.created_at,  # Usar created_at en lugar de timestamp
            created_at=t.created_at,
        )
        for t in paginated_traces
    ]

    # Metadatos de paginación
    pagination_meta = PaginationMeta(
        page=page,
        page_size=page_size,
        total_items=total_items,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1,
    )

    return PaginatedResponse(
        success=True,
        data=traces_data,
        pagination=pagination_meta,
    )


@router.get(
    "/{session_id}/cognitive-path",
    summary="Get Cognitive Path (DEPRECATED)",
    description="DEPRECATED: Use GET /cognitive-path/{session_id} instead. This endpoint redirects to the canonical location.",
    deprecated=True,
)
async def get_cognitive_path_deprecated(
    session_id: str,
):
    """
    DEPRECATED: Use GET /api/v1/cognitive-path/{session_id} instead.

    This endpoint is deprecated and will be removed in a future version.
    The canonical endpoint provides more detailed cognitive path reconstruction
    with phases, transitions, and AI dependency evolution.
    """
    from fastapi.responses import RedirectResponse
    return RedirectResponse(
        url=f"/api/v1/cognitive-path/{session_id}",
        status_code=307  # Temporary redirect, preserves method
    )


@router.get(
    "/student/{student_id}",
    response_model=PaginatedResponse[TraceResponse],
    summary="Get Student Traces",
    description="Obtiene todas las trazas de un estudiante a través de todas sus sesiones",
)
async def get_student_traces(
    student_id: str,
    activity_id: Optional[str] = Query(None, description="Filtrar por actividad"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    trace_repo: TraceRepository = Depends(get_trace_repository),
) -> PaginatedResponse[TraceResponse]:
    """
    Obtiene todas las trazas de un estudiante.

    Útil para análisis longitudinal del progreso del estudiante.

    Args:
        student_id: ID del estudiante
        activity_id: Filtro opcional por actividad
        page: Número de página
        page_size: Elementos por página
        trace_repo: Repositorio de trazas (inyectado)

    Returns:
        PaginatedResponse con lista de trazas del estudiante
    """
    # Obtener trazas del estudiante
    all_traces = trace_repo.get_by_student(student_id)

    # Filtrar por actividad si se especifica
    if activity_id:
        all_traces = [t for t in all_traces if t.activity_id == activity_id]

    # Calcular paginación
    total_items = len(all_traces)
    offset = (page - 1) * page_size
    total_pages = (total_items + page_size - 1) // page_size

    # Aplicar paginación
    paginated_traces = all_traces[offset : offset + page_size]

    # Convertir a schemas de respuesta
    traces_data = [
        TraceResponse(
            id=t.id,
            session_id=t.session_id,
            student_id=t.student_id,
            activity_id=t.activity_id,
            trace_level=t.trace_level,
            interaction_type=t.interaction_type,
            cognitive_state=t.cognitive_state,
            cognitive_intent=t.cognitive_intent,
            content=t.content,
            ai_involvement=t.ai_involvement,
            context=t.context,
            metadata=t.trace_metadata,  # Usar trace_metadata del ORM
            decision_justification=t.decision_justification,
            alternatives_considered=t.alternatives_considered,
            strategy_type=t.strategy_type,
            agent_id=t.agent_id,
            parent_trace_id=t.parent_trace_id,
            timestamp=t.created_at,  # Usar created_at en lugar de timestamp
            created_at=t.created_at,
        )
        for t in paginated_traces
    ]

    # Metadatos de paginación
    pagination_meta = PaginationMeta(
        page=page,
        page_size=page_size,
        total_items=total_items,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1,
    )

    return PaginatedResponse(
        success=True,
        data=traces_data,
        pagination=pagination_meta,
    )