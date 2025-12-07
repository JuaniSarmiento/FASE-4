"""
Repository pattern for database operations

Provides:
- SessionRepository: Manage learning sessions
- TraceRepository: Manage cognitive traces
- RiskRepository: Manage risks
- EvaluationRepository: Manage evaluations
- UserRepository: Manage user authentication and authorization
"""
from datetime import datetime
from typing import List, Optional, Any, Type, Dict
from uuid import uuid4
from enum import Enum

from sqlalchemy.orm import Session, selectinload, joinedload
from sqlalchemy import desc, select

from .models import (
    SessionDB,
    CognitiveTraceDB,
    RiskDB,
    EvaluationDB,
    TraceSequenceDB,
    StudentProfileDB,
    ActivityDB,
    UserDB,
    # Sprint 5 models
    GitTraceDB,
    CourseReportDB,
    RemediationPlanDB,
    RiskAlertDB,
    # Sprint 6 models
    InterviewSessionDB,
    IncidentSimulationDB,
    LTIDeploymentDB,
    LTISessionDB,
)
from ..models.trace import CognitiveTrace, TraceSequence, CognitiveState, TraceLevel, InteractionType
from ..models.risk import Risk, RiskReport, RiskType, RiskLevel
from ..models.evaluation import EvaluationReport, CompetencyLevel
import logging

logger = logging.getLogger(__name__)


def _safe_cognitive_state_to_str(cognitive_state: Optional[CognitiveState]) -> Optional[str]:
    """
    Convierte CognitiveState a string de forma segura, validando el tipo.

    Args:
        cognitive_state: Estado cognitivo (puede ser CognitiveState enum, str, o None)

    Returns:
        String con el valor del enum, o None

    Raises:
        ValueError: Si cognitive_state no es None, str, ni CognitiveState válido
    """
    if cognitive_state is None:
        return None

    # Si ya es un string, validar que sea un valor válido del enum
    if isinstance(cognitive_state, str):
        # Intentar convertir a enum para validar
        try:
            CognitiveState(cognitive_state)
            return cognitive_state
        except ValueError:
            logger.warning(
                f"Invalid cognitive_state string: '{cognitive_state}'. "
                f"Expected one of: {[s.value for s in CognitiveState]}"
            )
            raise ValueError(
                f"Invalid cognitive_state: '{cognitive_state}'. "
                f"Must be one of: {[s.value for s in CognitiveState]}"
            )

    # Si es un enum CognitiveState, extraer su valor
    if isinstance(cognitive_state, CognitiveState):
        return cognitive_state.value

    # Tipo no válido
    logger.error(
        f"cognitive_state must be CognitiveState enum or str, got {type(cognitive_state)}"
    )
    raise TypeError(
        f"cognitive_state must be CognitiveState enum or str, got {type(cognitive_state).__name__}"
    )


def _safe_enum_to_str(value: Any, enum_class: Type[Enum]) -> Optional[str]:
    """
    Convierte un valor a string de forma defensiva con validación de enum.

    ✅ FIXED (2025-11-22): Previene crashes por valores inválidos en queries
    con enums (TraceLevel, InteractionType, RiskType, RiskLevel, etc.)

    Args:
        value: Puede ser Enum, str, o None
        enum_class: Clase del enum para validación

    Returns:
        String lowercase del valor, o None si value es None

    Raises:
        ValueError: Si el valor no es válido para el enum
        TypeError: Si el tipo no es soportado

    Example:
        >>> from src.ai_native_mvp.models.trace import TraceLevel
        >>> # Acepta enum
        >>> _safe_enum_to_str(TraceLevel.N4_COGNITIVO, TraceLevel)
        'n4_cognitivo'
        >>> # Acepta string válido
        >>> _safe_enum_to_str("N4_COGNITIVO", TraceLevel)
        'n4_cognitivo'
        >>> # Rechaza string inválido
        >>> _safe_enum_to_str("INVALID", TraceLevel)
        ValueError: Invalid TraceLevel: 'INVALID'. Valid values: [...]
        >>> # Acepta None
        >>> _safe_enum_to_str(None, TraceLevel)
        None
    """
    if value is None:
        return None

    # Ya es un enum válido
    if isinstance(value, enum_class):
        return value.value.lower()

    # Es un string, validar que sea un valor válido del enum
    if isinstance(value, str):
        try:
            # Intentar crear enum desde el string (case-insensitive)
            # Buscar el valor en el enum ignorando case
            value_upper = value.upper()
            for enum_member in enum_class:
                if enum_member.value.upper() == value_upper:
                    return enum_member.value.lower()

            # Si no se encontró, lanzar error con valores válidos
            valid_values = [e.value for e in enum_class]
            raise ValueError(
                f"Invalid {enum_class.__name__}: '{value}'. "
                f"Valid values: {valid_values}"
            )
        except AttributeError:
            # El enum no tiene .value (enum mal formado)
            logger.error(
                f"Malformed enum class: {enum_class.__name__}",
                extra={"enum_class": enum_class}
            )
            raise TypeError(f"Malformed enum class: {enum_class.__name__}")

    # Tipo no válido
    logger.error(
        f"Expected {enum_class.__name__} or str, got {type(value)}",
        extra={"value": value, "type": type(value).__name__}
    )
    raise TypeError(
        f"Expected {enum_class.__name__} or str, got {type(value).__name__}"
    )


class SessionRepository:
    """Repository for session operations"""

    def __init__(self, db_session: Session):
        self.db = db_session

    def create(
        self,
        student_id: str,
        activity_id: str,
        mode: str = "TUTOR",
        simulator_type: Optional[str] = None,
    ) -> SessionDB:
        """
        Create a new learning session.

        Args:
            student_id: Student identifier
            activity_id: Activity identifier
            mode: Session mode (TUTOR, EVALUATOR, SIMULATOR, RISK_ANALYST)
            simulator_type: Type of simulator when mode=SIMULATOR
                           (product_owner, scrum_master, tech_interviewer,
                            incident_responder, client, devsecops)

        Returns:
            Created SessionDB instance
        """
        session = SessionDB(
            id=str(uuid4()),
            student_id=student_id,
            activity_id=activity_id,
            mode=mode,
            simulator_type=simulator_type,
        )
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session

    def get_by_id(self, session_id: str, load_relations: bool = False) -> Optional[SessionDB]:
        """
        Get session by ID with optional eager loading.

        ✅ REFACTORED (2025-11-22): Agregado eager loading opcional (H3)

        Args:
            session_id: Session ID to retrieve
            load_relations: If True, loads traces and risks in same query (prevents N+1)

        Returns:
            SessionDB instance if found, None otherwise

        Performance:
            - Without eager loading: 1 query (base session only)
            - With eager loading: 1-3 queries total (session + traces + risks)
            - Use load_relations=True when accessing session.traces or session.risks
        """
        query = self.db.query(SessionDB).filter(SessionDB.id == session_id)

        if load_relations:
            # ✅ REFACTORED (2025-11-22): Eager loading para prevenir N+1 queries (H3)
            # selectinload() carga relaciones en queries separadas eficientes
            query = query.options(
                selectinload(SessionDB.traces),
                selectinload(SessionDB.risks),
                selectinload(SessionDB.evaluations)
            )

        return query.first()

    def get_by_student(self, student_id: str, load_relations: bool = False) -> List[SessionDB]:
        """
        Get all sessions for a student with optional eager loading.

        ✅ REFACTORED (2025-11-22): Agregado eager loading opcional (H3)

        Args:
            student_id: Student ID
            load_relations: If True, loads traces and risks to prevent N+1 queries

        Returns:
            List of SessionDB instances

        Performance:
            - Without eager loading: 1 query (sessions only)
            - With eager loading: 1-3 queries total (sessions + traces + risks)
            - Use load_relations=True when iterating and accessing session.traces/risks
        """
        query = self.db.query(SessionDB).filter(SessionDB.student_id == student_id)

        if load_relations:
            # ✅ REFACTORED (2025-11-22): Eager loading para prevenir N+1 queries (H3)
            query = query.options(
                selectinload(SessionDB.traces),
                selectinload(SessionDB.risks),
                selectinload(SessionDB.evaluations)
            )

        return query.order_by(desc(SessionDB.created_at)).all()

    def get_by_activity(self, activity_id: str, load_relations: bool = False) -> List[SessionDB]:
        """
        Get all sessions for an activity with optional eager loading.

        ✅ REFACTORED (2025-11-22): Agregado eager loading opcional (H3)

        Args:
            activity_id: Activity ID
            load_relations: If True, loads traces and risks to prevent N+1 queries

        Returns:
            List of SessionDB instances

        Performance:
            - Without eager loading: 1 query (sessions only)
            - With eager loading: 1-3 queries total (sessions + traces + risks)
            - Use load_relations=True when iterating and accessing session.traces/risks
        """
        query = self.db.query(SessionDB).filter(SessionDB.activity_id == activity_id)

        if load_relations:
            # ✅ REFACTORED (2025-11-22): Eager loading para prevenir N+1 queries (H3)
            query = query.options(
                selectinload(SessionDB.traces),
                selectinload(SessionDB.risks),
                selectinload(SessionDB.evaluations)
            )

        return query.order_by(desc(SessionDB.created_at)).all()

    def get_all(self, load_relations: bool = False) -> List[SessionDB]:
        """
        Get all sessions with optional eager loading.

        ✅ REFACTORED (2025-11-22): Agregado eager loading opcional (H3)

        Args:
            load_relations: If True, loads traces and risks to prevent N+1 queries

        Returns:
            List of SessionDB instances

        Performance:
            - Without eager loading: 1 query (sessions only)
            - With eager loading: 1-3 queries total (sessions + traces + risks)
            - Use load_relations=True when iterating and accessing session.traces/risks
        """
        query = self.db.query(SessionDB)

        if load_relations:
            # ✅ REFACTORED (2025-11-22): Eager loading para prevenir N+1 queries (H3)
            query = query.options(
                selectinload(SessionDB.traces),
                selectinload(SessionDB.risks),
                selectinload(SessionDB.evaluations)
            )

        return query.order_by(desc(SessionDB.created_at)).all()

    def end_session(self, session_id: str) -> Optional[SessionDB]:
        """
        Mark session as completed with pessimistic locking

        Uses SELECT FOR UPDATE to prevent race conditions when multiple
        requests try to end the same session simultaneously.

        Returns:
            SessionDB if session was ended successfully, None otherwise
        """
        try:
            # ✅ Pessimistic lock: SELECT ... FOR UPDATE
            stmt = select(SessionDB).where(SessionDB.id == session_id).with_for_update()
            session = self.db.execute(stmt).scalar_one_or_none()

            if session:
                session.end_time = datetime.utcnow()
                session.status = "completed"
                self.db.commit()
                self.db.refresh(session)
                return session

            return None
        except Exception:
            self.db.rollback()
            raise

    def update_mode(self, session_id: str, mode: str) -> Optional[SessionDB]:
        """
        Update session mode with pessimistic locking

        Uses SELECT FOR UPDATE to prevent race conditions.
        """
        try:
            # ✅ Pessimistic lock: SELECT ... FOR UPDATE
            stmt = select(SessionDB).where(SessionDB.id == session_id).with_for_update()
            session = self.db.execute(stmt).scalar_one_or_none()

            if session:
                session.mode = mode
                self.db.commit()
                self.db.refresh(session)
                return session

            return None
        except Exception:
            self.db.rollback()
            raise

    def update_status(self, session_id: str, status: str) -> Optional[SessionDB]:
        """
        Update session status with pessimistic locking

        Uses SELECT FOR UPDATE to prevent race conditions.
        """
        try:
            # ✅ Pessimistic lock: SELECT ... FOR UPDATE
            stmt = select(SessionDB).where(SessionDB.id == session_id).with_for_update()
            session = self.db.execute(stmt).scalar_one_or_none()

            if session:
                session.status = status
                self.db.commit()
                self.db.refresh(session)
                return session

            return None
        except Exception:
            self.db.rollback()
            raise

    def delete(self, session_id: str) -> bool:
        """
        Delete a session (hard delete with CASCADE to related entities)

        ⚠️ WARNING: This will also delete all related traces, risks, and evaluations
        due to CASCADE foreign key constraints.

        Args:
            session_id: Session ID to delete

        Returns:
            True if session was deleted, False if session not found

        Note:
            Uses try/except with rollback for transaction safety.
            All related entities (traces, risks, evaluations) are automatically
            deleted by SQLAlchemy CASCADE configuration.
        """
        try:
            session = self.db.query(SessionDB).filter(SessionDB.id == session_id).first()
            if not session:
                return False

            self.db.delete(session)
            self.db.commit()
            return True
        except Exception:
            self.db.rollback()
            raise


class TraceRepository:
    """Repository for cognitive trace operations"""

    def __init__(self, db_session: Session):
        self.db = db_session

    def create(self, trace: CognitiveTrace) -> CognitiveTraceDB:
        """Create a new cognitive trace"""
        # ✅ FIXED (2025-11-22): Conversión defensiva de enums (C5)
        db_trace = CognitiveTraceDB(
            id=trace.id or str(uuid4()),
            session_id=trace.session_id,
            student_id=trace.student_id,
            activity_id=trace.activity_id,
            trace_level=_safe_enum_to_str(trace.trace_level, TraceLevel),
            interaction_type=_safe_enum_to_str(trace.interaction_type, InteractionType),
            content=trace.content,
            context=trace.context,
            trace_metadata=trace.metadata,
            cognitive_state=_safe_cognitive_state_to_str(trace.cognitive_state),
            cognitive_intent=trace.cognitive_intent,
            decision_justification=trace.decision_justification,
            alternatives_considered=trace.alternatives_considered,
            strategy_type=trace.strategy_type,
            ai_involvement=trace.ai_involvement,
            parent_trace_id=trace.parent_trace_id,
            agent_id=trace.agent_id,
        )
        self.db.add(db_trace)
        self.db.commit()
        self.db.refresh(db_trace)
        return db_trace

    def get_by_id(self, trace_id: str) -> Optional[CognitiveTraceDB]:
        """Get trace by ID"""
        return self.db.query(CognitiveTraceDB).filter(CognitiveTraceDB.id == trace_id).first()

    def get_by_session(self, session_id: str) -> List[CognitiveTraceDB]:
        """Get all traces for a session"""
        return (
            self.db.query(CognitiveTraceDB)
            .filter(CognitiveTraceDB.session_id == session_id)
            .order_by(CognitiveTraceDB.created_at)
            .all()
        )

    def get_by_student(self, student_id: str, limit: int = 100) -> List[CognitiveTraceDB]:
        """
        Get recent traces for a student with eager loading to prevent N+1 queries.
        Uses joinedload to fetch related session data in a single query.
        """
        from sqlalchemy.orm import joinedload

        return (
            self.db.query(CognitiveTraceDB)
            .filter(CognitiveTraceDB.student_id == student_id)
            .options(joinedload(CognitiveTraceDB.session))  # ✅ Eager loading
            .order_by(desc(CognitiveTraceDB.created_at))
            .limit(limit)
            .all()
        )

    def count_by_session(self, session_id: str) -> int:
        """Count traces in a session"""
        return (
            self.db.query(CognitiveTraceDB)
            .filter(CognitiveTraceDB.session_id == session_id)
            .count()
        )

    def get_by_session_ids(self, session_ids: List[str]) -> Dict[str, List[CognitiveTraceDB]]:
        """
        Get all traces for multiple sessions in a single query (batch loading).

        This prevents N+1 query problems when loading traces for multiple sessions.

        Args:
            session_ids: List of session IDs to fetch traces for

        Returns:
            Dictionary mapping session_id to list of traces for that session
        """
        if not session_ids:
            return {}

        traces = (
            self.db.query(CognitiveTraceDB)
            .filter(CognitiveTraceDB.session_id.in_(session_ids))
            .order_by(CognitiveTraceDB.session_id, CognitiveTraceDB.created_at)
            .all()
        )

        # Group traces by session_id
        result: Dict[str, List[CognitiveTraceDB]] = {sid: [] for sid in session_ids}
        for trace in traces:
            if trace.session_id in result:
                result[trace.session_id].append(trace)

        return result


class RiskRepository:
    """Repository for risk operations"""

    def __init__(self, db_session: Session):
        self.db = db_session

    def create(self, risk: Risk) -> RiskDB:
        """
        Create a new risk.

        Note: All getattr() calls removed - Pydantic models guarantee all fields exist
        with appropriate defaults (Optional fields default to None, lists to [], etc.)
        """
        # ✅ FIXED (2025-11-22): Conversión defensiva de enums (C5)
        db_risk = RiskDB(
            id=risk.id or str(uuid4()),
            session_id=risk.session_id,  # REQUIRED field (Phase 0 fix)
            student_id=risk.student_id,
            activity_id=risk.activity_id,
            risk_type=_safe_enum_to_str(risk.risk_type, RiskType),
            risk_level=_safe_enum_to_str(risk.risk_level, RiskLevel),
            dimension=risk.dimension.value,  # RiskDimension - mantener .value por ahora (no hay import)
            description=risk.description,
            impact=risk.impact,  # Optional[str], defaults to None
            evidence=risk.evidence,  # List[str], defaults to []
            trace_ids=risk.trace_ids,  # List[str], defaults to []
            root_cause=risk.root_cause,  # Optional[str], defaults to None
            impact_assessment=risk.impact_assessment,  # Optional[str], defaults to None
            recommendations=risk.recommendations,  # List[str], defaults to []
            pedagogical_intervention=risk.pedagogical_intervention,  # Optional[str], defaults to None
            resolved=risk.resolved,  # bool, defaults to False
            resolution_notes=risk.resolution_notes,  # Optional[str], defaults to None
            detected_by=risk.detected_by,  # str, defaults to "AR-IA"
        )
        self.db.add(db_risk)
        self.db.commit()
        self.db.refresh(db_risk)
        return db_risk

    def get_by_id(self, risk_id: str) -> Optional[RiskDB]:
        """Get risk by ID"""
        return self.db.query(RiskDB).filter(RiskDB.id == risk_id).first()

    def get_by_session(self, session_id: str, resolved: Optional[bool] = None) -> List[RiskDB]:
        """
        Get all risks for a session

        Args:
            session_id: Session ID to filter by
            resolved: Optional filter by resolution status (True/False/None for all)

        Returns:
            List of risks for the session, ordered by creation date (newest first)
        """
        query = self.db.query(RiskDB).filter(RiskDB.session_id == session_id)

        if resolved is not None:
            query = query.filter(RiskDB.resolved == resolved)

        return query.order_by(desc(RiskDB.created_at)).all()

    def get_by_student(self, student_id: str, resolved: Optional[bool] = None) -> List[RiskDB]:
        """
        Get risks for a student with eager loading to prevent N+1 queries.

        Uses joinedload to fetch related session data in a single query.
        """
        from sqlalchemy.orm import joinedload

        query = self.db.query(RiskDB)\
            .filter(RiskDB.student_id == student_id)\
            .options(joinedload(RiskDB.session))  # ✅ Eager loading

        if resolved is not None:
            query = query.filter(RiskDB.resolved == resolved)

        return query.order_by(desc(RiskDB.created_at)).all()

    def get_critical_risks(self, student_id: Optional[str] = None) -> List[RiskDB]:
        """
        Get all critical risks with eager loading to prevent N+1 queries.
        Uses joinedload to fetch related session data in a single query.
        """
        from sqlalchemy.orm import joinedload

        query = self.db.query(RiskDB)\
            .filter(RiskDB.risk_level == "critical")\
            .options(joinedload(RiskDB.session))  # ✅ Eager loading

        if student_id:
            query = query.filter(RiskDB.student_id == student_id)

        return query.order_by(desc(RiskDB.created_at)).all()

    def resolve_risk(self, risk_id: str, resolution_notes: str) -> bool:
        """Mark risk as resolved"""
        risk = self.get_by_id(risk_id)
        if risk:
            risk.resolved = True
            risk.resolution_notes = resolution_notes
            risk.updated_at = datetime.utcnow()
            self.db.commit()
            return True
        return False

    def get_by_session_ids(self, session_ids: List[str]) -> Dict[str, List[RiskDB]]:
        """
        Get all risks for multiple sessions in a single query (batch loading).

        This prevents N+1 query problems when loading risks for multiple sessions.

        Args:
            session_ids: List of session IDs to fetch risks for

        Returns:
            Dictionary mapping session_id to list of risks for that session
        """
        if not session_ids:
            return {}

        risks = (
            self.db.query(RiskDB)
            .filter(RiskDB.session_id.in_(session_ids))
            .order_by(RiskDB.session_id, desc(RiskDB.created_at))
            .all()
        )

        # Group risks by session_id
        result: Dict[str, List[RiskDB]] = {sid: [] for sid in session_ids}
        for risk in risks:
            if risk.session_id in result:
                result[risk.session_id].append(risk)

        return result


class EvaluationRepository:
    """Repository for evaluation operations"""

    def __init__(self, db_session: Session):
        self.db = db_session

    def create(self, evaluation: EvaluationReport) -> EvaluationDB:
        """
        Create a new evaluation.

        Note: The EvaluationReport Pydantic model has separate fields
        (recommendations_student, recommendations_teacher), but the database
        stores them combined in a single 'recommendations' JSON field with
        structure: {"student": [...], "teacher": [...]}.
        """
        # Combine student and teacher recommendations into single JSON structure
        recommendations = {
            "student": evaluation.recommendations_student,
            "teacher": evaluation.recommendations_teacher,
        }

        # Handle reasoning_analysis (REQUIRED field, always Pydantic model)
        reasoning_analysis_dict = evaluation.reasoning_analysis.model_dump()

        # Handle git_analysis (Optional field, can be None or Pydantic model)
        git_analysis_dict = {}
        if evaluation.git_analysis is not None:
            git_analysis_dict = evaluation.git_analysis.model_dump()

        # Map ai_dependency_score + ai_usage_patterns to ai_dependency_metrics JSON
        # Note: Database has ai_dependency_metrics JSON, but Pydantic has separate fields
        ai_dependency_metrics = {
            "score": evaluation.ai_dependency_score,
            "usage_patterns": evaluation.ai_usage_patterns,
            "reasoning_map": evaluation.reasoning_map,
        }

        # ✅ FIXED (2025-11-22): Conversión defensiva de enums (C5)
        db_evaluation = EvaluationDB(
            id=str(uuid4()),
            session_id=evaluation.session_id,
            student_id=evaluation.student_id,
            activity_id=evaluation.activity_id,
            overall_competency_level=_safe_enum_to_str(evaluation.overall_competency_level, CompetencyLevel),
            overall_score=evaluation.overall_score,
            dimensions=[d.model_dump() for d in evaluation.dimensions],
            key_strengths=evaluation.key_strengths,
            improvement_areas=evaluation.improvement_areas,
            recommendations=recommendations,  # Combined structure (Phase 0 fix)
            reasoning_analysis=reasoning_analysis_dict,  # Required, always present
            git_analysis=git_analysis_dict,  # Optional, empty dict if None
            ai_dependency_metrics=ai_dependency_metrics,  # Combined AI metrics
        )
        self.db.add(db_evaluation)
        self.db.commit()
        self.db.refresh(db_evaluation)
        return db_evaluation

    def get_by_id(self, evaluation_id: str) -> Optional[EvaluationDB]:
        """Get evaluation by ID"""
        return self.db.query(EvaluationDB).filter(EvaluationDB.id == evaluation_id).first()

    def get_by_session(self, session_id: str) -> List[EvaluationDB]:
        """Get all evaluations for a session"""
        return (
            self.db.query(EvaluationDB)
            .filter(EvaluationDB.session_id == session_id)
            .order_by(desc(EvaluationDB.created_at))
            .all()
        )

    def get_by_student(self, student_id: str) -> List[EvaluationDB]:
        """Get all evaluations for a student"""
        return (
            self.db.query(EvaluationDB)
            .filter(EvaluationDB.student_id == student_id)
            .order_by(desc(EvaluationDB.created_at))
            .all()
        )


class TraceSequenceRepository:
    """Repository for trace sequence operations"""

    def __init__(self, db_session: Session):
        self.db = db_session

    def create(self, sequence: TraceSequence) -> TraceSequenceDB:
        """Create a new trace sequence"""
        db_sequence = TraceSequenceDB(
            id=sequence.id,
            session_id=sequence.session_id,
            student_id=sequence.student_id,
            activity_id=sequence.activity_id,
            start_time=sequence.start_time,
            end_time=sequence.end_time,
            reasoning_path=sequence.reasoning_path,
            strategy_changes=sequence.strategy_changes,
            ai_dependency_score=sequence.ai_dependency_score,
            trace_ids=[t.id for t in sequence.traces],
        )
        self.db.add(db_sequence)
        self.db.commit()
        self.db.refresh(db_sequence)
        return db_sequence

    def get_by_id(self, sequence_id: str) -> Optional[TraceSequenceDB]:
        """Get sequence by ID"""
        return (
            self.db.query(TraceSequenceDB)
            .filter(TraceSequenceDB.id == sequence_id)
            .first()
        )

    def get_by_session(self, session_id: str) -> List[TraceSequenceDB]:
        """Get all sequences for a session"""
        return (
            self.db.query(TraceSequenceDB)
            .filter(TraceSequenceDB.session_id == session_id)
            .order_by(TraceSequenceDB.start_time)
            .all()
        )


class ActivityRepository:
    """Repository for activity operations"""

    def __init__(self, db_session: Session):
        self.db = db_session

    def create(
        self,
        activity_id: str,
        title: str,
        instructions: str,
        teacher_id: str,
        policies: dict,
        description: Optional[str] = None,
        evaluation_criteria: Optional[List[str]] = None,
        subject: Optional[str] = None,
        difficulty: Optional[str] = None,
        estimated_duration_minutes: Optional[int] = None,
        tags: Optional[List[str]] = None,
    ) -> ActivityDB:
        """Create a new activity"""
        # Verificar que activity_id no exista
        existing = self.get_by_activity_id(activity_id)
        if existing:
            raise ValueError(f"Activity with ID '{activity_id}' already exists")

        activity = ActivityDB(
            id=str(uuid4()),
            activity_id=activity_id,
            title=title,
            description=description,
            instructions=instructions,
            evaluation_criteria=evaluation_criteria or [],
            teacher_id=teacher_id,
            policies=policies,
            subject=subject,
            difficulty=difficulty,
            estimated_duration_minutes=estimated_duration_minutes,
            tags=tags or [],
            status="draft",
        )
        self.db.add(activity)
        self.db.commit()
        self.db.refresh(activity)
        return activity

    def get_by_id(self, id: str) -> Optional[ActivityDB]:
        """Get activity by ID"""
        return self.db.query(ActivityDB).filter(ActivityDB.id == id).first()

    def get_by_activity_id(self, activity_id: str) -> Optional[ActivityDB]:
        """Get activity by activity_id (unique identifier)"""
        return self.db.query(ActivityDB).filter(ActivityDB.activity_id == activity_id).first()

    def get_by_teacher(
        self, teacher_id: str, status: Optional[str] = None
    ) -> List[ActivityDB]:
        """Get all activities created by a teacher"""
        query = self.db.query(ActivityDB).filter(ActivityDB.teacher_id == teacher_id)
        if status:
            query = query.filter(ActivityDB.status == status)
        return query.order_by(desc(ActivityDB.created_at)).all()

    def get_all(
        self,
        status: Optional[str] = None,
        subject: Optional[str] = None,
        difficulty: Optional[str] = None,
        limit: int = 100,
    ) -> List[ActivityDB]:
        """Get all activities with optional filters"""
        query = self.db.query(ActivityDB)

        if status:
            query = query.filter(ActivityDB.status == status)
        if subject:
            query = query.filter(ActivityDB.subject == subject)
        if difficulty:
            query = query.filter(ActivityDB.difficulty == difficulty)

        return query.order_by(desc(ActivityDB.created_at)).limit(limit).all()

    def update(
        self,
        activity_id: str,
        **kwargs,
    ) -> Optional[ActivityDB]:
        """
        Update activity fields.

        Only allows updating safe, user-modifiable fields via whitelist.

        Raises:
            ValueError: If attempting to update a protected field
            TypeError: If field value has incorrect type
        """
        # Whitelist de campos actualizables (seguridad)
        UPDATEABLE_FIELDS = {
            "title": str,
            "description": str,
            "instructions": str,
            "difficulty": str,
            "tags": list,
            "learning_objectives": list,
            "evaluation_criteria": dict,
            "estimated_duration_minutes": int,
            "max_ai_assistance": float,
        }

        activity = self.get_by_activity_id(activity_id)
        if not activity:
            return None

        # Validar y actualizar solo campos permitidos
        for key, value in kwargs.items():
            # Seguridad: Verificar que el campo esté en whitelist
            if key not in UPDATEABLE_FIELDS:
                raise ValueError(
                    f"Cannot update field '{key}'. "
                    f"Allowed fields: {', '.join(UPDATEABLE_FIELDS.keys())}"
                )

            # Validar tipo si no es None
            if value is not None:
                expected_type = UPDATEABLE_FIELDS[key]
                if not isinstance(value, expected_type):
                    raise TypeError(
                        f"Invalid type for field '{key}': "
                        f"expected {expected_type.__name__}, got {type(value).__name__}"
                    )

                # ✅ FIXED (2025-11-22): Validación de rangos para prevenir corrupción de datos
                # Validar rangos/valores permitidos según el campo
                if key == "max_ai_assistance":
                    if not (0.0 <= value <= 1.0):
                        raise ValueError(
                            f"max_ai_assistance must be in range [0.0, 1.0], got {value}"
                        )

                elif key == "estimated_duration_minutes":
                    if value <= 0:
                        raise ValueError(
                            f"estimated_duration_minutes must be positive, got {value}"
                        )

                elif key == "difficulty":
                    VALID_DIFFICULTIES = ["INICIAL", "INTERMEDIO", "AVANZADO"]
                    if value not in VALID_DIFFICULTIES:
                        raise ValueError(
                            f"difficulty must be one of {VALID_DIFFICULTIES}, got '{value}'"
                        )

                elif key == "title":
                    if not (3 <= len(value) <= 200):
                        raise ValueError(
                            f"title length must be between 3 and 200 characters, got {len(value)}"
                        )

                elif key == "description":
                    if len(value) > 2000:
                        raise ValueError(
                            f"description length must be <= 2000 characters, got {len(value)}"
                        )

                elif key == "tags":
                    if len(value) == 0:
                        raise ValueError("tags list cannot be empty")
                    if not all(isinstance(tag, str) for tag in value):
                        raise TypeError("tags must be a list of strings")
                    if not all(len(tag) >= 2 for tag in value):
                        raise ValueError("each tag must have at least 2 characters")

                setattr(activity, key, value)

        activity.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(activity)
        return activity

    def publish(self, activity_id: str) -> Optional[ActivityDB]:
        """Publish an activity (change status from draft to active)"""
        activity = self.get_by_activity_id(activity_id)
        if not activity:
            return None

        activity.status = "active"
        activity.published_at = datetime.utcnow()
        activity.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(activity)
        return activity

    def archive(self, activity_id: str) -> Optional[ActivityDB]:
        """Archive an activity"""
        activity = self.get_by_activity_id(activity_id)
        if not activity:
            return None

        activity.status = "archived"
        activity.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(activity)
        return activity

    def delete(self, activity_id: str) -> bool:
        """Delete an activity (soft delete by archiving)"""
        activity = self.get_by_activity_id(activity_id)
        if not activity:
            return False

        # Soft delete: archive instead of physical deletion
        activity.status = "archived"
        activity.updated_at = datetime.utcnow()
        self.db.commit()
        return True

class UserRepository:
    """Repository for user authentication and authorization operations"""

    def __init__(self, db_session: Session):
        self.db = db_session

    def create(
        self,
        email: str,
        username: str,
        hashed_password: str,
        full_name: Optional[str] = None,
        student_id: Optional[str] = None,
        roles: Optional[List[str]] = None,
    ) -> UserDB:
        """
        Create a new user

        Args:
            email: User email (unique)
            username: Username (unique)
            hashed_password: Bcrypt hashed password
            full_name: Optional full name
            student_id: Optional student ID (for linking to StudentProfileDB)
            roles: List of roles (default: ["student"])

        Returns:
            Created UserDB instance
        """
        if roles is None:
            roles = ["student"]

        user = UserDB(
            id=str(uuid4()),
            email=email.lower(),  # Normalize email to lowercase
            username=username,
            hashed_password=hashed_password,
            full_name=full_name,
            student_id=student_id,
            roles=roles,
            is_active=True,
            is_verified=False,  # Require email verification in production
            login_count=0,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        logger.info(
            "User created successfully",
            extra={"user_id": user.id, "email": user.email, "roles": user.roles},
        )
        return user

    def get_by_id(self, user_id: str) -> Optional[UserDB]:
        """Get user by ID"""
        return self.db.query(UserDB).filter(UserDB.id == user_id).first()

    def get_by_email(self, email: str) -> Optional[UserDB]:
        """
        Get user by email (case-insensitive)

        Args:
            email: User email

        Returns:
            UserDB if found, None otherwise
        """
        return (
            self.db.query(UserDB)
            .filter(UserDB.email == email.lower())
            .first()
        )

    def get_by_username(self, username: str) -> Optional[UserDB]:
        """
        Get user by username

        Args:
            username: Username

        Returns:
            UserDB if found, None otherwise
        """
        return (
            self.db.query(UserDB)
            .filter(UserDB.username == username)
            .first()
        )

    def get_by_student_id(self, student_id: str) -> Optional[UserDB]:
        """
        Get user by student_id

        Args:
            student_id: Student ID

        Returns:
            UserDB if found, None otherwise
        """
        return (
            self.db.query(UserDB)
            .filter(UserDB.student_id == student_id)
            .first()
        )

    def get_all(self, include_inactive: bool = False) -> List[UserDB]:
        """
        Get all users

        Args:
            include_inactive: If True, include inactive users

        Returns:
            List of UserDB instances
        """
        query = self.db.query(UserDB).order_by(desc(UserDB.created_at))
        if not include_inactive:
            query = query.filter(UserDB.is_active == True)
        return query.all()

    def get_by_role(self, role: str) -> List[UserDB]:
        """
        Get all users with a specific role

        Args:
            role: Role name (e.g., "student", "instructor", "admin")

        Returns:
            List of UserDB instances with the role

        Performance Note:
            Current implementation (SQLite): O(n) - loads ALL users to memory then filters in Python.
            This is acceptable for development/testing with <100 users.

            TODO PRODUCTION: Migrate to PostgreSQL for O(log n) performance.
            With PostgreSQL, use:
                .filter(text("roles @> ARRAY[:role]::varchar[]")).params(role=role)
            This leverages GIN index on roles[] column for efficient queries.

            Impact at scale:
            - 100 users:    Loads 100, returns ~20  (80% waste)
            - 1,000 users:  Loads 1,000, returns ~50 (95% waste)
            - 10,000 users: Loads 10,000, returns ~100 (99% waste)
        """
        # PostgreSQL: Use JSON contains operator with GIN index
        # SQLite: Query all users and filter in Python (less efficient but acceptable for dev)
        all_users = self.db.query(UserDB).filter(UserDB.is_active == True).all()
        return [user for user in all_users if role in user.roles]

    def update_password(self, user_id: str, new_hashed_password: str) -> Optional[UserDB]:
        """
        Update user password

        Args:
            user_id: User ID
            new_hashed_password: New bcrypt hashed password

        Returns:
            Updated UserDB if found, None otherwise
        """
        user = self.get_by_id(user_id)
        if not user:
            return None

        user.hashed_password = new_hashed_password
        user.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(user)

        logger.info("User password updated", extra={"user_id": user.id})
        return user

    def update_profile(
        self,
        user_id: str,
        full_name: Optional[str] = None,
        student_id: Optional[str] = None,
    ) -> Optional[UserDB]:
        """
        Update user profile

        Args:
            user_id: User ID
            full_name: New full name (optional)
            student_id: New student ID (optional)

        Returns:
            Updated UserDB if found, None otherwise
        """
        user = self.get_by_id(user_id)
        if not user:
            return None

        if full_name is not None:
            user.full_name = full_name
        if student_id is not None:
            user.student_id = student_id

        user.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(user)

        logger.info("User profile updated", extra={"user_id": user.id})
        return user

    def add_role(self, user_id: str, role: str) -> Optional[UserDB]:
        """
        Add role to user

        Args:
            user_id: User ID
            role: Role to add

        Returns:
            Updated UserDB if found, None otherwise
        """
        user = self.get_by_id(user_id)
        if not user:
            return None

        if role not in user.roles:
            user.roles = user.roles + [role]  # Create new list for SQLAlchemy to detect change
            user.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(user)

            logger.info(
                "Role added to user", extra={"user_id": user.id, "role": role}
            )

        return user

    def remove_role(self, user_id: str, role: str) -> Optional[UserDB]:
        """
        Remove role from user

        Args:
            user_id: User ID
            role: Role to remove

        Returns:
            Updated UserDB if found, None otherwise
        """
        user = self.get_by_id(user_id)
        if not user:
            return None

        if role in user.roles:
            user.roles = [r for r in user.roles if r != role]
            user.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(user)

            logger.info(
                "Role removed from user", extra={"user_id": user.id, "role": role}
            )

        return user

    def update_last_login(self, user_id: str) -> Optional[UserDB]:
        """
        Update last login timestamp and increment login count

        Args:
            user_id: User ID

        Returns:
            Updated UserDB if found, None otherwise
        """
        user = self.get_by_id(user_id)
        if not user:
            return None

        user.last_login = datetime.utcnow()
        user.login_count += 1
        self.db.commit()
        self.db.refresh(user)

        logger.info(
            "User login recorded",
            extra={"user_id": user.id, "login_count": user.login_count},
        )
        return user

    def verify_user(self, user_id: str) -> Optional[UserDB]:
        """
        Mark user as verified (after email verification)

        Args:
            user_id: User ID

        Returns:
            Updated UserDB if found, None otherwise
        """
        user = self.get_by_id(user_id)
        if not user:
            return None

        user.is_verified = True
        user.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(user)

        logger.info("User verified", extra={"user_id": user.id})
        return user

    def deactivate_user(self, user_id: str) -> Optional[UserDB]:
        """
        Deactivate user account

        Args:
            user_id: User ID

        Returns:
            Updated UserDB if found, None otherwise
        """
        user = self.get_by_id(user_id)
        if not user:
            return None

        user.is_active = False
        user.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(user)

        logger.info("User deactivated", extra={"user_id": user.id})
        return user

    def reactivate_user(self, user_id: str) -> Optional[UserDB]:
        """
        Reactivate user account

        Args:
            user_id: User ID

        Returns:
            Updated UserDB if found, None otherwise
        """
        user = self.get_by_id(user_id)
        if not user:
            return None

        user.is_active = True
        user.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(user)

        logger.info("User reactivated", extra={"user_id": user.id})
        return user

    def delete(self, user_id: str) -> bool:
        """
        Delete user (hard delete - use with caution!)

        Note: In production, consider soft delete (deactivate_user) instead
        to preserve referential integrity and audit trail.

        Args:
            user_id: User ID

        Returns:
            True if deleted, False if not found
        """
        user = self.get_by_id(user_id)
        if not user:
            return False

        self.db.delete(user)
        self.db.commit()

        logger.warning("User deleted (hard delete)", extra={"user_id": user.id})
        return True


# =============================================================================
# SPRINT 5 REPOSITORIES: Git N2 Traceability + Analytics
# =============================================================================


class GitTraceRepository:
    """
    Repository for Git N2-level traceability operations

    SPRINT 5 - HU-SYS-008: Integración Git
    """

    def __init__(self, db_session: Session):
        self.db = db_session

    def create(
        self,
        session_id: str,
        student_id: str,
        activity_id: str,
        event_type: str,
        commit_hash: str,
        commit_message: str,
        author_name: str,
        author_email: str,
        timestamp: datetime,
        branch_name: str,
        parent_commits: List[str],
        files_changed: List[dict],
        total_lines_added: int = 0,
        total_lines_deleted: int = 0,
        diff: str = "",
        is_merge: bool = False,
        is_revert: bool = False,
        detected_patterns: Optional[List[str]] = None,
        complexity_delta: Optional[int] = None,
        related_cognitive_traces: Optional[List[str]] = None,
        cognitive_state_during_commit: Optional[str] = None,
        time_since_last_interaction_minutes: Optional[int] = None,
        repo_path: Optional[str] = None,
        remote_url: Optional[str] = None,
    ) -> GitTraceDB:
        """
        Create a new Git trace

        Args:
            session_id: Session ID
            student_id: Student ID
            activity_id: Activity ID
            event_type: GitEventType (commit, branch_create, merge, etc.)
            commit_hash: SHA-1 hash (40 chars)
            commit_message: Commit message
            author_name: Author name
            author_email: Author email
            timestamp: Commit timestamp
            branch_name: Branch name
            parent_commits: List of parent commit hashes
            files_changed: List of GitFileChange dicts
            total_lines_added: Total lines added
            total_lines_deleted: Total lines deleted
            diff: Full diff output
            is_merge: True if merge commit
            is_revert: True if revert commit
            detected_patterns: List of CodePattern strings
            complexity_delta: Change in cyclomatic complexity
            related_cognitive_traces: Related N4 trace IDs
            cognitive_state_during_commit: Cognitive state from nearest N4 trace
            time_since_last_interaction_minutes: Minutes since last interaction
            repo_path: Repository local path
            remote_url: Repository remote URL

        Returns:
            Created GitTraceDB instance
        """
        git_trace = GitTraceDB(
            id=str(uuid4()),
            session_id=session_id,
            student_id=student_id,
            activity_id=activity_id,
            event_type=event_type,
            commit_hash=commit_hash,
            commit_message=commit_message,
            author_name=author_name,
            author_email=author_email,
            timestamp=timestamp,
            branch_name=branch_name,
            parent_commits=parent_commits,
            files_changed=files_changed,
            total_lines_added=total_lines_added,
            total_lines_deleted=total_lines_deleted,
            diff=diff,
            is_merge=is_merge,
            is_revert=is_revert,
            detected_patterns=detected_patterns or [],
            complexity_delta=complexity_delta,
            related_cognitive_traces=related_cognitive_traces or [],
            cognitive_state_during_commit=cognitive_state_during_commit,
            time_since_last_interaction_minutes=time_since_last_interaction_minutes,
            repo_path=repo_path,
            remote_url=remote_url,
        )
        self.db.add(git_trace)
        self.db.commit()
        self.db.refresh(git_trace)

        logger.info(
            "Git trace created",
            extra={
                "trace_id": git_trace.id,
                "session_id": session_id,
                "commit_hash": commit_hash,
                "event_type": event_type,
            },
        )
        return git_trace

    def get_by_session(self, session_id: str) -> List[GitTraceDB]:
        """Get all Git traces for a session ordered by timestamp"""
        return (
            self.db.query(GitTraceDB)
            .filter(GitTraceDB.session_id == session_id)
            .order_by(GitTraceDB.timestamp)
            .all()
        )

    def get_by_student(
        self, student_id: str, limit: Optional[int] = None
    ) -> List[GitTraceDB]:
        """Get Git traces by student ordered by timestamp"""
        query = (
            self.db.query(GitTraceDB)
            .filter(GitTraceDB.student_id == student_id)
            .order_by(desc(GitTraceDB.timestamp))
        )
        if limit:
            query = query.limit(limit)
        return query.all()

    def get_by_commit_hash(self, commit_hash: str) -> Optional[GitTraceDB]:
        """Get Git trace by commit hash"""
        return (
            self.db.query(GitTraceDB)
            .filter(GitTraceDB.commit_hash == commit_hash)
            .first()
        )

    def get_by_student_activity(
        self, student_id: str, activity_id: str
    ) -> List[GitTraceDB]:
        """Get Git traces for student + activity ordered by timestamp"""
        return (
            self.db.query(GitTraceDB)
            .filter(
                GitTraceDB.student_id == student_id,
                GitTraceDB.activity_id == activity_id,
            )
            .order_by(GitTraceDB.timestamp)
            .all()
        )

    def count_by_student(self, student_id: str) -> int:
        """Count total commits by student"""
        return (
            self.db.query(GitTraceDB)
            .filter(GitTraceDB.student_id == student_id)
            .count()
        )


class CourseReportRepository:
    """
    Repository for course-level aggregate reports

    SPRINT 5 - HU-DOC-009: Reportes Institucionales
    """

    def __init__(self, db_session: Session):
        self.db = db_session

    def create(
        self,
        course_id: str,
        teacher_id: str,
        report_type: str,
        period_start: datetime,
        period_end: datetime,
        summary_stats: dict,
        competency_distribution: dict,
        risk_distribution: dict,
        top_risks: Optional[List[dict]] = None,
        student_summaries: Optional[List[dict]] = None,
        institutional_recommendations: Optional[List[str]] = None,
        at_risk_students: Optional[List[str]] = None,
        format: str = "json",
        file_path: Optional[str] = None,
    ) -> CourseReportDB:
        """
        Create a new course report

        Args:
            course_id: Course identifier (e.g., "PROG2_2025_1C")
            teacher_id: Teacher who generated the report
            report_type: Type of report (cohort_summary, risk_dashboard, etc.)
            period_start: Start of reporting period
            period_end: End of reporting period
            summary_stats: Aggregate statistics dict
            competency_distribution: Competency level distribution dict
            risk_distribution: Risk level distribution dict
            top_risks: Top 5 most frequent risks
            student_summaries: List of student summary dicts
            institutional_recommendations: Institutional recommendations
            at_risk_students: List of student IDs requiring intervention
            format: Export format (json, pdf, xlsx)
            file_path: Path to exported file

        Returns:
            Created CourseReportDB instance
        """
        report = CourseReportDB(
            id=str(uuid4()),
            course_id=course_id,
            teacher_id=teacher_id,
            report_type=report_type,
            period_start=period_start,
            period_end=period_end,
            summary_stats=summary_stats,
            competency_distribution=competency_distribution,
            risk_distribution=risk_distribution,
            top_risks=top_risks or [],
            student_summaries=student_summaries or [],
            institutional_recommendations=institutional_recommendations or [],
            at_risk_students=at_risk_students or [],
            format=format,
            file_path=file_path,
        )
        self.db.add(report)
        self.db.commit()
        self.db.refresh(report)

        logger.info(
            "Course report created",
            extra={
                "report_id": report.id,
                "course_id": course_id,
                "report_type": report_type,
                "teacher_id": teacher_id,
            },
        )
        return report

    def get_by_id(self, report_id: str) -> Optional[CourseReportDB]:
        """Get report by ID"""
        return self.db.query(CourseReportDB).filter(CourseReportDB.id == report_id).first()

    def get_by_course(
        self, course_id: str, limit: Optional[int] = None
    ) -> List[CourseReportDB]:
        """Get reports for a course ordered by period"""
        query = (
            self.db.query(CourseReportDB)
            .filter(CourseReportDB.course_id == course_id)
            .order_by(desc(CourseReportDB.period_start))
        )
        if limit:
            query = query.limit(limit)
        return query.all()

    def get_by_teacher(
        self, teacher_id: str, limit: Optional[int] = None
    ) -> List[CourseReportDB]:
        """Get reports by teacher ordered by period"""
        query = (
            self.db.query(CourseReportDB)
            .filter(CourseReportDB.teacher_id == teacher_id)
            .order_by(desc(CourseReportDB.period_start))
        )
        if limit:
            query = query.limit(limit)
        return query.all()

    def mark_exported(self, report_id: str, file_path: str) -> Optional[CourseReportDB]:
        """Mark report as exported with file path"""
        report = self.get_by_id(report_id)
        if not report:
            return None

        report.file_path = file_path
        report.exported_at = datetime.utcnow()
        report.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(report)

        logger.info(
            "Course report exported",
            extra={"report_id": report.id, "file_path": file_path},
        )
        return report


class RemediationPlanRepository:
    """
    Repository for remediation plan operations

    SPRINT 5 - HU-DOC-010: Gestión de Riesgos Institucionales
    """

    def __init__(self, db_session: Session):
        self.db = db_session

    def create(
        self,
        student_id: str,
        teacher_id: str,
        plan_type: str,
        description: str,
        start_date: datetime,
        target_completion_date: datetime,
        activity_id: Optional[str] = None,
        trigger_risks: Optional[List[str]] = None,
        objectives: Optional[List[str]] = None,
        recommended_actions: Optional[List[dict]] = None,
    ) -> RemediationPlanDB:
        """
        Create a new remediation plan

        Args:
            student_id: Target student ID
            teacher_id: Teacher creating the plan
            plan_type: Type of plan (tutoring, practice_exercises, etc.)
            description: Plan description
            start_date: Plan start date
            target_completion_date: Target completion date
            activity_id: Optional activity ID (null if general plan)
            trigger_risks: Risk IDs that triggered this plan
            objectives: List of specific objectives
            recommended_actions: List of action dicts

        Returns:
            Created RemediationPlanDB instance
        """
        plan = RemediationPlanDB(
            id=str(uuid4()),
            student_id=student_id,
            teacher_id=teacher_id,
            plan_type=plan_type,
            description=description,
            start_date=start_date,
            target_completion_date=target_completion_date,
            activity_id=activity_id,
            trigger_risks=trigger_risks or [],
            objectives=objectives or [],
            recommended_actions=recommended_actions or [],
            status="pending",
        )
        self.db.add(plan)
        self.db.commit()
        self.db.refresh(plan)

        logger.info(
            "Remediation plan created",
            extra={
                "plan_id": plan.id,
                "student_id": student_id,
                "teacher_id": teacher_id,
                "plan_type": plan_type,
            },
        )
        return plan

    def get_by_id(self, plan_id: str) -> Optional[RemediationPlanDB]:
        """Get plan by ID"""
        return (
            self.db.query(RemediationPlanDB)
            .filter(RemediationPlanDB.id == plan_id)
            .first()
        )

    def get_by_student(
        self, student_id: str, status: Optional[str] = None
    ) -> List[RemediationPlanDB]:
        """Get plans for student, optionally filtered by status"""
        query = self.db.query(RemediationPlanDB).filter(
            RemediationPlanDB.student_id == student_id
        )
        if status:
            query = query.filter(RemediationPlanDB.status == status)
        return query.order_by(desc(RemediationPlanDB.start_date)).all()

    def get_by_teacher(
        self, teacher_id: str, status: Optional[str] = None
    ) -> List[RemediationPlanDB]:
        """Get plans by teacher, optionally filtered by status"""
        query = self.db.query(RemediationPlanDB).filter(
            RemediationPlanDB.teacher_id == teacher_id
        )
        if status:
            query = query.filter(RemediationPlanDB.status == status)
        return query.order_by(desc(RemediationPlanDB.target_completion_date)).all()

    def update_status(
        self,
        plan_id: str,
        status: str,
        progress_notes: Optional[str] = None,
        completion_evidence: Optional[List[str]] = None,
    ) -> Optional[RemediationPlanDB]:
        """Update plan status"""
        plan = self.get_by_id(plan_id)
        if not plan:
            return None

        plan.status = status
        if progress_notes:
            plan.progress_notes = progress_notes
        if completion_evidence:
            plan.completion_evidence = completion_evidence

        if status == "completed":
            plan.actual_completion_date = datetime.utcnow()

        plan.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(plan)

        logger.info(
            "Remediation plan status updated",
            extra={"plan_id": plan.id, "status": status},
        )
        return plan

    def complete_plan(
        self,
        plan_id: str,
        outcome_evaluation: str,
        success_metrics: Optional[dict] = None,
    ) -> Optional[RemediationPlanDB]:
        """Complete a remediation plan with evaluation"""
        plan = self.get_by_id(plan_id)
        if not plan:
            return None

        plan.status = "completed"
        plan.actual_completion_date = datetime.utcnow()
        plan.outcome_evaluation = outcome_evaluation
        if success_metrics:
            plan.success_metrics = success_metrics

        plan.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(plan)

        logger.info(
            "Remediation plan completed",
            extra={"plan_id": plan.id, "success_metrics": success_metrics},
        )
        return plan


class RiskAlertRepository:
    """
    Repository for institutional risk alert operations

    SPRINT 5 - HU-DOC-010: Gestión de Riesgos Institucionales
    """

    def __init__(self, db_session: Session):
        self.db = db_session

    def create(
        self,
        alert_type: str,
        severity: str,
        scope: str,
        title: str,
        description: str,
        detection_rule: str,
        student_id: Optional[str] = None,
        activity_id: Optional[str] = None,
        course_id: Optional[str] = None,
        evidence: Optional[List[str]] = None,
        threshold_value: Optional[float] = None,
        actual_value: Optional[float] = None,
    ) -> RiskAlertDB:
        """
        Create a new risk alert

        Args:
            alert_type: Type of alert (critical_risk_surge, ai_dependency_spike, etc.)
            severity: Severity level (low, medium, high, critical)
            scope: Scope (student, activity, course, institution)
            title: Alert title
            description: Alert description
            detection_rule: Rule that triggered the alert
            student_id: Student ID (if scope=student)
            activity_id: Activity ID (if scope=activity)
            course_id: Course ID (if scope=course)
            evidence: Links to risks, sessions, traces
            threshold_value: Threshold value for detection rule
            actual_value: Actual value that triggered the alert

        Returns:
            Created RiskAlertDB instance
        """
        alert = RiskAlertDB(
            id=str(uuid4()),
            alert_type=alert_type,
            severity=severity,
            scope=scope,
            title=title,
            description=description,
            detection_rule=detection_rule,
            student_id=student_id,
            activity_id=activity_id,
            course_id=course_id,
            evidence=evidence or [],
            threshold_value=threshold_value,
            actual_value=actual_value,
            status="open",
        )
        self.db.add(alert)
        self.db.commit()
        self.db.refresh(alert)

        logger.warning(
            f"Risk alert created: {alert_type}",
            extra={
                "alert_id": alert.id,
                "severity": severity,
                "scope": scope,
                "student_id": student_id,
            },
        )
        return alert

    def get_by_id(self, alert_id: str) -> Optional[RiskAlertDB]:
        """Get alert by ID"""
        return self.db.query(RiskAlertDB).filter(RiskAlertDB.id == alert_id).first()

    def get_by_student(
        self, student_id: str, status: Optional[str] = None
    ) -> List[RiskAlertDB]:
        """Get alerts for student, optionally filtered by status"""
        query = self.db.query(RiskAlertDB).filter(
            RiskAlertDB.student_id == student_id
        )
        if status:
            query = query.filter(RiskAlertDB.status == status)
        return query.order_by(desc(RiskAlertDB.detected_at)).all()

    def get_by_course(
        self, course_id: str, status: Optional[str] = None
    ) -> List[RiskAlertDB]:
        """Get alerts for course, optionally filtered by status"""
        query = self.db.query(RiskAlertDB).filter(RiskAlertDB.course_id == course_id)
        if status:
            query = query.filter(RiskAlertDB.status == status)
        return query.order_by(desc(RiskAlertDB.detected_at)).all()

    def get_by_severity(
        self, severity: str, status: Optional[str] = "open"
    ) -> List[RiskAlertDB]:
        """Get alerts by severity level"""
        query = self.db.query(RiskAlertDB).filter(RiskAlertDB.severity == severity)
        if status:
            query = query.filter(RiskAlertDB.status == status)
        return query.order_by(desc(RiskAlertDB.detected_at)).all()

    def get_assigned_to(
        self, teacher_id: str, status: Optional[str] = None
    ) -> List[RiskAlertDB]:
        """Get alerts assigned to a teacher"""
        query = self.db.query(RiskAlertDB).filter(
            RiskAlertDB.assigned_to == teacher_id
        )
        if status:
            query = query.filter(RiskAlertDB.status == status)
        return query.order_by(desc(RiskAlertDB.detected_at)).all()

    def assign_to(self, alert_id: str, teacher_id: str) -> Optional[RiskAlertDB]:
        """Assign alert to a teacher"""
        alert = self.get_by_id(alert_id)
        if not alert:
            return None

        alert.assigned_to = teacher_id
        alert.assigned_at = datetime.utcnow()
        alert.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(alert)

        logger.info(
            "Risk alert assigned",
            extra={"alert_id": alert.id, "assigned_to": teacher_id},
        )
        return alert

    def acknowledge(
        self, alert_id: str, acknowledged_by: str
    ) -> Optional[RiskAlertDB]:
        """Acknowledge an alert"""
        alert = self.get_by_id(alert_id)
        if not alert:
            return None

        alert.status = "acknowledged"
        alert.acknowledged_at = datetime.utcnow()
        alert.acknowledged_by = acknowledged_by
        alert.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(alert)

        logger.info(
            "Risk alert acknowledged",
            extra={"alert_id": alert.id, "acknowledged_by": acknowledged_by},
        )
        return alert

    def resolve(
        self,
        alert_id: str,
        resolution_notes: str,
        remediation_plan_id: Optional[str] = None,
    ) -> Optional[RiskAlertDB]:
        """Resolve an alert"""
        alert = self.get_by_id(alert_id)
        if not alert:
            return None

        alert.status = "resolved"
        alert.resolution_notes = resolution_notes
        alert.resolved_at = datetime.utcnow()
        if remediation_plan_id:
            alert.remediation_plan_id = remediation_plan_id
        alert.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(alert)

        logger.info(
            "Risk alert resolved",
            extra={
                "alert_id": alert.id,
                "remediation_plan_id": remediation_plan_id,
            },
        )
        return alert

    def mark_false_positive(self, alert_id: str) -> Optional[RiskAlertDB]:
        """Mark alert as false positive"""
        alert = self.get_by_id(alert_id)
        if not alert:
            return None

        alert.status = "false_positive"
        alert.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(alert)

        logger.info(
            "Risk alert marked as false positive", extra={"alert_id": alert.id}
        )
        return alert


# =============================================================================
# SPRINT 6 REPOSITORIES: Professional Simulators & Advanced Features
# =============================================================================


class InterviewSessionRepository:
    """
    Repository for interview session operations

    SPRINT 6 - HU-EST-011: Enfrentar Entrevista Técnica Simulada (IT-IA)
    """

    def __init__(self, db_session: Session):
        self.db = db_session

    def create(
        self,
        session_id: str,
        student_id: str,
        interview_type: str,
        activity_id: Optional[str] = None,
        difficulty_level: str = "MEDIUM",
        questions_asked: Optional[List[dict]] = None,
    ) -> InterviewSessionDB:
        """
        Create a new interview session

        Args:
            session_id: Session ID
            student_id: Student ID
            interview_type: Type of interview (CONCEPTUAL, ALGORITHMIC, DESIGN, BEHAVIORAL)
            activity_id: Optional activity ID
            difficulty_level: Difficulty (EASY, MEDIUM, HARD)
            questions_asked: Initial questions

        Returns:
            Created InterviewSessionDB instance
        """
        interview = InterviewSessionDB(
            id=str(uuid4()),
            session_id=session_id,
            student_id=student_id,
            activity_id=activity_id,
            interview_type=interview_type,
            difficulty_level=difficulty_level,
            questions_asked=questions_asked or [],
            responses=[],
        )
        self.db.add(interview)
        self.db.commit()
        self.db.refresh(interview)

        logger.info(
            "Interview session created",
            extra={
                "interview_id": interview.id,
                "session_id": session_id,
                "interview_type": interview_type,
            },
        )
        return interview

    def add_question(
        self, interview_id: str, question: dict
    ) -> Optional[InterviewSessionDB]:
        """Add a question to an interview"""
        interview = self.get_by_id(interview_id)
        if not interview:
            return None

        interview.questions_asked = interview.questions_asked + [question]
        interview.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(interview)
        return interview

    def add_response(
        self, interview_id: str, response: dict
    ) -> Optional[InterviewSessionDB]:
        """Add a student response to an interview"""
        interview = self.get_by_id(interview_id)
        if not interview:
            return None

        interview.responses = interview.responses + [response]
        interview.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(interview)
        return interview

    def complete_interview(
        self,
        interview_id: str,
        evaluation_score: float,
        evaluation_breakdown: dict,
        feedback: str,
        duration_minutes: int,
    ) -> Optional[InterviewSessionDB]:
        """Complete an interview with final evaluation"""
        interview = self.get_by_id(interview_id)
        if not interview:
            return None

        interview.evaluation_score = evaluation_score
        interview.evaluation_breakdown = evaluation_breakdown
        interview.feedback = feedback
        interview.duration_minutes = duration_minutes
        interview.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(interview)

        logger.info(
            "Interview completed",
            extra={
                "interview_id": interview.id,
                "evaluation_score": evaluation_score,
            },
        )
        return interview

    def get_by_id(self, interview_id: str) -> Optional[InterviewSessionDB]:
        """Get interview by ID"""
        return (
            self.db.query(InterviewSessionDB)
            .filter(InterviewSessionDB.id == interview_id)
            .first()
        )

    def get_by_session(self, session_id: str) -> List[InterviewSessionDB]:
        """Get all interviews for a session"""
        return (
            self.db.query(InterviewSessionDB)
            .filter(InterviewSessionDB.session_id == session_id)
            .order_by(InterviewSessionDB.created_at)
            .all()
        )

    def get_by_student(
        self, student_id: str, limit: Optional[int] = None
    ) -> List[InterviewSessionDB]:
        """Get interviews by student"""
        query = (
            self.db.query(InterviewSessionDB)
            .filter(InterviewSessionDB.student_id == student_id)
            .order_by(desc(InterviewSessionDB.created_at))
        )
        if limit:
            query = query.limit(limit)
        return query.all()


class IncidentSimulationRepository:
    """
    Repository for incident simulation operations

    SPRINT 6 - HU-EST-012: Responder Incidente en Producción (IR-IA)
    """

    def __init__(self, db_session: Session):
        self.db = db_session

    def create(
        self,
        session_id: str,
        student_id: str,
        incident_type: str,
        incident_description: str,
        activity_id: Optional[str] = None,
        severity: str = "HIGH",
        simulated_logs: Optional[str] = None,
        simulated_metrics: Optional[dict] = None,
    ) -> IncidentSimulationDB:
        """
        Create a new incident simulation

        Args:
            session_id: Session ID
            student_id: Student ID
            incident_type: Type (API_ERROR, PERFORMANCE, SECURITY, DATABASE, DEPLOYMENT)
            incident_description: Description of the simulated incident
            activity_id: Optional activity ID
            severity: Severity (LOW, MEDIUM, HIGH, CRITICAL)
            simulated_logs: Simulated error logs
            simulated_metrics: Simulated monitoring metrics

        Returns:
            Created IncidentSimulationDB instance
        """
        incident = IncidentSimulationDB(
            id=str(uuid4()),
            session_id=session_id,
            student_id=student_id,
            activity_id=activity_id,
            incident_type=incident_type,
            severity=severity,
            incident_description=incident_description,
            simulated_logs=simulated_logs,
            simulated_metrics=simulated_metrics or {},
            diagnosis_process=[],
        )
        self.db.add(incident)
        self.db.commit()
        self.db.refresh(incident)

        logger.info(
            "Incident simulation created",
            extra={
                "incident_id": incident.id,
                "session_id": session_id,
                "incident_type": incident_type,
                "severity": severity,
            },
        )
        return incident

    def add_diagnosis_step(
        self, incident_id: str, diagnosis_step: dict
    ) -> Optional[IncidentSimulationDB]:
        """Add a diagnosis step to the incident"""
        incident = self.get_by_id(incident_id)
        if not incident:
            return None

        incident.diagnosis_process = incident.diagnosis_process + [diagnosis_step]
        incident.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(incident)
        return incident

    def complete_incident(
        self,
        incident_id: str,
        solution_proposed: str,
        root_cause_identified: str,
        time_to_diagnose_minutes: int,
        time_to_resolve_minutes: int,
        post_mortem: str,
        evaluation: dict,
    ) -> Optional[IncidentSimulationDB]:
        """Complete an incident with solution and evaluation"""
        incident = self.get_by_id(incident_id)
        if not incident:
            return None

        incident.solution_proposed = solution_proposed
        incident.root_cause_identified = root_cause_identified
        incident.time_to_diagnose_minutes = time_to_diagnose_minutes
        incident.time_to_resolve_minutes = time_to_resolve_minutes
        incident.post_mortem = post_mortem
        incident.evaluation = evaluation
        incident.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(incident)

        logger.info(
            "Incident simulation completed",
            extra={
                "incident_id": incident.id,
                "time_to_resolve": time_to_resolve_minutes,
            },
        )
        return incident

    def get_by_id(self, incident_id: str) -> Optional[IncidentSimulationDB]:
        """Get incident by ID"""
        return (
            self.db.query(IncidentSimulationDB)
            .filter(IncidentSimulationDB.id == incident_id)
            .first()
        )

    def get_by_session(self, session_id: str) -> List[IncidentSimulationDB]:
        """Get all incidents for a session"""
        return (
            self.db.query(IncidentSimulationDB)
            .filter(IncidentSimulationDB.session_id == session_id)
            .order_by(IncidentSimulationDB.created_at)
            .all()
        )

    def get_by_student(
        self, student_id: str, limit: Optional[int] = None
    ) -> List[IncidentSimulationDB]:
        """Get incidents by student"""
        query = (
            self.db.query(IncidentSimulationDB)
            .filter(IncidentSimulationDB.student_id == student_id)
            .order_by(desc(IncidentSimulationDB.created_at))
        )
        if limit:
            query = query.limit(limit)
        return query.all()


class LTIDeploymentRepository:
    """
    Repository for LTI deployment operations

    SPRINT 6 - HU-SYS-010: Integración LTI con Moodle
    """

    def __init__(self, db_session: Session):
        self.db = db_session

    def create(
        self,
        platform_name: str,
        issuer: str,
        client_id: str,
        deployment_id: str,
        auth_login_url: str,
        auth_token_url: str,
        public_keyset_url: str,
        access_token_url: Optional[str] = None,
    ) -> LTIDeploymentDB:
        """
        Create a new LTI deployment

        Args:
            platform_name: Platform name (Moodle, Canvas, etc.)
            issuer: LTI issuer URL
            client_id: OAuth2 client ID
            deployment_id: LTI deployment ID
            auth_login_url: OIDC auth login URL
            auth_token_url: OAuth2 token URL
            public_keyset_url: JWKS URL
            access_token_url: Optional access token URL

        Returns:
            Created LTIDeploymentDB instance
        """
        deployment = LTIDeploymentDB(
            id=str(uuid4()),
            platform_name=platform_name,
            issuer=issuer,
            client_id=client_id,
            deployment_id=deployment_id,
            auth_login_url=auth_login_url,
            auth_token_url=auth_token_url,
            public_keyset_url=public_keyset_url,
            access_token_url=access_token_url,
            is_active=True,
        )
        self.db.add(deployment)
        self.db.commit()
        self.db.refresh(deployment)

        logger.info(
            "LTI deployment created",
            extra={
                "deployment_db_id": deployment.id,
                "platform_name": platform_name,
                "issuer": issuer,
                "deployment_id": deployment_id,
            },
        )
        return deployment

    def get_by_id(self, deployment_db_id: str) -> Optional[LTIDeploymentDB]:
        """Get deployment by database ID"""
        return (
            self.db.query(LTIDeploymentDB)
            .filter(LTIDeploymentDB.id == deployment_db_id)
            .first()
        )

    def get_by_issuer_and_deployment(
        self, issuer: str, deployment_id: str
    ) -> Optional[LTIDeploymentDB]:
        """Get deployment by issuer + deployment_id (unique constraint)"""
        return (
            self.db.query(LTIDeploymentDB)
            .filter(
                LTIDeploymentDB.issuer == issuer,
                LTIDeploymentDB.deployment_id == deployment_id,
            )
            .first()
        )

    def get_active_deployments(self) -> List[LTIDeploymentDB]:
        """Get all active LTI deployments"""
        return (
            self.db.query(LTIDeploymentDB)
            .filter(LTIDeploymentDB.is_active == True)
            .order_by(LTIDeploymentDB.platform_name)
            .all()
        )

    def deactivate(self, deployment_db_id: str) -> Optional[LTIDeploymentDB]:
        """Deactivate an LTI deployment"""
        deployment = self.get_by_id(deployment_db_id)
        if not deployment:
            return None

        deployment.is_active = False
        deployment.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(deployment)

        logger.info(
            "LTI deployment deactivated",
            extra={"deployment_db_id": deployment.id},
        )
        return deployment


class LTISessionRepository:
    """
    Repository for LTI session operations

    SPRINT 6 - HU-SYS-010: Integración LTI con Moodle
    """

    def __init__(self, db_session: Session):
        self.db = db_session

    def create(
        self,
        deployment_id: str,
        lti_user_id: str,
        resource_link_id: str,
        lti_user_name: Optional[str] = None,
        lti_user_email: Optional[str] = None,
        lti_context_id: Optional[str] = None,
        lti_context_label: Optional[str] = None,
        lti_context_title: Optional[str] = None,
        session_id: Optional[str] = None,
        launch_token: Optional[str] = None,
        locale: Optional[str] = None,
    ) -> LTISessionDB:
        """
        Create a new LTI session

        Args:
            deployment_id: LTI deployment ID (FK)
            lti_user_id: User ID from Moodle
            resource_link_id: Resource link ID from LTI launch
            lti_user_name: Optional user name
            lti_user_email: Optional user email
            lti_context_id: Optional course ID
            lti_context_label: Optional course code
            lti_context_title: Optional course name
            session_id: Mapped AI-Native session ID
            launch_token: JWT token from LTI launch
            locale: User's locale

        Returns:
            Created LTISessionDB instance
        """
        lti_session = LTISessionDB(
            id=str(uuid4()),
            deployment_id=deployment_id,
            lti_user_id=lti_user_id,
            lti_user_name=lti_user_name,
            lti_user_email=lti_user_email,
            lti_context_id=lti_context_id,
            lti_context_label=lti_context_label,
            lti_context_title=lti_context_title,
            resource_link_id=resource_link_id,
            session_id=session_id,
            launch_token=launch_token,
            locale=locale,
        )
        self.db.add(lti_session)
        self.db.commit()
        self.db.refresh(lti_session)

        logger.info(
            "LTI session created",
            extra={
                "lti_session_id": lti_session.id,
                "lti_user_id": lti_user_id,
                "session_id": session_id,
            },
        )
        return lti_session

    def get_by_id(self, lti_session_id: str) -> Optional[LTISessionDB]:
        """Get LTI session by ID"""
        return (
            self.db.query(LTISessionDB)
            .filter(LTISessionDB.id == lti_session_id)
            .first()
        )

    def get_by_session_id(self, session_id: str) -> Optional[LTISessionDB]:
        """Get LTI session by AI-Native session ID"""
        return (
            self.db.query(LTISessionDB)
            .filter(LTISessionDB.session_id == session_id)
            .first()
        )

    def get_by_lti_user(self, lti_user_id: str) -> List[LTISessionDB]:
        """Get all LTI sessions for a user"""
        return (
            self.db.query(LTISessionDB)
            .filter(LTISessionDB.lti_user_id == lti_user_id)
            .order_by(desc(LTISessionDB.created_at))
            .all()
        )

    def link_to_session(
        self, lti_session_id: str, session_id: str
    ) -> Optional[LTISessionDB]:
        """Link LTI session to AI-Native session"""
        lti_session = self.get_by_id(lti_session_id)
        if not lti_session:
            return None

        lti_session.session_id = session_id
        lti_session.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(lti_session)

        logger.info(
            "LTI session linked to AI-Native session",
            extra={"lti_session_id": lti_session.id, "session_id": session_id},
        )
        return lti_session
