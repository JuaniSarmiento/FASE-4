"""
Modelos para el sistema de Análisis de Riesgo (AR-IA)
"""
from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class RiskType(str, Enum):
    """Tipos de riesgo según AR-IA"""
    # Riesgos Cognitivos (RC)
    COGNITIVE_DELEGATION = "cognitive_delegation"  # Delegación total
    SUPERFICIAL_REASONING = "superficial_reasoning"  # Razonamiento superficial
    AI_DEPENDENCY = "ai_dependency"  # Dependencia excesiva
    LACK_JUSTIFICATION = "lack_justification"  # Falta de justificación
    NO_SELF_REGULATION = "no_self_regulation"  # Sin autorregulación

    # Riesgos Éticos (RE)
    ACADEMIC_INTEGRITY = "academic_integrity"  # Integridad académica
    UNDISCLOSED_AI_USE = "undisclosed_ai_use"  # Uso no declarado
    PLAGIARISM = "plagiarism"  # Plagio

    # Riesgos Epistémicos (REp)
    CONCEPTUAL_ERROR = "conceptual_error"  # Error conceptual
    LOGICAL_FALLACY = "logical_fallacy"  # Falacia lógica
    UNCRITICAL_ACCEPTANCE = "uncritical_acceptance"  # Aceptación acrítica

    # Riesgos Técnicos (RT)
    SECURITY_VULNERABILITY = "security_vulnerability"  # Vulnerabilidad
    POOR_CODE_QUALITY = "poor_code_quality"  # Baja calidad
    ARCHITECTURAL_FLAW = "architectural_flaw"  # Fallo arquitectónico

    # Riesgos de Gobernanza (RG)
    POLICY_VIOLATION = "policy_violation"  # Violación de políticas
    UNAUTHORIZED_USE = "unauthorized_use"  # Uso no autorizado


class RiskLevel(str, Enum):
    """Nivel de severidad del riesgo"""
    CRITICAL = "critical"  # Requiere intervención inmediata
    HIGH = "high"  # Requiere atención prioritaria
    MEDIUM = "medium"  # Monitorear y guiar
    LOW = "low"  # Informativo
    INFO = "info"  # Solo registro


class RiskDimension(str, Enum):
    """Dimensiones de riesgo según ISO/IEC 23894"""
    COGNITIVE = "cognitive"  # Riesgos cognitivos (RC)
    ETHICAL = "ethical"  # Riesgos éticos (RE)
    EPISTEMIC = "epistemic"  # Riesgos epistémicos (REp)
    TECHNICAL = "technical"  # Riesgos técnicos (RT)
    GOVERNANCE = "governance"  # Riesgos de gobernanza (RG)


class Risk(BaseModel):
    """
    Representa un riesgo detectado por el AR-IA

    FIXED (2025-11-21): session_id es ahora REQUIRED.
    Un riesgo sin sesión carece de contexto válido (no se puede determinar
    el momento en que ocurrió, las trazas relacionadas, ni el flujo cognitivo).
    """
    id: str = Field(description="ID único del riesgo")
    session_id: str = Field(description="ID de la sesión (REQUERIDO para contexto)")
    timestamp: datetime = Field(default_factory=datetime.now)
    student_id: str = Field(description="ID del estudiante")
    activity_id: str = Field(description="ID de la actividad")

    # Clasificación del riesgo
    risk_type: RiskType = Field(description="Tipo de riesgo")
    risk_level: RiskLevel = Field(description="Nivel de severidad")
    dimension: RiskDimension = Field(description="Dimensión del riesgo")

    # Descripción
    description: str = Field(description="Descripción del riesgo detectado")
    impact: Optional[str] = Field(None, description="Impacto del riesgo")
    evidence: List[str] = Field(default_factory=list, description="Evidencias del riesgo")
    trace_ids: List[str] = Field(default_factory=list, description="IDs de trazas relacionadas")

    # Análisis
    root_cause: Optional[str] = Field(None, description="Causa raíz identificada")
    impact_assessment: Optional[str] = Field(None, description="Evaluación del impacto")

    # Recomendaciones
    recommendations: List[str] = Field(default_factory=list, description="Recomendaciones")
    pedagogical_intervention: Optional[str] = Field(
        None,
        description="Intervención pedagógica sugerida"
    )

    # Estado
    resolved: bool = Field(False, description="Si el riesgo fue resuelto")
    resolution_notes: Optional[str] = Field(None, description="Notas de resolución")

    # Metadata
    detected_by: str = Field(default="AR-IA", description="Agente que detectó el riesgo")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "risk_001",
                "student_id": "student_123",
                "activity_id": "prog2_tp1",
                "risk_type": "cognitive_delegation",
                "risk_level": "high",
                "description": "El estudiante solicitó código completo sin descomposición",
                "evidence": ["Prompt: 'Dame todo el código completo'"],
                "recommendations": [
                    "Solicitar descomposición del problema",
                    "Pedir justificación de enfoque"
                ]
            }
        }


class RiskReport(BaseModel):
    """
    Reporte agregado de riesgos para un estudiante/actividad
    """
    id: str = Field(description="ID del reporte")
    timestamp: datetime = Field(default_factory=datetime.now)
    student_id: str = Field(description="ID del estudiante")
    activity_id: Optional[str] = Field(None, description="ID de actividad (opcional)")

    # Estadísticas
    total_risks: int = Field(0, description="Total de riesgos")
    critical_risks: int = Field(0, description="Riesgos críticos")
    high_risks: int = Field(0, description="Riesgos altos")
    medium_risks: int = Field(0, description="Riesgos medios")
    low_risks: int = Field(0, description="Riesgos bajos")

    # Distribución por tipo
    risk_distribution: Dict[str, int] = Field(
        default_factory=dict,
        description="Distribución de riesgos por tipo"
    )

    # Riesgos individuales
    risks: List[Risk] = Field(default_factory=list, description="Lista de riesgos")

    # Análisis agregado
    overall_assessment: Optional[str] = Field(None, description="Evaluación general")
    priority_interventions: List[str] = Field(
        default_factory=list,
        description="Intervenciones prioritarias"
    )
    trends: Dict[str, Any] = Field(default_factory=dict, description="Tendencias observadas")

    def add_risk(self, risk: Risk) -> None:
        """Añade un riesgo al reporte"""
        self.risks.append(risk)
        self.total_risks += 1

        # Actualizar contadores por nivel
        if risk.risk_level == RiskLevel.CRITICAL:
            self.critical_risks += 1
        elif risk.risk_level == RiskLevel.HIGH:
            self.high_risks += 1
        elif risk.risk_level == RiskLevel.MEDIUM:
            self.medium_risks += 1
        elif risk.risk_level == RiskLevel.LOW:
            self.low_risks += 1

        # Actualizar distribución por tipo
        risk_type_str = risk.risk_type.value
        self.risk_distribution[risk_type_str] = (
            self.risk_distribution.get(risk_type_str, 0) + 1
        )