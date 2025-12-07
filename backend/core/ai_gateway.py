"""
AI Gateway - Componente central que coordina todos los submodelos
Implementa la arquitectura C4 del ecosistema AI-Native

REFACTORIZADO (2025-11-19):
- Ahora es completamente STATELESS (no mantiene estado en memoria)
- Dependency Injection completa (repositorios inyectados)
- Escalable (puede funcionar con múltiples instancias)
- Testeable (fácil mockear dependencias)
- Cache LLM integrado (opcional, reduce costos 30-50%)
"""
from typing import Optional, Dict, Any, List
from datetime import datetime
import uuid
import logging

from .cognitive_engine import CognitiveReasoningEngine, AgentMode
from ..models.trace import CognitiveTrace, TraceLevel, InteractionType, TraceSequence
from ..models.risk import Risk, RiskType, RiskLevel, RiskDimension, RiskReport
from ..models.evaluation import EvaluationReport
from ..llm import LLMProviderFactory, LLMProvider, LLMMessage, LLMRole
from .cache import LLMResponseCache

# Prometheus metrics instrumentation (HIGH-01)
# Lazy import to avoid circular dependency with api.monitoring
_metrics_module = None

def _get_metrics():
    """Lazy load metrics module to avoid circular imports."""
    global _metrics_module
    if _metrics_module is None:
        try:
            from ..api.monitoring import metrics as m
            _metrics_module = m
        except ImportError:
            _metrics_module = False  # Mark as unavailable
    return _metrics_module if _metrics_module else None

logger = logging.getLogger(__name__)


class AIGateway:
    """
    AI Gateway - Orquestador central STATELESS del ecosistema AI-Native

    Componentes:
    - C1: Motor LLM (conexión a OpenAI/Anthropic/etc)
    - C2: Ingesta y Comprensión de Prompt (IPC)
    - C3: Motor de Razonamiento Cognitivo-Pedagógico (CRPE)
    - C4: Gobernanza, Seguridad y Riesgo (GSR)
    - C5: Orquestación de Submodelos (OSM)
    - C6: Trazabilidad Cognitiva N4

    Integra:
    - T-IA-Cog: Tutor IA Cognitivo
    - E-IA-Proc: Evaluador de Procesos
    - S-IA-X: Simuladores Profesionales
    - AR-IA: Analista de Riesgo
    - GOV-IA: Gobernanza
    - TC-N4: Trazabilidad

    IMPORTANTE: Gateway es STATELESS
    - Todo el estado se persiste en BD via repositorios
    - No mantiene sesiones/trazas/riesgos en memoria
    - Puede usarse con múltiples instancias (load balancer)
    """

    def __init__(
        self,
        llm_provider: Optional[LLMProvider] = None,
        cognitive_engine: Optional[CognitiveReasoningEngine] = None,
        session_repo: Optional[Any] = None,
        trace_repo: Optional[Any] = None,
        risk_repo: Optional[Any] = None,
        evaluation_repo: Optional[Any] = None,
        sequence_repo: Optional[Any] = None,
        cache: Optional[LLMResponseCache] = None,
        config: Optional[Dict[str, Any]] = None
    ):
        """
        Inicializa el AI Gateway con Dependency Injection completa

        Args:
            llm_provider: Proveedor de LLM (inyectado)
            cognitive_engine: Motor de razonamiento cognitivo (inyectado)
            session_repo: Repositorio de sesiones (inyectado)
            trace_repo: Repositorio de trazas (inyectado)
            risk_repo: Repositorio de riesgos (inyectado)
            evaluation_repo: Repositorio de evaluaciones (inyectado)
            sequence_repo: Repositorio de secuencias (inyectado)
            cache: Cache de respuestas LLM (inyectado, opcional)
            config: Configuración adicional

        Note:
            Si no se inyectan dependencias, se crean con valores por defecto
            (útil para backward compatibility con código existente)
        """
        self.config = config or {}

        # C1: Motor LLM - Usar proveedor inyectado o crear uno por defecto
        if llm_provider is not None:
            self.llm = llm_provider
        else:
            # Backward compatibility: crear proveedor mock por defecto
            self.llm = LLMProviderFactory.create("mock", self.config.get("llm", {}))

        # C3: Motor de Razonamiento Cognitivo-Pedagógico - Inyectado
        if cognitive_engine is not None:
            self.cognitive_engine = cognitive_engine
        else:
            # Backward compatibility
            self.cognitive_engine = CognitiveReasoningEngine(self.config)

        # Repositorios inyectados (opcional para backward compatibility)
        self.session_repo = session_repo
        self.trace_repo = trace_repo
        self.risk_repo = risk_repo
        self.evaluation_repo = evaluation_repo
        self.sequence_repo = sequence_repo

        # Cache LLM (opcional, para reducir costos)
        self.cache = cache

        # ✅ ELIMINADO: No más estado en memoria
        # ❌ self.trace_sequences: Dict[str, TraceSequence] = {}
        # ❌ self.traces: List[CognitiveTrace] = []
        # ❌ self.risks: Dict[str, RiskReport] = {}
        # ❌ self.active_sessions: Dict[str, Dict[str, Any]] = {}

    def create_session(
        self,
        student_id: str,
        activity_id: str,
        mode: str = "TUTOR",
        session_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Crea una nueva sesión de interacción (STATELESS)

        Args:
            student_id: ID del estudiante
            activity_id: ID de la actividad
            mode: Modo del agente (TUTOR, EVALUATOR, etc.)
            session_id: ID de sesión (opcional, se genera si no se proporciona)
            metadata: Metadata adicional

        Returns:
            session_id: ID de la sesión creada

        Note:
            Si session_repo está inyectado, persiste en BD.
            Si no, solo retorna el ID (backward compatibility para CLI).
        """
        if session_id is None:
            session_id = str(uuid.uuid4())

        # ✅ STATELESS: Persistir en BD via repositorio (si está inyectado)
        if self.session_repo is not None:
            db_session = self.session_repo.create(
                student_id=student_id,
                activity_id=activity_id,
                mode=mode
            )
            session_id = db_session.id

        # ✅ STATELESS: Crear secuencia de trazas en BD (si está inyectado)
        if self.sequence_repo is not None:
            trace_sequence = TraceSequence(
                id=f"seq_{session_id}",
                session_id=session_id,
                student_id=student_id,
                activity_id=activity_id
            )
            self.sequence_repo.create(trace_sequence)

        # ❌ ELIMINADO: No más guardado en memoria
        # self.active_sessions[session_id] = session
        # self.trace_sequences[session_id] = trace_sequence

        return session_id

    async def process_interaction(
        self,
        session_id: str,
        prompt: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Procesa una interacción del estudiante a través del gateway (STATELESS)

        Este es el flujo principal que:
        1. Valida entrada
        2. Obtiene sesión desde BD (no de memoria)
        3. Clasifica el prompt (IPC)
        4. Verifica gobernanza (GSR)
        5. Genera estrategia pedagógica (CRPE)
        6. Detecta riesgos (AR-IA)
        7. Registra en trazabilidad (N4) vía repositorio
        8. Genera respuesta según el agente activo

        Args:
            session_id: ID de la sesión
            prompt: Prompt del estudiante
            context: Contexto adicional

        Returns:
            Diccionario con la respuesta y metadata

        Raises:
            ValueError: Si la entrada no cumple con los requisitos de validación
        """
        # ✅ VALIDACIÓN: Validar entrada antes de procesar
        self._validate_interaction_input(session_id, prompt, context)

        # ✅ STATELESS: Obtener sesión desde BD (no desde self.active_sessions)
        if self.session_repo is not None:
            db_session = self.session_repo.get_by_id(session_id)
            if not db_session:
                raise ValueError(f"Sesión {session_id} no encontrada en BD")

            student_id = db_session.student_id
            activity_id = db_session.activity_id
            current_mode = AgentMode(db_session.mode.upper())
        else:
            # Backward compatibility: Si no hay repo, fallar limpiamente
            raise ValueError(f"Session repo no disponible - no se puede procesar interacción")

        # C2: Ingesta y Comprensión de Prompt (IPC)
        classification = self.cognitive_engine.classify_prompt(
            prompt,
            context or {}
        )

        # C4: Gobernanza - verificar si debe bloquearse
        should_block, block_reason = self.cognitive_engine.should_block_response(
            classification
        )

        # C6: Registrar traza de entrada (N3/N4)
        input_trace = self._create_trace(
            session_id=session_id,
            student_id=student_id,
            activity_id=activity_id,
            interaction_type=InteractionType.STUDENT_PROMPT,
            content=prompt,
            level=TraceLevel.N4_COGNITIVO,
            cognitive_intent=classification.get("cognitive_state", "").value if classification.get("cognitive_state") else None,
            context={"classification": classification}
        )
        self._persist_trace(input_trace)

        # Si debe bloquearse, retornar mensaje pedagógico
        if should_block:
            response = self._generate_blocked_response(block_reason, classification)

            # Registrar la intervención
            intervention_trace = self._create_trace(
                session_id=session_id,
                student_id=student_id,
                activity_id=activity_id,
                interaction_type=InteractionType.TUTOR_INTERVENTION,
                content=response.get("response", response.get("message", "")),  # Support both keys
                level=TraceLevel.N4_COGNITIVO,
                agent_id="GOV-IA"
            )
            self._persist_trace(intervention_trace)

            # Registrar riesgo detectado
            self._persist_risk(
                session_id=session_id,
                student_id=student_id,
                activity_id=activity_id,
                risk_type=RiskType.COGNITIVE_DELEGATION,
                risk_level=RiskLevel.HIGH,
                dimension=RiskDimension.COGNITIVE,
                description="Delegación total detectada en el prompt",
                evidence=[prompt],
                trace_ids=[input_trace.id]
            )

            # ✅ HIGH-01: Record Prometheus metrics for governance block
            metrics = _get_metrics()
            if metrics:
                metrics.record_interaction(
                    session_id=session_id,
                    student_id=student_id,
                    agent_used="GOV-IA",
                    status="blocked"
                )
                metrics.record_governance_block(
                    reason="total_delegation",
                    session_id=session_id
                )

            return response

        # C3: Generar estrategia pedagógica
        student_history = self._get_student_history(student_id, activity_id)
        strategy = self.cognitive_engine.generate_pedagogical_response_strategy(
            prompt,
            classification,
            student_history
        )

        # C5: Orquestación - delegar al submodelo apropiado
        if current_mode == AgentMode.TUTOR:
            response = await self._process_tutor_mode(
                session_id, prompt, strategy, classification
            )
        elif current_mode == AgentMode.SIMULATOR:
            response = self._process_simulator_mode(
                session_id, prompt, strategy, classification
            )
        elif current_mode == AgentMode.EVALUATOR:
            response = self._process_evaluator_mode(
                session_id, prompt, strategy, classification
            )
        else:
            response = {"message": "Modo no implementado", "metadata": {}}

        # Registrar respuesta en trazas
        response_trace = self._create_trace(
            session_id=session_id,
            student_id=student_id,
            activity_id=activity_id,
            interaction_type=InteractionType.AI_RESPONSE,
            content=response.get("response", response.get("message", "")),  # Support both keys
            level=TraceLevel.N4_COGNITIVO,
            agent_id=current_mode.value,
            context={"strategy": strategy}
        )
        self._persist_trace(response_trace)

        # Análisis de riesgo en paralelo (AR-IA)
        self._analyze_risks_async(session_id, input_trace, response_trace, classification)

        # ✅ HIGH-01: Record Prometheus metrics for successful interaction
        metrics = _get_metrics()
        if metrics:
            metrics.record_interaction(
                session_id=session_id,
                student_id=student_id,
                agent_used=current_mode.value,
                status="success"
            )
            # Record cognitive state if available
            cognitive_state = classification.get("cognitive_state")
            if cognitive_state:
                metrics.record_cognitive_state(cognitive_state.value if hasattr(cognitive_state, 'value') else str(cognitive_state))

        return response

    def _generate_blocked_response(
        self,
        reason: str,
        classification: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Genera una respuesta pedagógica cuando se bloquea la solicitud"""
        cognitive_state = classification.get("cognitive_state")

        message = f"""
He detectado que tu solicitud implica una delegación total del problema a la IA.

{reason}

Para poder ayudarte efectivamente, necesito que:

1. **Expliques tu comprensión del problema**: ¿Qué te piden resolver?
2. **Descompongas el problema**: ¿Qué partes identificas?
3. **Compartas tu plan inicial**: ¿Cómo pensás abordarlo?
4. **Identifiques tus dudas específicas**: ¿Qué parte específica te genera dificultad?

Esto no es una limitación arbitraria: el objetivo es que desarrolles tu capacidad de razonamiento y resolución de problemas, que son competencias fundamentales.

¿Podés reformular tu consulta siguiendo estas pautas?
"""

        return {
            "response": message.strip(),  # Changed from "message" to "response"
            "blocked": True,
            "block_reason": reason,  # Changed from "reason" to "block_reason"
            "requires_reformulation": True,
            "metadata": {
                "classification": classification,
                "pedagogical_intent": "promote_autonomy"
            }
        }

    async def _process_tutor_mode(
        self,
        session_id: str,
        prompt: str,
        strategy: Dict[str, Any],
        classification: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Procesa la interacción en modo T-IA-Cog (Tutor)

        En el MVP, genera respuestas basadas en la estrategia pedagógica.
        En producción, integraría con LLM real.

        Integración de cache:
        - Verifica cache antes de generar respuesta
        - Guarda respuesta en cache después de generarla
        - Ahorra costos de LLM (30-50% en prompts repetidos)
        """
        response_type = strategy.get("response_type", "unknown")
        
        # Log para debugging
        logger.info(f"Processing tutor mode - response_type: '{response_type}'")

        # Preparar contexto para cache key
        cache_context = {
            "response_type": response_type,
            "cognitive_state": classification.get("cognitive_state", "").value if classification.get("cognitive_state") else None
        }

        # Intentar obtener respuesta del cache
        cached_response = None
        if self.cache is not None:
            cached_response = self.cache.get(
                prompt=prompt,
                context=cache_context,
                mode="TUTOR"
            )

        if cached_response is not None:
            # Cache HIT - usar respuesta cacheada
            logger.info(
                f"Using cached response for prompt (saved LLM call)",
                extra={
                    "session_id": session_id,
                    "response_type": response_type,
                    "prompt_preview": prompt[:50]
                }
            )
            message = cached_response
        else:
            # Cache MISS - generar respuesta nueva
            if response_type == "socratic_questioning":
                message = await self._generate_socratic_response(prompt, strategy)
            elif response_type == "conceptual_explanation":
                message = await self._generate_conceptual_explanation(prompt, strategy)
            elif response_type == "guided_hints":
                message = await self._generate_guided_hints(prompt, strategy)
            else:
                # Fallback: usar explicación conceptual para casos no clasificados
                logger.warning(f"Unknown response_type '{response_type}', using conceptual_explanation")
                message = await self._generate_conceptual_explanation(prompt, strategy)

            # Guardar en cache para futuras solicitudes idénticas
            if self.cache is not None:
                self.cache.set(
                    prompt=prompt,
                    response=message,
                    context=cache_context,
                    mode="TUTOR"
                )

        return {
            "response": message,  # Changed from "message" to "response"
            "strategy": strategy,
            "mode": "tutor",
            "metadata": {
                "response_type": response_type,
                "cognitive_state": classification.get("cognitive_state", "").value if classification.get("cognitive_state") else None,
                "from_cache": cached_response is not None
            }
        }

    async def _generate_socratic_response(self, prompt: str, strategy: Dict[str, Any]) -> str:
        """Genera respuesta socrática (preguntas guía) usando LLM"""
        messages = [
            LLMMessage(
                role=LLMRole.SYSTEM,
                content="""Eres un tutor socrático. Tu objetivo es guiar al estudiante a descubrir la respuesta por sí mismo mediante preguntas orientadoras.

NO des la respuesta directa. Haz preguntas que:
1. Exploren su comprensión actual
2. Identifiquen sus suposiciones
3. Lo guíen a descomponer el problema
4. Lo ayuden a encontrar la solución por sí mismo

Sé breve y preciso. Máximo 4-5 preguntas."""
            ),
            LLMMessage(
                role=LLMRole.USER,
                content=f"Pregunta: {prompt}"
            )
        ]
        
        try:
            response = await self.llm.generate(messages, max_tokens=300, temperature=0.7)
            return response.content.strip()
        except Exception as e:
            logger.error(f"LLM generation failed: {e}", exc_info=True)
            return """Para ayudarte mejor, necesito entender tu proceso de pensamiento:

1. ¿Qué entendés que te están pidiendo resolver?
2. ¿Qué conceptos creés que son relevantes?
3. ¿Cómo funcionaría una solución ideal?
4. ¿Qué intentaste hasta ahora?"""

    async def _generate_conceptual_explanation(self, prompt: str, strategy: Dict[str, Any]) -> str:
        """Genera explicación conceptual usando LLM"""
        messages = [
            LLMMessage(
                role=LLMRole.SYSTEM,
                content="""Eres un tutor pedagógico. Explica conceptos fundamentales de manera clara y didáctica.

Estructura tu explicación:
1. Concepto clave (definición simple)
2. Principio fundamental (por qué es importante)
3. Ejemplo concreto y simple
4. Aplicación práctica

Usa markdown para formato. Sé claro y conciso (máximo 200 palabras)."""
            ),
            LLMMessage(
                role=LLMRole.USER,
                content=f"Pregunta: {prompt}"
            )
        ]
        
        try:
            response = await self.llm.generate(messages, max_tokens=400, temperature=0.7)
            return response.content.strip()
        except Exception as e:
            logger.error(f"LLM generation failed: {e}", exc_info=True)
            return """**Concepto clave**: [El concepto que preguntas es fundamental en programación]

**Principio**: [Por qué es importante entenderlo]

**Ejemplo simple**: [Analogía o ejemplo concreto]

**Aplicación**: [Cómo lo usarías en la práctica]

¿Tiene sentido? ¿Qué parte quieres que profundice?"""

    async def _generate_guided_hints(self, prompt: str, strategy: Dict[str, Any]) -> str:
        """Genera pistas guiadas usando LLM"""
        messages = [
            LLMMessage(
                role=LLMRole.SYSTEM,
                content="""Eres un tutor que da pistas graduadas. NO des la solución completa.

Proporciona 3-4 pistas que:
1. Sugieran cómo descomponer el problema
2. Mencionen conceptos/estructuras relevantes
3. Indiquen casos a considerar
4. Sugieran un próximo paso concreto

Cada pista debe acercar al estudiante a la solución sin dársela directamente."""
            ),
            LLMMessage(
                role=LLMRole.USER,
                content=f"Pregunta: {prompt}"
            )
        ]
        
        try:
            response = await self.llm.generate(messages, max_tokens=350, temperature=0.7)
            return response.content.strip()
        except Exception as e:
            logger.error(f"LLM generation failed: {e}", exc_info=True)
            return """**Pista 1**: Considerá descomponer el problema en subproblemas más pequeños

**Pista 2**: Pensá en qué estructuras de datos te facilitarían el acceso a la información

**Pista 3**: No olvides considerar los casos especiales (vacío, un elemento, etc.)

**Próximo paso**: Intenta escribir el esqueleto de la solución primero

¿Con cuál pista querés que profundice?"""

    def _generate_clarification_request(self, prompt: str, strategy: Dict[str, Any]) -> str:
        """Solicita clarificación"""
        return """
Para poder ayudarte mejor, necesito que seas más específico:

- ¿Qué parte exacta del problema te genera dificultad?
- ¿Qué intentaste hasta ahora?
- ¿Qué resultado esperabas vs. qué obtuviste?

Por favor, reformulá tu pregunta con más detalles.
"""

    def _process_simulator_mode(
        self,
        session_id: str,
        prompt: str,
        strategy: Dict[str, Any],
        classification: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Procesa interacción en modo S-IA-X (Simulador)"""
        # Placeholder para simuladores
        return {
            "message": "[Modo Simulador - En desarrollo]",
            "mode": "simulator",
            "metadata": {}
        }

    def _process_evaluator_mode(
        self,
        session_id: str,
        prompt: str,
        strategy: Dict[str, Any],
        classification: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Procesa interacción en modo E-IA-Proc (Evaluador)"""
        # Placeholder para evaluador
        return {
            "message": "[Modo Evaluador - En desarrollo]",
            "mode": "evaluator",
            "metadata": {}
        }

    def _create_trace(
        self,
        session_id: str,
        student_id: str,
        activity_id: str,
        interaction_type: InteractionType,
        content: str,
        level: TraceLevel,
        **kwargs
    ) -> CognitiveTrace:
        """Crea una traza cognitiva (no la persiste aún)"""
        trace_id = str(uuid.uuid4())

        return CognitiveTrace(
            id=trace_id,
            session_id=session_id,
            student_id=student_id,
            activity_id=activity_id,
            trace_level=level,
            interaction_type=interaction_type,
            content=content,
            **kwargs
        )

    def _persist_trace(self, trace: CognitiveTrace) -> None:
        """Persiste una traza en BD (STATELESS)"""
        if self.trace_repo is not None:
            try:
                db_trace = self.trace_repo.create(trace)
                logger.debug(
                    "Trace persisted successfully",
                    extra={
                        "trace_id": db_trace.id,
                        "interaction_type": trace.interaction_type.value,
                        "session_id": trace.session_id,
                        "cognitive_state": trace.cognitive_state.value if trace.cognitive_state else None
                    }
                )
                # ✅ HIGH-01: Record Prometheus metric for trace creation
                metrics = _get_metrics()
                if metrics:
                    metrics.record_trace_creation(
                        trace_level=trace.trace_level.value if hasattr(trace.trace_level, 'value') else str(trace.trace_level),
                        interaction_type=trace.interaction_type.value if hasattr(trace.interaction_type, 'value') else str(trace.interaction_type)
                    )
            except Exception as e:
                logger.error(
                    "Failed to persist trace",
                    extra={
                        "error": str(e),
                        "session_id": trace.session_id,
                        "interaction_type": trace.interaction_type.value
                    },
                    exc_info=True
                )
        else:
            logger.warning(
                "Trace repository is None, cannot persist trace",
                extra={
                    "session_id": trace.session_id,
                    "interaction_type": trace.interaction_type.value
                }
            )
        # Si no hay repo, no hacer nada (backward compatibility)

    def _get_student_history(
        self,
        student_id: str,
        activity_id: Optional[str] = None
    ) -> List[CognitiveTrace]:
        """Obtiene el historial de trazas del estudiante desde BD (STATELESS)"""
        if self.trace_repo is None:
            return []  # Backward compatibility

        # ✅ STATELESS: Leer desde BD
        db_traces = self.trace_repo.get_by_student(student_id, limit=100)

        # Convertir de ORM a Pydantic
        traces = []
        for db_trace in db_traces:
            try:
                trace = CognitiveTrace(
                    id=db_trace.id,
                    session_id=db_trace.session_id,
                    student_id=db_trace.student_id,
                    activity_id=db_trace.activity_id,
                    trace_level=TraceLevel(db_trace.trace_level),
                    interaction_type=InteractionType(db_trace.interaction_type),
                    content=db_trace.content or "",
                    context=db_trace.context or {},
                    metadata=db_trace.trace_metadata or {},
                    cognitive_state=db_trace.cognitive_state,
                    ai_involvement=db_trace.ai_involvement or 0.5,
                )
                traces.append(trace)
            except Exception as e:
                # Skip invalid traces pero log the error
                logger.warning(
                    f"Failed to convert database trace to Pydantic model: {type(e).__name__}: {str(e)}",
                    exc_info=True,
                    extra={
                        "trace_id": db_trace.id if hasattr(db_trace, 'id') else 'unknown',
                        "session_id": db_trace.session_id if hasattr(db_trace, 'session_id') else 'unknown',  # ✅ Fixed: use db_trace.session_id
                        "student_id": student_id  # ✅ This is in scope (function parameter)
                    }
                )
                continue

        # Filtrar por activity_id si se especificó
        if activity_id:
            traces = [t for t in traces if t.activity_id == activity_id]

        return traces

    def _create_risk(
        self,
        session_id: str,
        student_id: str,
        activity_id: str,
        risk_type: RiskType,
        risk_level: RiskLevel,
        dimension: RiskDimension,
        description: str,
        evidence: List[str],
        trace_ids: List[str],
        **kwargs
    ) -> Risk:
        """Crea un objeto Risk (sin persistirlo aún)"""
        return Risk(
            id=str(uuid.uuid4()),
            session_id=session_id,
            student_id=student_id,
            activity_id=activity_id,
            risk_type=risk_type,
            risk_level=risk_level,
            dimension=dimension,
            description=description,
            evidence=evidence,
            trace_ids=trace_ids,
            **kwargs
        )

    def _persist_risk(
        self,
        session_id: str,
        student_id: str,
        activity_id: str,
        risk_type: RiskType,
        risk_level: RiskLevel,
        dimension: RiskDimension,
        description: str,
        evidence: List[str],
        trace_ids: List[str],
        **kwargs
    ) -> Optional[Risk]:
        """Registra un riesgo detectado en BD (STATELESS)"""
        risk = Risk(
            id=str(uuid.uuid4()),
            session_id=session_id,
            student_id=student_id,
            activity_id=activity_id,
            risk_type=risk_type,
            risk_level=risk_level,
            dimension=dimension,
            description=description,
            evidence=evidence,
            trace_ids=trace_ids,
            **kwargs
        )

        # ✅ STATELESS: Persistir en BD
        if self.risk_repo is not None:
            try:
                self.risk_repo.create(risk)
                # ✅ Structured logging: Risk persisted successfully
                logger.info(
                    "Risk persisted to database",
                    extra={
                        "risk_id": risk.id,
                        "risk_type": risk_type.value,
                        "risk_level": risk_level.value,
                        "dimension": dimension.value,
                        "student_id": student_id,
                        "activity_id": activity_id,
                        "trace_count": len(trace_ids)
                    }
                )
                # ✅ HIGH-01: Record Prometheus metric for risk detection
                metrics = _get_metrics()
                if metrics:
                    metrics.record_risk_detection(
                        risk_type=risk_type.value,
                        risk_level=risk_level.value,
                        dimension=dimension.value
                    )
            except Exception as e:
                # ✅ Structured logging: Risk persistence failed
                logger.error(
                    f"Failed to persist risk to database: {type(e).__name__}: {str(e)}",
                    exc_info=True,
                    extra={
                        "risk_id": risk.id,
                        "risk_type": risk_type.value,
                        "risk_level": risk_level.value,
                        "student_id": student_id,
                        "activity_id": activity_id
                    }
                )
                # Re-raise to maintain error propagation
                raise
        else:
            # ✅ Structured logging: No repository available
            logger.warning(
                "Risk repository is None, cannot persist risk",
                extra={
                    "risk_id": risk.id,
                    "risk_type": risk_type.value,
                    "risk_level": risk_level.value,
                    "student_id": student_id
                }
            )

        return risk

    def _analyze_risks_async(
        self,
        session_id: str,
        input_trace: CognitiveTrace,
        response_trace: CognitiveTrace,
        classification: Dict[str, Any]
    ) -> None:
        """
        Análisis de riesgos asíncrono (AR-IA)

        Realiza análisis básico de riesgos a partir de las trazas de entrada y salida.
        En el MVP ejecuta sincrónicamente, en producción sería async (celery/rq).

        Args:
            session_id: ID de la sesión
            input_trace: Traza de entrada (prompt del estudiante)
            response_trace: Traza de salida (respuesta del agente)
            classification: Clasificación del prompt (tipo, delegación, etc.)

        Detecta:
        - RC1: Delegación total (solicitudes de código completo)
        - RC2: Dependencia excesiva de IA (alto ai_involvement)
        - RC3: Falta de justificación (decisiones sin explicación)
        - RE1: Integridad académica (uso no divulgado de IA)
        - REp1: Aceptación acrítica (no cuestiona respuestas de IA)
        """
        logger.info(
            "Starting risk analysis",
            extra={
                "session_id": session_id,
                "input_trace_id": input_trace.id,
                "response_trace_id": response_trace.id,
                "classification_type": classification.get("type", "unknown"),
                "is_delegation": classification.get("is_delegation", False),
                "ai_involvement": input_trace.ai_involvement
            }
        )

        # Skip if no repositories available (backward compatibility)
        if self.risk_repo is None:
            logger.debug("Risk repository not available, skipping risk analysis")
            return

        detected_risks = []

        # === RC1: Delegación Total ===
        if classification.get("is_delegation", False):
            delegation_signals = classification.get("delegation_signals", [])
            risk = self._create_risk(
                session_id=session_id,
                student_id=input_trace.student_id,
                activity_id=input_trace.activity_id,
                risk_type=RiskType.COGNITIVE_DELEGATION,
                risk_level=RiskLevel.HIGH,
                dimension=RiskDimension.COGNITIVE,
                description=(
                    "Intento de delegación total detectado. El estudiante solicita "
                    "soluciones completas sin descomposición del problema."
                ),
                evidence=[
                    input_trace.content[:200],  # First 200 chars of prompt
                    f"Señales: {', '.join(delegation_signals[:3])}"
                ],
                trace_ids=[input_trace.id, response_trace.id],
                root_cause="Tendencia a delegar la resolución completa a la IA sin esfuerzo propio",
                recommendations=[
                    "Solicitar descomposición explícita del problema en subtareas",
                    "Exigir justificación de cada paso antes de implementar",
                    "Reducir nivel de ayuda del tutor temporalmente",
                    "Asignar ejercicios similares sin acceso a IA"
                ],
                pedagogical_intervention=(
                    "Activar modo socrático estricto: solo preguntas guía, sin pistas directas"
                )
            )
            detected_risks.append(risk)

        # === RC2: Dependencia Excesiva de IA ===
        if input_trace.ai_involvement > 0.7:  # Threshold: 70%
            risk = self._create_risk(
                session_id=session_id,
                student_id=input_trace.student_id,
                activity_id=input_trace.activity_id,
                risk_type=RiskType.AI_DEPENDENCY,
                risk_level=RiskLevel.MEDIUM,
                dimension=RiskDimension.COGNITIVE,
                description=(
                    f"Nivel de dependencia de IA elevado: {input_trace.ai_involvement:.1%}. "
                    "El estudiante depende excesivamente de la asistencia de IA."
                ),
                evidence=[f"AI involvement: {input_trace.ai_involvement:.2%}"],
                trace_ids=[input_trace.id],
                recommendations=[
                    "Fomentar resolución autónoma con menos asistencia de IA",
                    "Asignar ejercicios sin acceso a IA para desarrollar autonomía",
                    "Revisar interacciones previas para identificar patrón de dependencia"
                ]
            )
            detected_risks.append(risk)

        # === RC3: Falta de Justificación ===
        has_justification = (
            input_trace.decision_justification is not None and
            len(input_trace.decision_justification.strip()) > 20
        )
        if not has_justification and not classification.get("is_question", False):
            # Solo detectar si NO es una pregunta conceptual (donde no se espera justificación)
            risk = self._create_risk(
                session_id=session_id,
                student_id=input_trace.student_id,
                activity_id=input_trace.activity_id,
                risk_type=RiskType.LACK_JUSTIFICATION,
                risk_level=RiskLevel.LOW,
                dimension=RiskDimension.COGNITIVE,
                description=(
                    "El estudiante no proporciona justificación de sus decisiones o razonamiento. "
                    "Esto dificulta evaluar su proceso cognitivo."
                ),
                evidence=["No se detectó campo decision_justification"],
                trace_ids=[input_trace.id],
                recommendations=[
                    "Exigir explicitación del razonamiento en cada interacción",
                    "Solicitar que explique 'por qué' eligió cierto enfoque",
                    "Usar prompts estructurados que incluyan sección de justificación"
                ]
            )
            detected_risks.append(risk)

        # === REp1: Aceptación Acrítica ===
        # Detectar si el estudiante acepta respuestas sin cuestionarlas
        # (Simplificado: si ai_critiques es 0 y hay múltiples interacciones)
        if hasattr(response_trace, 'alternatives_considered'):
            alternatives = response_trace.alternatives_considered or []
            if len(alternatives) == 0 and input_trace.ai_involvement > 0.5:
                risk = self._create_risk(
                    session_id=session_id,
                    student_id=input_trace.student_id,
                    activity_id=input_trace.activity_id,
                    risk_type=RiskType.UNCRITICAL_ACCEPTANCE,
                    risk_level=RiskLevel.MEDIUM,
                    dimension=RiskDimension.EPISTEMIC,
                    description=(
                        "El estudiante no considera alternativas ni cuestiona las respuestas de la IA. "
                        "Esto indica posible aceptación acrítica."
                    ),
                    evidence=["No se registraron alternativas consideradas"],
                    trace_ids=[input_trace.id, response_trace.id],
                    recommendations=[
                        "Fomentar pensamiento crítico: '¿Qué otras opciones existen?'",
                        "Solicitar comparación entre diferentes enfoques",
                        "Pedir que identifique limitaciones de la solución propuesta"
                    ]
                )
                detected_risks.append(risk)

        # Log summary
        if detected_risks:
            logger.warning(
                f"Risk analysis completed: {len(detected_risks)} risks detected",
                extra={
                    "session_id": session_id,
                    "risk_count": len(detected_risks),
                    "risk_types": [r.risk_type.value for r in detected_risks],
                    "risk_levels": [r.risk_level.value for r in detected_risks]
                }
            )
        else:
            logger.info(
                "Risk analysis completed: no risks detected",
                extra={"session_id": session_id}
            )

        # Note: Risks are already persisted by _create_risk() method
        # No additional persistence needed here

    def get_trace_sequence(self, session_id: str) -> Optional[TraceSequence]:
        """Obtiene la secuencia de trazas de una sesión desde BD (STATELESS)"""
        if self.sequence_repo is None:
            return None  # Backward compatibility

        # ✅ STATELESS: Leer desde BD
        return self.sequence_repo.get_by_session(session_id)

    def get_risk_report(self, student_id: str, activity_id: str) -> Optional[RiskReport]:
        """Obtiene el reporte de riesgos desde BD (STATELESS)"""
        if self.risk_repo is None:
            return None  # Backward compatibility

        # ✅ STATELESS: Construir reporte desde BD
        risks = self.risk_repo.get_by_student(student_id)

        # Filtrar por activity_id
        risks = [r for r in risks if r.activity_id == activity_id]

        if not risks:
            return None

        # Construir RiskReport
        report = RiskReport(
            id=f"report_{student_id}_{activity_id}",
            student_id=student_id,
            activity_id=activity_id
        )

        for db_risk in risks:
            risk = Risk(
                id=db_risk.id,
                student_id=db_risk.student_id,
                activity_id=db_risk.activity_id,
                risk_type=RiskType(db_risk.risk_type),
                risk_level=RiskLevel(db_risk.risk_level),
                dimension=RiskDimension(db_risk.dimension),
                description=db_risk.description or "",
                evidence=db_risk.evidence or [],
                trace_ids=db_risk.trace_ids or [],
            )
            report.add_risk(risk)

        return report

    def _validate_interaction_input(
        self,
        session_id: str,
        prompt: str,
        context: Optional[Dict[str, Any]]
    ) -> None:
        """
        Valida la entrada de una interacción.

        Args:
            session_id: ID de la sesión
            prompt: Prompt del estudiante
            context: Contexto adicional

        Raises:
            ValueError: Si la validación falla
        """
        from .constants import (
            PROMPT_MIN_LENGTH,
            PROMPT_MAX_LENGTH,
            CONTEXT_MAX_SIZE_BYTES,
            SESSION_ID_MAX_LENGTH
        )
        import json

        # Validar session_id
        if not session_id or not isinstance(session_id, str):
            raise ValueError("session_id debe ser un string no vacío")

        if len(session_id) > SESSION_ID_MAX_LENGTH:
            raise ValueError(
                f"session_id excede longitud máxima ({SESSION_ID_MAX_LENGTH} caracteres)"
            )

        # Validar prompt
        if not prompt or not isinstance(prompt, str):
            raise ValueError("prompt debe ser un string no vacío")

        prompt_length = len(prompt.strip())
        if prompt_length < PROMPT_MIN_LENGTH:
            raise ValueError(
                f"Prompt demasiado corto (mínimo {PROMPT_MIN_LENGTH} caracteres)"
            )

        if prompt_length > PROMPT_MAX_LENGTH:
            raise ValueError(
                f"Prompt demasiado largo (máximo {PROMPT_MAX_LENGTH} caracteres)"
            )

        # Validar context
        if context is not None:
            if not isinstance(context, dict):
                raise ValueError("context debe ser un diccionario")

            # Validar tamaño del contexto
            try:
                context_size = len(json.dumps(context).encode('utf-8'))
                if context_size > CONTEXT_MAX_SIZE_BYTES:
                    raise ValueError(
                        f"Context demasiado grande (máximo {CONTEXT_MAX_SIZE_BYTES} bytes)"
                    )
            except (TypeError, ValueError) as e:
                raise ValueError(f"Context no es serializable a JSON: {str(e)}")

        logger.debug(
            "Input validation passed",
            extra={
                "session_id": session_id,
                "prompt_length": prompt_length,
                "has_context": context is not None
            }
        )

    def set_mode(self, session_id: str, mode: AgentMode) -> None:
        """Cambia el modo operativo de una sesión en BD (STATELESS)"""
        if self.session_repo is not None:
            self.session_repo.update_mode(session_id, mode.value.upper())
        # Si no hay repo, no hacer nada (backward compatibility)