"""
Enumeraciones para validación de schemas de la API
"""
from enum import Enum
from ...core.cognitive_engine import AgentMode

# DEPRECATED: Use AgentMode from cognitive_engine instead
# Mantener por compatibilidad temporal, pero usar AgentMode en código nuevo
SessionMode = AgentMode  # Alias for backward compatibility


class SessionStatus(str, Enum):
    """Estados de sesión válidos"""
    ACTIVE = "active"
    COMPLETED = "completed"
    ABORTED = "aborted"
    PAUSED = "paused"


class CognitiveIntent(str, Enum):
    """Intenciones cognitivas del estudiante"""
    UNDERSTANDING = "UNDERSTANDING"  # Busca entender conceptos
    EXPLORATION = "EXPLORATION"  # Explora posibilidades
    PLANNING = "PLANNING"  # Planifica solución
    IMPLEMENTATION = "IMPLEMENTATION"  # Implementa código
    DEBUGGING = "DEBUGGING"  # Depura errores
    VALIDATION = "VALIDATION"  # Valida solución
    REFLECTION = "REFLECTION"  # Reflexiona sobre proceso
    UNKNOWN = "UNKNOWN"  # No determinado


# ==================== ACTIVITY ENUMS ====================

class ActivityDifficulty(str, Enum):
    """
    Niveles de dificultad de actividades

    Alineado con frontend ActivityDifficulty
    Valores en UPPERCASE para consistencia con otras enums del sistema
    """
    INICIAL = "INICIAL"       # Nivel principiante
    INTERMEDIO = "INTERMEDIO" # Nivel intermedio
    AVANZADO = "AVANZADO"     # Nivel avanzado


class ActivityStatus(str, Enum):
    """
    Estados del ciclo de vida de una actividad

    Alineado con frontend ActivityStatus
    Valores en lowercase para consistencia con SessionStatus
    """
    DRAFT = "draft"       # Borrador, no visible para estudiantes
    ACTIVE = "active"     # Publicada y activa
    ARCHIVED = "archived" # Archivada, no disponible


class HelpLevel(str, Enum):
    """
    Niveles de ayuda máxima permitida en políticas pedagógicas

    Alineado con frontend HelpLevel
    Valores en lowercase para consistencia con otras enums de políticas
    """
    MINIMO = "minimo"  # Solo hints muy generales
    BAJO = "bajo"      # Hints y preguntas guía
    MEDIO = "medio"    # Explicaciones conceptuales
    ALTO = "alto"      # Ayuda detallada pero sin soluciones completas


class SimulatorType(str, Enum):
    """
    Tipos de simulador profesional (S-IA-X)

    Alineado con frontend SimulatorType
    Valores en lowercase para consistencia con base de datos
    """
    PRODUCT_OWNER = "product_owner"          # Simulador de Product Owner
    SCRUM_MASTER = "scrum_master"            # Simulador de Scrum Master
    TECH_INTERVIEWER = "tech_interviewer"    # Simulador de entrevista técnica
    INCIDENT_RESPONDER = "incident_responder"  # Simulador de respuesta a incidentes
    CLIENT = "client"                        # Simulador de cliente
    DEVSECOPS = "devsecops"                  # Simulador DevSecOps