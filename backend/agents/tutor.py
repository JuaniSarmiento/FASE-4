"""
Submodelo 1: Tutor IA Disciplinar Cognitivo (T-IA-Cog)

Agente de andamiaje cognitivo y metacognitivo que amplifica capacidades
del estudiante sin sustituirlas, operando bajo reglas pedagógicas y éticas explícitas.
"""
from typing import Optional, Dict, Any, List
from enum import Enum

from ..models.trace import CognitiveTrace, TraceLevel, InteractionType


class TutorMode(str, Enum):
    """Modos de tutoría"""
    SOCRATICO = "socratico"  # Preguntas socráticas
    EXPLICATIVO = "explicativo"  # Explicaciones conceptuales
    GUIADO = "guiado"  # Pistas graduadas
    METACOGNITIVO = "metacognitivo"  # Reflexión sobre el proceso


class HelpLevel(str, Enum):
    """Niveles de ayuda"""
    MINIMO = "minimo"  # Solo preguntas orientadoras
    BAJO = "bajo"  # Pistas muy generales
    MEDIO = "medio"  # Pistas con algo de detalle
    ALTO = "alto"  # Explicaciones detalladas (sin código completo)


class TutorCognitivoAgent:
    """
    T-IA-Cog: Tutor IA Disciplinar Cognitivo

    Funciones principales:
    1. Guiar el razonamiento (no proveer soluciones)
    2. Promover la explicitación del pensamiento
    3. Prevenir delegación acrítica
    4. Reforzar fundamentos conceptuales
    5. Escalar dificultad cognitiva adaptativamente

    Basado en:
    - Cognición distribuida (Hutchins, 1995)
    - Cognición extendida (Clark & Chalmers, 1998)
    - Teoría de carga cognitiva (Sweller, 1988)
    - Autorregulación (Zimmerman, 2002)
    """

    def __init__(self, llm_provider=None, config: Optional[Dict[str, Any]] = None):
        self.llm_provider = llm_provider
        self.config = config or {}

        # Políticas pedagógicas
        self.policies = {
            "prioritize_questions": True,
            "require_justification": True,
            "adaptive_difficulty": True,
            "max_help_level": HelpLevel.MEDIO,
            "block_complete_solutions": True,
        }

        # Actualizar con config
        if config:
            self.policies.update(config.get("policies", {}))

    def generate_response(
        self,
        student_prompt: str,
        cognitive_state: str,
        strategy: Dict[str, Any],
        student_history: Optional[List[CognitiveTrace]] = None
    ) -> Dict[str, Any]:
        """
        Genera respuesta tutorial basada en principios pedagógicos

        Args:
            student_prompt: Pregunta/solicitud del estudiante
            cognitive_state: Estado cognitivo actual
            strategy: Estrategia pedagógica definida por CRPE
            student_history: Historial de interacciones

        Returns:
            Diccionario con respuesta y metadata pedagógica
        """
        response_type = strategy.get("response_type", "socratic_questioning")

        if response_type == "socratic_questioning":
            return self._generate_socratic_response(
                student_prompt, cognitive_state, strategy
            )
        elif response_type == "conceptual_explanation":
            return self._generate_conceptual_explanation(
                student_prompt, cognitive_state, strategy
            )
        elif response_type == "guided_hints":
            return self._generate_guided_hints(
                student_prompt, cognitive_state, strategy, student_history
            )
        else:
            return self._generate_clarification_request(
                student_prompt, cognitive_state
            )

    def _generate_socratic_response(
        self,
        prompt: str,
        cognitive_state: str,
        strategy: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Genera respuesta socrática con preguntas que guían el razonamiento

        Ejemplo de la tesis (sección 6.6.4):
        Estudiante: "No entiendo cómo implementar esta cola con arreglos."
        Tutor: "Explícame qué entendés por 'cola'..."
        """
        questions = self._formulate_socratic_questions(prompt, cognitive_state)

        message = f"""
## Análisis del Problema

Para guiarte efectivamente, necesito comprender tu proceso de pensamiento.
Por favor, respondé las siguientes preguntas:

{self._format_questions(questions)}

📝 **Importante**: No estoy evitando ayudarte. Estas preguntas son fundamentales
para que desarrolles tu capacidad de descomposición y análisis de problemas,
que es más valiosa que cualquier solución específica.

Una vez que compartas tu razonamiento, podré orientarte de manera precisa.
"""

        return {
            "message": message.strip(),
            "mode": TutorMode.SOCRATICO,
            "pedagogical_intent": "promote_decomposition_and_planning",
            "questions": questions,
            "requires_student_response": True,
            "metadata": {
                "cognitive_state": cognitive_state,
                "help_level": HelpLevel.MINIMO,
            }
        }

    def _formulate_socratic_questions(
        self,
        prompt: str,
        cognitive_state: str
    ) -> List[str]:
        """Formula preguntas socráticas adaptadas al contexto"""
        base_questions = [
            "¿Qué entendés que te están pidiendo resolver en este problema?",
            "¿Qué conceptos o estructuras de datos considerás relevantes?",
            "¿Podés describir con tus palabras cómo funcionaría una solución?",
            "¿Qué intentaste hasta ahora? ¿Qué resultado obtuviste?",
        ]

        # Adaptar según estado cognitivo
        if cognitive_state == "exploracion":
            base_questions.insert(
                1,
                "¿Qué partes del enunciado te resultan claras y cuáles confusas?"
            )
        elif cognitive_state == "depuracion":
            base_questions = [
                "¿Qué comportamiento esperabas y qué obtuviste?",
                "¿En qué punto específico falla tu código?",
                "¿Qué hipótesis tenés sobre la causa del error?",
                "¿Qué pruebas hiciste para verificar tu hipótesis?",
            ]

        return base_questions

    def _format_questions(self, questions: List[str]) -> str:
        """Formatea lista de preguntas"""
        return "\n".join([f"{i+1}. {q}" for i, q in enumerate(questions)])

    def _generate_conceptual_explanation(
        self,
        prompt: str,
        cognitive_state: str,
        strategy: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Genera explicación conceptual sin dar implementación específica

        Reduce carga extrínseca, favorece carga germinal (Sweller, 1988)
        """
        # En MVP: template genérico. En producción: usar LLM con system prompt específico
        message = """
## Conceptos Fundamentales

Vamos a abordar esto desde los conceptos fundamentales, sin adelantarnos a la implementación.

### Concepto Clave

[El concepto principal que necesitás comprender para resolver este problema]

### Principios Importantes

1. **Principio 1**: [Explicación del principio]
2. **Principio 2**: [Explicación del principio]

### Ejemplo Simple

[Analogía o ejemplo simple que ilustra el concepto]

### Conexión con tu Problema

Para tu caso específico, estos conceptos significan que...

---

💡 **Próximo paso**: Ahora que tenés más claros estos conceptos, ¿cómo
pensás aplicarlos a tu problema? ¿Qué parte querés que profundice?
"""

        return {
            "message": message.strip(),
            "mode": TutorMode.EXPLICATIVO,
            "pedagogical_intent": "conceptual_understanding",
            "help_level": HelpLevel.MEDIO,
            "metadata": {
                "cognitive_state": cognitive_state,
                "provides_code": False,
            }
        }

    def _generate_guided_hints(
        self,
        prompt: str,
        cognitive_state: str,
        strategy: Dict[str, Any],
        student_history: Optional[List[CognitiveTrace]] = None
    ) -> Dict[str, Any]:
        """
        Genera pistas graduadas sin revelar la solución completa

        Implementa andamiaje cognitivo (scaffolding) con niveles adaptativos
        según el historial del estudiante.

        Niveles de pistas:
        - Nivel 1 (MINIMO): Preguntas socráticas orientadoras
        - Nivel 2 (BAJO): Pistas conceptuales generales
        - Nivel 3 (MEDIO): Pistas con algo de detalle + pseudocódigo alto nivel
        - Nivel 4 (ALTO): Fragmentos conceptuales + estrategia detallada
        """
        # Determinar nivel de ayuda basado en historial
        help_level = self._determine_adaptive_help_level(student_history, strategy)

        # Analizar cuántas pistas ha recibido ya
        previous_hints_count = self._count_previous_hints(student_history) if student_history else 0

        # Generar pistas según nivel
        if help_level == HelpLevel.MINIMO:
            hints = self._generate_level1_hints(prompt, cognitive_state)
        elif help_level == HelpLevel.BAJO:
            hints = self._generate_level2_hints(prompt, cognitive_state)
        elif help_level == HelpLevel.MEDIO:
            hints = self._generate_level3_hints(prompt, cognitive_state)
        else:  # ALTO
            hints = self._generate_level4_hints(prompt, cognitive_state)

        # Construir mensaje
        message = f"""
## Pistas Graduadas - Nivel {help_level.value.upper()}

{self._format_hints_message(hints, help_level)}

---

{self._generate_followup_question(help_level, previous_hints_count)}
"""

        return {
            "message": message.strip(),
            "mode": TutorMode.GUIADO,
            "pedagogical_intent": "scaffolding",
            "help_level": help_level,
            "hints_provided": hints,
            "hints_count": len(hints),
            "previous_hints_count": previous_hints_count,
            "requires_justification": True,
            "metadata": {
                "cognitive_state": cognitive_state,
                "provides_code": False,
                "provides_pseudocode": help_level in [HelpLevel.MEDIO, HelpLevel.ALTO],
                "adaptive_level": help_level.value,
            }
        }

    def _determine_adaptive_help_level(
        self,
        student_history: Optional[List[CognitiveTrace]],
        strategy: Dict[str, Any]
    ) -> HelpLevel:
        """
        Determina el nivel de ayuda adaptativamente según:
        1. Estrategia sugerida por CRPE
        2. Historial de pistas recibidas (si recibió muchas, reducir detalle)
        3. Nivel de AI involvement acumulado
        """
        # Nivel base desde estrategia
        strategy_level = strategy.get("help_level", HelpLevel.MEDIO)

        if not student_history:
            return strategy_level

        # Contar pistas previas
        hints_received = self._count_previous_hints(student_history)

        # Si ya recibió muchas pistas (>5), reducir nivel para fomentar autonomía
        if hints_received > 5:
            if strategy_level == HelpLevel.ALTO:
                return HelpLevel.MEDIO
            elif strategy_level == HelpLevel.MEDIO:
                return HelpLevel.BAJO

        # Calcular AI involvement promedio
        avg_ai_involvement = sum(t.ai_involvement for t in student_history) / len(student_history)

        # Si dependency alta (>0.6), reducir nivel de ayuda
        if avg_ai_involvement > 0.6:
            if strategy_level == HelpLevel.ALTO:
                return HelpLevel.MEDIO
            elif strategy_level == HelpLevel.MEDIO:
                return HelpLevel.BAJO

        return strategy_level

    def _count_previous_hints(self, student_history: List[CognitiveTrace]) -> int:
        """Cuenta cuántas pistas ha recibido el estudiante"""
        return sum(
            1 for t in student_history
            if "hints_provided" in t.metadata.get("response_metadata", {})
        )

    def _generate_level1_hints(self, prompt: str, cognitive_state: str) -> List[Dict[str, str]]:
        """Nivel 1 - MINIMO: Solo preguntas socráticas orientadoras"""
        return [
            {
                "level": 1,
                "type": "question",
                "content": "¿Qué pasos creés que son necesarios para resolver este problema?"
            },
            {
                "level": 1,
                "type": "question",
                "content": "¿Qué conceptos o estructuras de datos podrían ser relevantes aquí?"
            },
            {
                "level": 1,
                "type": "question",
                "content": "¿Podés describir con tus palabras cómo funcionaría una solución ideal?"
            }
        ]

    def _generate_level2_hints(self, prompt: str, cognitive_state: str) -> List[Dict[str, str]]:
        """Nivel 2 - BAJO: Pistas conceptuales generales"""
        return [
            {
                "level": 2,
                "type": "conceptual",
                "content": "Pensá en descomponer el problema en partes más pequeñas. ¿Cuáles serían esas partes?"
            },
            {
                "level": 2,
                "type": "conceptual",
                "content": "Considerá qué estructura de datos se adapta mejor a las operaciones que necesitás realizar."
            },
            {
                "level": 2,
                "type": "reflection",
                "content": "¿Qué casos especiales o de borde deberías tener en cuenta?"
            }
        ]

    def _generate_level3_hints(self, prompt: str, cognitive_state: str) -> List[Dict[str, str]]:
        """Nivel 3 - MEDIO: Pistas con detalle + pseudocódigo alto nivel"""
        return [
            {
                "level": 3,
                "type": "decomposition",
                "content": "Dividí el problema en estas etapas: 1) Inicialización, 2) Operación principal, 3) Validación"
            },
            {
                "level": 3,
                "type": "strategy",
                "content": "Una estrategia común es usar [concepto general] para gestionar [aspecto del problema]"
            },
            {
                "level": 3,
                "type": "pseudocode",
                "content": """```
// Estructura general (alto nivel)
función resolver():
    // Paso 1: Preparar datos
    // Paso 2: Procesar elemento por elemento
    // Paso 3: Retornar resultado
```"""
            }
        ]

    def _generate_level4_hints(self, prompt: str, cognitive_state: str) -> List[Dict[str, str]]:
        """Nivel 4 - ALTO: Fragmentos conceptuales + estrategia detallada"""
        return [
            {
                "level": 4,
                "type": "detailed_strategy",
                "content": "Considerá este enfoque: [descripción detallada de estrategia sin código específico]"
            },
            {
                "level": 4,
                "type": "pattern",
                "content": "Un patrón útil aquí es [nombre del patrón], que consiste en [explicación conceptual]"
            },
            {
                "level": 4,
                "type": "conceptual_fragment",
                "content": """Para gestionar [aspecto específico]:
- Opción A: [ventajas y desventajas]
- Opción B: [ventajas y desventajas]
¿Cuál elegirías y por qué?"""
            }
        ]

    def _format_hints_message(self, hints: List[Dict[str, str]], level: HelpLevel) -> str:
        """Formatea las pistas para el mensaje"""
        icons = {
            "question": "❓",
            "conceptual": "💡",
            "reflection": "🤔",
            "decomposition": "🔍",
            "strategy": "🎯",
            "pseudocode": "📝",
            "detailed_strategy": "🗺️",
            "pattern": "🧩",
            "conceptual_fragment": "💭"
        }

        formatted = []
        for i, hint in enumerate(hints, 1):
            icon = icons.get(hint["type"], "•")
            hint_type = hint["type"].replace("_", " ").title()
            formatted.append(f"### {icon} Pista {i}: {hint_type}\n{hint['content']}")

        return "\n\n".join(formatted)

    def _generate_followup_question(self, level: HelpLevel, hints_count: int) -> str:
        """Genera pregunta de seguimiento según contexto"""
        if hints_count > 5:
            return """⚠️ **Nota**: Has recibido varias pistas ya. Es momento de que intentes
avanzar de forma más autónoma. ¿Qué vas a hacer con la información que tenés?"""
        elif level == HelpLevel.MINIMO:
            return """❓ **Pregunta para vos**: Respondé primero estas preguntas antes de
solicitar más ayuda. La clave está en tu razonamiento, no en la respuesta de la IA."""
        elif level in [HelpLevel.MEDIO, HelpLevel.ALTO]:
            return """❓ **Pregunta para vos**: Basándote en estas pistas, ¿cuál sería tu
próximo paso concreto? ¿Qué decisión de diseño tomarías y **por qué**?"""
        else:
            return """❓ **Próximo paso**: Intentá formular un plan basándote en estas pistas.
¿Qué harías primero?"""

    def _generate_clarification_request(
        self,
        prompt: str,
        cognitive_state: str
    ) -> Dict[str, Any]:
        """Solicita clarificación cuando el prompt es ambiguo"""
        message = """
## Necesito Más Información

Para poder ayudarte de manera efectiva, necesito que seas más específico:

### 📌 Contexto del Problema
- ¿Qué parte exacta te genera dificultad?
- ¿Qué entendés que tenés que lograr?

### 📌 Lo que Intentaste
- ¿Qué enfoque probaste?
- ¿Qué código escribiste hasta ahora?
- ¿Qué resultado obtuviste vs. qué esperabas?

### 📌 Tu Hipótesis
- ¿Qué creés que podría estar causando el problema?
- ¿Qué soluciones consideraste?

Por favor, reformulá tu consulta incluyendo esta información.
"""

        return {
            "message": message.strip(),
            "mode": TutorMode.SOCRATICO,
            "pedagogical_intent": "promote_specificity",
            "requires_student_response": True,
            "metadata": {
                "cognitive_state": cognitive_state,
            }
        }

    def evaluate_student_response(
        self,
        student_response: str,
        previous_interaction: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Evalúa la respuesta del estudiante a preguntas/pistas previas

        Detecta:
        - Nivel de elaboración
        - Explicitación del razonamiento
        - Justificación de decisiones
        - Autocorrección
        """
        analysis = {
            "has_justification": self._detect_justification(student_response),
            "shows_decomposition": self._detect_decomposition(student_response),
            "shows_planning": self._detect_planning(student_response),
            "shows_self_reflection": self._detect_self_reflection(student_response),
            "quality_score": 0.0,  # 0-1
        }

        # Calcular score de calidad
        score = 0.0
        if analysis["has_justification"]:
            score += 0.3
        if analysis["shows_decomposition"]:
            score += 0.3
        if analysis["shows_planning"]:
            score += 0.2
        if analysis["shows_self_reflection"]:
            score += 0.2

        analysis["quality_score"] = score

        return analysis

    def _detect_justification(self, text: str) -> bool:
        """Detecta si hay justificación en la respuesta"""
        justification_signals = [
            "porque", "ya que", "debido a", "considerando que",
            "mi razón es", "pensé que", "decidí", "elegí"
        ]
        return any(signal in text.lower() for signal in justification_signals)

    def _detect_decomposition(self, text: str) -> bool:
        """Detecta si hay descomposición del problema"""
        decomposition_signals = [
            "primero", "luego", "después", "paso", "parte",
            "dividir", "separar", "componente", "subproblema"
        ]
        return any(signal in text.lower() for signal in decomposition_signals)

    def _detect_planning(self, text: str) -> bool:
        """Detecta si hay evidencia de planificación"""
        planning_signals = [
            "voy a", "planeo", "mi estrategia", "mi plan",
            "primero haré", "mi enfoque", "mi idea es"
        ]
        return any(signal in text.lower() for signal in planning_signals)

    def _detect_self_reflection(self, text: str) -> bool:
        """Detecta si hay reflexión metacognitiva"""
        reflection_signals = [
            "me doy cuenta", "entiendo que", "ahora veo",
            "me confundí", "cometí el error", "debería"
        ]
        return any(signal in text.lower() for signal in reflection_signals)