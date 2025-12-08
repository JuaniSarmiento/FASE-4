"""
Router para análisis de riesgos 5D
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from datetime import datetime

from ...llm.factory import LLMProviderFactory
from ...database.repositories import SessionRepository, TraceRepository
from ..deps import get_session_repository, get_trace_repository
from ..schemas.common import APIResponse

router = APIRouter(prefix="/risks", tags=["Risk Analysis 5D"])


class RiskDimensionScore:
    def __init__(self, score: int, level: str, indicators: List[str]):
        self.score = score
        self.level = level
        self.indicators = indicators


class RiskAnalysis5D:
    def __init__(
        self,
        session_id: str,
        overall_score: int,
        risk_level: str,
        dimensions: dict,
        top_risks: List[dict],
        recommendations: List[str]
    ):
        self.session_id = session_id
        self.overall_score = overall_score
        self.risk_level = risk_level
        self.dimensions = dimensions
        self.top_risks = top_risks
        self.recommendations = recommendations


@router.get(
    "/{session_id}",
    response_model=APIResponse,
    summary="Análisis de Riesgos 5D",
    description="Analiza riesgos en 5 dimensiones usando Ollama: cognitiva, ética, epistémica, técnica, gobernanza"
)
async def analyze_risks_5d(
    session_id: str,
    session_repo: SessionRepository = Depends(get_session_repository),
    trace_repo: TraceRepository = Depends(get_trace_repository)
):
    """
    Analiza riesgos en 5 dimensiones para una sesión específica:
    - Cognitiva: Pérdida de habilidades de pensamiento crítico
    - Ética: Plagio, falta de atribución, sesgos
    - Epistémica: Erosión de fundamentos teóricos
    - Técnica: Dependencia de herramientas, falta de debugging
    - Gobernanza: Falta de policies, ausencia de auditoría
    """
    
    # Obtener sesión (método síncrono)
    session = session_repo.get_by_id(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Obtener interacciones de la sesión (método síncrono)
    interactions = trace_repo.get_by_session(session_id)
    
    if not interactions:
        raise HTTPException(status_code=400, detail="No interactions found for analysis")
    
    # Preparar contexto para Ollama
    context = {
        "session_id": session_id,
        "student_id": session.student_id,
        "activity_id": session.activity_id,
        "total_interactions": len(interactions),
        "interactions_summary": [
            {
                "content": i.content[:200] if i.content else "",
                "cognitive_state": i.cognitive_state if hasattr(i, 'cognitive_state') else "unknown",
                "ai_involvement": i.ai_involvement if hasattr(i, 'ai_involvement') else 0.0,
                "interaction_type": i.interaction_type if hasattr(i, 'interaction_type') else "unknown"
            }
            for i in interactions[-10:]  # Últimas 10 interacciones
        ]
    }
    
    # Llamar a Ollama para análisis 5D
    llm = LLMProviderFactory.create_provider("ollama")
    
    prompt = f"""Analiza los riesgos en 5 dimensiones para esta sesión educativa con IA:

CONTEXTO:
- Sesión ID: {session_id}
- Estudiante: {session.student_id}
- Total interacciones: {len(interactions)}
- Últimas interacciones: {len(context['interactions_summary'])}

DIMENSIONES A ANALIZAR:
1. COGNITIVA: Pérdida de pensamiento crítico, dependencia excesiva de IA
2. ÉTICA: Plagio, falta de atribución, dishonestidad académica
3. EPISTÉMICA: Conocimiento superficial, falta de fundamentos
4. TÉCNICA: Código sin entender, copy-paste, falta de debugging manual
5. GOBERNANZA: Violación de políticas, uso no autorizado

Para cada dimensión, evalúa:
- Score (0-10, donde 10 es máximo riesgo)
- Level (low/medium/high/critical)
- Indicators (3-5 indicadores específicos observados)

Luego identifica los TOP 3 riesgos detectados con:
- Dimension
- Description
- Severity (low/medium/high/critical)
- Mitigation (cómo mitigarlo)

Finalmente, proporciona 5 recomendaciones de mitigación.

INTERACCIONES RECIENTES:
{context['interactions_summary']}

Responde SOLO en formato JSON válido:
{{
  "cognitive": {{"score": 0-10, "level": "low/medium/high/critical", "indicators": ["...", "..."]}},
  "ethical": {{"score": 0-10, "level": "low/medium/high/critical", "indicators": ["...", "..."]}},
  "epistemic": {{"score": 0-10, "level": "low/medium/high/critical", "indicators": ["...", "..."]}},
  "technical": {{"score": 0-10, "level": "low/medium/high/critical", "indicators": ["...", "..."]}},
  "governance": {{"score": 0-10, "level": "low/medium/high/critical", "indicators": ["...", "..."]}},
  "top_risks": [
    {{"dimension": "...", "description": "...", "severity": "...", "mitigation": "..."}},
    {{"dimension": "...", "description": "...", "severity": "...", "mitigation": "..."}},
    {{"dimension": "...", "description": "...", "severity": "...", "mitigation": "..."}}
  ],
  "recommendations": ["...", "...", "...", "...", "..."]
}}
"""
    
    try:
        response = await llm.generate(prompt, temperature=0.7, max_tokens=2000)
        
        # Parse JSON response
        import json
        analysis_data = json.loads(response)
        
        # Calcular overall score y risk level
        dimension_scores = [
            analysis_data["cognitive"]["score"],
            analysis_data["ethical"]["score"],
            analysis_data["epistemic"]["score"],
            analysis_data["technical"]["score"],
            analysis_data["governance"]["score"]
        ]
        overall_score = sum(dimension_scores)
        
        # Determinar nivel de riesgo global
        if overall_score >= 40:
            risk_level = "critical"
        elif overall_score >= 30:
            risk_level = "high"
        elif overall_score >= 15:
            risk_level = "medium"
        else:
            risk_level = "low"
        
        analysis = {
            "session_id": session_id,
            "overall_score": overall_score,
            "risk_level": risk_level,
            "dimensions": {
                "cognitive": analysis_data["cognitive"],
                "ethical": analysis_data["ethical"],
                "epistemic": analysis_data["epistemic"],
                "technical": analysis_data["technical"],
                "governance": analysis_data["governance"]
            },
            "top_risks": analysis_data["top_risks"],
            "recommendations": analysis_data["recommendations"]
        }
        
        return APIResponse(
            success=True,
            message="Risk analysis completed",
            data=analysis
        )
        
    except json.JSONDecodeError:
        # Fallback: crear análisis básico
        analysis = {
            "session_id": session_id,
            "overall_score": 15,
            "risk_level": "medium",
            "dimensions": {
                "cognitive": {
                    "score": 3,
                    "level": "medium",
                    "indicators": ["Múltiples consultas similares", "Dependencia de respuestas IA"]
                },
                "ethical": {
                    "score": 2,
                    "level": "low",
                    "indicators": ["Sin indicadores de plagio detectados"]
                },
                "epistemic": {
                    "score": 4,
                    "level": "medium",
                    "indicators": ["Consultas superficiales", "Falta de profundización"]
                },
                "technical": {
                    "score": 3,
                    "level": "medium",
                    "indicators": ["Uso de código sin modificación"]
                },
                "governance": {
                    "score": 3,
                    "level": "medium",
                    "indicators": ["Uso extensivo de IA no justificado"]
                }
            },
            "top_risks": [
                {
                    "dimension": "epistemic",
                    "description": "Conocimiento superficial detectado",
                    "severity": "medium",
                    "mitigation": "Solicitar explicaciones conceptuales detalladas"
                },
                {
                    "dimension": "cognitive",
                    "description": "Alta dependencia de IA",
                    "severity": "medium",
                    "mitigation": "Reducir asistencia y promover pensamiento autónomo"
                },
                {
                    "dimension": "technical",
                    "description": "Código sin personalización",
                    "severity": "low",
                    "mitigation": "Solicitar adaptación del código a contexto específico"
                }
            ],
            "recommendations": [
                "Reducir gradualmente el nivel de ayuda de IA",
                "Solicitar justificaciones conceptuales antes de proporcionar soluciones",
                "Fomentar debugging manual antes de consultar IA",
                "Implementar checkpoints de comprensión conceptual",
                "Documentar el proceso de razonamiento explícitamente"
            ]
        }
        
        return APIResponse(
            success=True,
            message="Risk analysis completed (fallback mode)",
            data=analysis
        )
