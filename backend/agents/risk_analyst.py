"""
Submodelo 4: Analista de Riesgo Cognitivo y Ético (AR-IA)

Supervisa, detecta y clasifica riesgos cognitivos, éticos y epistémicos
"""
from typing import Optional, Dict, Any, List
from datetime import datetime

from ..models.trace import CognitiveTrace, TraceSequence, InteractionType
from ..models.risk import Risk, RiskType, RiskLevel, RiskDimension, RiskReport


class AnalistaRiesgoAgent:
    """
    AR-IA: Analista de Riesgo Cognitivo y Ético

    Monitorea 5 dimensiones de riesgo:
    1. Riesgos Cognitivos (RC): delegación, razonamiento superficial
    2. Riesgos Éticos (RE): integridad académica
    3. Riesgos Epistémicos (REp): errores conceptuales, aceptación acrítica
    4. Riesgos Técnicos (RT): vulnerabilidades, mala calidad
    5. Riesgos de Gobernanza (RG): violación de políticas

    Basado en:
    - UNESCO (2021), OECD (2019), IEEE (2019)
    - ISO/IEC 23894:2023 (Risk Management in AI)
    - ISO/IEC 42001:2023 (AI Management System)
    """

    def __init__(self, llm_provider=None, config: Optional[Dict[str, Any]] = None):
        self.llm_provider = llm_provider
        self.config = config or {}

        # Umbrales de riesgo configurables
        self.thresholds = {
            "ai_dependency": self.config.get("ai_dependency_threshold", 0.7),
            "delegation_consecutive": self.config.get("delegation_threshold", 3),
            "no_justification_ratio": self.config.get("no_justification_threshold", 0.6),
        }

    def analyze_session(
        self,
        trace_sequence: TraceSequence,
        context: Optional[Dict[str, Any]] = None
    ) -> RiskReport:
        """
        Analiza una sesión completa y genera reporte de riesgos

        Args:
            trace_sequence: Secuencia de trazas a analizar
            context: Contexto adicional

        Returns:
            RiskReport con todos los riesgos detectados
        """
        report = RiskReport(
            id=f"risk_report_{trace_sequence.id}",
            student_id=trace_sequence.student_id,
            activity_id=trace_sequence.activity_id
        )

        # Analizar cada dimensión de riesgo
        self._analyze_cognitive_risks(trace_sequence, report)
        self._analyze_ethical_risks(trace_sequence, report)
        self._analyze_epistemic_risks(trace_sequence, report)
        self._analyze_technical_risks(trace_sequence, report)
        self._analyze_governance_risks(trace_sequence, report)

        # Generar evaluación general
        report.overall_assessment = self._generate_overall_assessment(report)
        report.priority_interventions = self._generate_priority_interventions(report)
        report.trends = self._analyze_trends(trace_sequence)

        return report

    def _analyze_cognitive_risks(
        self,
        trace_sequence: TraceSequence,
        report: RiskReport
    ) -> None:
        """Analiza riesgos cognitivos (RC)"""
        traces = trace_sequence.traces

        # RC1: Delegación total
        delegation_count = self._count_delegation_attempts(traces)
        if delegation_count >= self.thresholds["delegation_consecutive"]:
            risk = Risk(
                id=f"risk_cog_delegation_{trace_sequence.id}",
                session_id=trace_sequence.session_id,
                student_id=trace_sequence.student_id,
                activity_id=trace_sequence.activity_id,
                risk_type=RiskType.COGNITIVE_DELEGATION,
                risk_level=RiskLevel.HIGH,
                dimension=RiskDimension.COGNITIVE,
                description=(
                    f"Se detectaron {delegation_count} intentos de delegación total "
                    "sin descomposición del problema"
                ),
                evidence=[
                    t.content for t in traces
                    if self._is_delegation(t.content)
                ][:3],
                trace_ids=[t.id for t in traces if self._is_delegation(t.content)],
                root_cause="Tendencia a delegar la resolución completa a la IA",
                recommendations=[
                    "Solicitar descomposición explícita del problema",
                    "Exigir justificación de cada paso",
                    "Reducir nivel de ayuda del tutor temporalmente"
                ],
                pedagogical_intervention=(
                    "Modo socrático estricto: solo preguntas, sin pistas directas"
                )
            )
            report.add_risk(risk)

        # RC2: Dependencia excesiva de IA
        if trace_sequence.ai_dependency_score > self.thresholds["ai_dependency"]:
            risk = Risk(
                id=f"risk_cog_dependency_{trace_sequence.id}",
                session_id=trace_sequence.session_id,
                student_id=trace_sequence.student_id,
                activity_id=trace_sequence.activity_id,
                risk_type=RiskType.AI_DEPENDENCY,
                risk_level=RiskLevel.MEDIUM,
                dimension=RiskDimension.COGNITIVE,
                description=(
                    f"Nivel de dependencia de IA alto: "
                    f"{trace_sequence.ai_dependency_score:.2%}"
                ),
                evidence=[],
                trace_ids=[],
                recommendations=[
                    "Fomentar resolución autónoma con menos asistencia de IA",
                    "Asignar ejercicios sin acceso a IA para desarrollar autonomía"
                ]
            )
            report.add_risk(risk)

        # RC3: Falta de justificación
        justification_ratio = self._calculate_justification_ratio(traces)
        if justification_ratio < (1 - self.thresholds["no_justification_ratio"]):
            risk = Risk(
                id=f"risk_cog_justification_{trace_sequence.id}",
                session_id=trace_sequence.session_id,
                student_id=trace_sequence.student_id,
                activity_id=trace_sequence.activity_id,
                risk_type=RiskType.LACK_JUSTIFICATION,
                risk_level=RiskLevel.MEDIUM,
                dimension=RiskDimension.COGNITIVE,
                description=(
                    f"Baja tasa de justificación de decisiones: "
                    f"{justification_ratio:.2%}"
                ),
                evidence=[],
                trace_ids=[],
                recommendations=[
                    "Exigir explícitamente justificaciones",
                    "Usar rúbricas que valoren el razonamiento sobre el código"
                ]
            )
            report.add_risk(risk)

    def _analyze_ethical_risks(
        self,
        trace_sequence: TraceSequence,
        report: RiskReport
    ) -> None:
        """Analiza riesgos éticos (RE)"""
        # Placeholder - en producción incluiría detección más sofisticada
        traces = trace_sequence.traces

        # RE1: Uso no declarado de IA
        # Este requeriría comparación con entregas vs. trazas
        pass

    def _analyze_epistemic_risks(
        self,
        trace_sequence: TraceSequence,
        report: RiskReport
    ) -> None:
        """Analiza riesgos epistémicos (REp)"""
        traces = trace_sequence.traces

        # REp1: Aceptación acrítica de salidas de IA
        uncritical_acceptance_count = sum(
            1 for t in traces
            if t.interaction_type == InteractionType.AI_RESPONSE
            and not any(
                followup.interaction_type == InteractionType.AI_CRITIQUE
                for followup in traces
                if followup.timestamp > t.timestamp
            )
        )

        if uncritical_acceptance_count > 3:
            risk = Risk(
                id=f"risk_epis_uncritical_{trace_sequence.id}",
                session_id=trace_sequence.session_id,
                student_id=trace_sequence.student_id,
                activity_id=trace_sequence.activity_id,
                risk_type=RiskType.UNCRITICAL_ACCEPTANCE,
                risk_level=RiskLevel.MEDIUM,
                dimension=RiskDimension.EPISTEMIC,
                description=(
                    f"Aceptación acrítica de {uncritical_acceptance_count} "
                    "respuestas de IA sin cuestionamiento"
                ),
                evidence=[],
                trace_ids=[],
                recommendations=[
                    "Promover revisión crítica de salidas de IA",
                    "Solicitar que identifique posibles errores en respuestas de IA"
                ]
            )
            report.add_risk(risk)

    def _analyze_technical_risks(
        self,
        trace_sequence: TraceSequence,
        report: RiskReport
    ) -> None:
        """Analiza riesgos técnicos (RT)"""
        # Placeholder - en producción incluiría análisis estático de código
        pass

    def _analyze_governance_risks(
        self,
        trace_sequence: TraceSequence,
        report: RiskReport
    ) -> None:
        """Analiza riesgos de gobernanza (RG)"""
        # Placeholder - verifica cumplimiento de políticas institucionales
        pass

    def _is_delegation(self, content: str) -> bool:
        """Detecta si un prompt es delegación total"""
        delegation_signals = [
            "dame el código completo",
            "hacé todo",
            "resolvelo por mí",
            "código entero",
            "implementa todo",
            "haceme"
        ]
        return any(signal in content.lower() for signal in delegation_signals)

    def _count_delegation_attempts(self, traces: List[CognitiveTrace]) -> int:
        """Cuenta intentos de delegación"""
        return sum(1 for t in traces if self._is_delegation(t.content))

    def _calculate_justification_ratio(self, traces: List[CognitiveTrace]) -> float:
        """Calcula ratio de decisiones con justificación"""
        if not traces:
            return 0.0

        with_justification = sum(
            1 for t in traces
            if t.decision_justification is not None and t.decision_justification != ""
        )

        return with_justification / len(traces)

    def _generate_overall_assessment(self, report: RiskReport) -> str:
        """Genera evaluación general del perfil de riesgo"""
        if report.critical_risks > 0:
            return "CRÍTICO: Requiere intervención docente inmediata"
        elif report.high_risks > 2:
            return "ALTO: Requiere atención prioritaria y ajuste de estrategia pedagógica"
        elif report.high_risks > 0 or report.medium_risks > 3:
            return "MODERADO: Monitorear evolución y aplicar intervenciones preventivas"
        else:
            return "BAJO: Proceso dentro de parámetros esperados"

    def _generate_priority_interventions(self, report: RiskReport) -> List[str]:
        """Genera intervenciones prioritarias"""
        interventions = []

        # Priorizar por nivel
        critical_risks = [r for r in report.risks if r.risk_level == RiskLevel.CRITICAL]
        high_risks = [r for r in report.risks if r.risk_level == RiskLevel.HIGH]

        for risk in critical_risks + high_risks[:3]:  # Top 3 high risks
            if risk.pedagogical_intervention:
                interventions.append(risk.pedagogical_intervention)
            else:
                interventions.extend(risk.recommendations[:1])

        return interventions

    def _analyze_trends(self, trace_sequence: TraceSequence) -> Dict[str, Any]:
        """Analiza tendencias en el comportamiento del estudiante"""
        traces = trace_sequence.traces

        if len(traces) < 10:
            return {"insufficient_data": True}

        # Dividir en mitades para detectar mejora/empeoramiento
        mid = len(traces) // 2
        first_half = traces[:mid]
        second_half = traces[mid:]

        delegation_first = sum(1 for t in first_half if self._is_delegation(t.content))
        delegation_second = sum(1 for t in second_half if self._is_delegation(t.content))

        return {
            "delegation_trend": (
                "mejorando" if delegation_second < delegation_first
                else "empeorando" if delegation_second > delegation_first
                else "estable"
            ),
            "delegation_first_half": delegation_first,
            "delegation_second_half": delegation_second,
        }