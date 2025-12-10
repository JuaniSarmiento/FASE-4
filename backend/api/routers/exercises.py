from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import subprocess
import tempfile
import os
import time
import json

from backend.database.config import get_db
from backend.models.exercise import Exercise, UserExerciseSubmission
from backend.api.routers.auth_new import get_current_user
from backend.models.user import User
from backend.llm.ollama_provider import OllamaProvider

router = APIRouter(prefix="/exercises", tags=["Code Exercises"])


# Schemas
class ExerciseResponse(BaseModel):
    id: str
    title: str
    description: str
    difficulty_level: int
    starter_code: Optional[str]
    hints: Optional[List[str]]
    max_score: float
    time_limit_seconds: int


class CodeSubmission(BaseModel):
    exercise_id: str
    code: str


class SubmissionResult(BaseModel):
    id: str
    passed_tests: int
    total_tests: int
    is_correct: bool
    execution_time_ms: int
    ai_score: Optional[float]
    ai_feedback: Optional[str]
    code_quality_score: Optional[float]
    readability_score: Optional[float]
    efficiency_score: Optional[float]
    best_practices_score: Optional[float]
    test_results: List[Dict[str, Any]]


def execute_python_code(code: str, test_input: str, timeout_seconds: int = 5) -> tuple[str, str, int]:
    """
    Ejecuta código Python de forma segura y devuelve output, error y tiempo de ejecución
    """
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
        f.write(code)
        temp_file = f.name
    
    try:
        start_time = time.time()
        result = subprocess.run(
            ['python', temp_file],
            input=test_input,
            capture_output=True,
            text=True,
            timeout=timeout_seconds
        )
        execution_time = int((time.time() - start_time) * 1000)
        
        return result.stdout.strip(), result.stderr.strip(), execution_time
    except subprocess.TimeoutExpired:
        return "", "Error: Tiempo de ejecución excedido", timeout_seconds * 1000
    except Exception as e:
        return "", f"Error: {str(e)}", 0
    finally:
        if os.path.exists(temp_file):
            os.remove(temp_file)


async def evaluate_code_with_ai(code: str, exercise: Exercise, test_results: dict) -> dict:
    """
    Evalúa el código usando Ollama para obtener feedback cualitativo
    """
    # Configurar Ollama con variables de entorno
    ollama_config = {
        "base_url": os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
        "model": os.getenv("OLLAMA_MODEL", "llama3.2:3b"),
        "temperature": float(os.getenv("OLLAMA_TEMPERATURE", "0.7")),
        "timeout": float(os.getenv("OLLAMA_TIMEOUT", "120"))
    }
    llm = OllamaProvider(ollama_config)
    
    prompt = f"""Eres un profesor de programación experto. Evalúa el siguiente código Python:

EJERCICIO: {exercise.title}
DESCRIPCIÓN: {exercise.description}
NIVEL: {exercise.difficulty_level}/10

CÓDIGO DEL ESTUDIANTE:
```python
{code}
```

RESULTADOS DE TESTS:
- Tests pasados: {test_results['passed']}/{test_results['total']}
- Tests correctos: {test_results['passed'] == test_results['total']}

Proporciona una evaluación detallada en formato JSON con:
{{
  "overall_score": <float 0-10>,
  "code_quality": <float 0-10>,
  "readability": <float 0-10>,
  "efficiency": <float 0-10>,
  "best_practices": <float 0-10>,
  "feedback": "<string con feedback constructivo>",
  "strengths": ["<fortaleza1>", "<fortaleza2>"],
  "improvements": ["<mejora1>", "<mejora2>"]
}}

RESPONDE SOLO CON EL JSON, SIN TEXTO ADICIONAL."""

    try:
        response = await llm.generate(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=1000
        )
        
        # Parsear respuesta JSON
        content = response.content.strip()
        # Remover markdown si existe
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
        
        evaluation = json.loads(content.strip())
        return evaluation
    except Exception as e:
        print(f"Error en evaluación de IA: {e}")
        # Fallback a evaluación básica
        base_score = (test_results['passed'] / test_results['total']) * 10 if test_results['total'] > 0 else 0
        return {
            "overall_score": base_score,
            "code_quality": base_score,
            "readability": base_score,
            "efficiency": base_score,
            "best_practices": base_score,
            "feedback": "Evaluación automática: " + ("Código correcto" if test_results['passed'] == test_results['total'] else "Hay errores en algunos tests"),
            "strengths": [],
            "improvements": []
        }


@router.get("", response_model=List[ExerciseResponse])
async def list_exercises(
    difficulty: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Lista todos los ejercicios disponibles"""
    query = db.query(Exercise)
    
    if difficulty is not None:
        query = query.filter(Exercise.difficulty_level == difficulty)
    
    exercises = query.order_by(Exercise.difficulty_level).all()
    
    return [
        {
            "id": ex.id,
            "title": ex.title,
            "description": ex.description,
            "difficulty_level": ex.difficulty_level,
            "starter_code": ex.starter_code,
            "hints": ex.hints,
            "max_score": ex.max_score,
            "time_limit_seconds": ex.time_limit_seconds
        }
        for ex in exercises
    ]


@router.get("/stats")
async def get_user_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtiene estadísticas del usuario"""
    submissions = db.query(UserExerciseSubmission).filter(
        UserExerciseSubmission.user_id == current_user.id
    ).all()
    
    if not submissions:
        return {
            "total_submissions": 0,
            "completed_exercises": 0,
            "average_score": 0.0,
            "total_exercises": 0
        }
    
    correct_count = sum(1 for s in submissions if s.is_correct == "true")
    scores = [s.ai_score for s in submissions if s.ai_score is not None]
    avg_score = sum(scores) / len(scores) if scores else 0.0
    
    unique_exercises = len(set(s.exercise_id for s in submissions))
    
    return {
        "total_submissions": len(submissions),
        "completed_exercises": correct_count,
        "average_score": round(avg_score, 2),
        "total_exercises": unique_exercises
    }


@router.get("/{exercise_id}", response_model=ExerciseResponse)
async def get_exercise(
    exercise_id: str,
    db: Session = Depends(get_db)
):
    """Obtiene un ejercicio específico"""
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    
    if not exercise:
        raise HTTPException(status_code=404, detail="Ejercicio no encontrado")
    
    return {
        "id": exercise.id,
        "title": exercise.title,
        "description": exercise.description,
        "difficulty_level": exercise.difficulty_level,
        "starter_code": exercise.starter_code,
        "hints": exercise.hints,
        "max_score": exercise.max_score,
        "time_limit_seconds": exercise.time_limit_seconds
    }


@router.post("/submit", response_model=SubmissionResult)
async def submit_code(
    submission: CodeSubmission,
    db: Session = Depends(get_db)
):
    """Envía código para evaluación"""
    # Obtener ejercicio
    exercise = db.query(Exercise).filter(Exercise.id == submission.exercise_id).first()
    
    if not exercise:
        raise HTTPException(status_code=404, detail="Ejercicio no encontrado")
    
    # Ejecutar tests
    test_results = []
    passed_tests = 0
    total_tests = len(exercise.test_cases)
    total_execution_time = 0
    
    for i, test_case in enumerate(exercise.test_cases):
        test_input = test_case.get("input", "")
        expected_output = test_case.get("expected_output", "")
        
        output, error, exec_time = execute_python_code(
            submission.code,
            test_input,
            exercise.time_limit_seconds
        )
        
        total_execution_time += exec_time
        
        is_correct = output == expected_output and not error
        if is_correct:
            passed_tests += 1
        
        test_results.append({
            "test_number": i + 1,
            "input": test_input,
            "expected_output": expected_output,
            "actual_output": output,
            "error": error,
            "passed": is_correct,
            "execution_time_ms": exec_time
        })
    
    # Evaluar con IA
    ai_evaluation = await evaluate_code_with_ai(
        submission.code,
        exercise,
        {"passed": passed_tests, "total": total_tests}
    )
    
    # Guardar submission (sin autenticación usar user_id genérico)
    new_submission = UserExerciseSubmission(
        user_id="anonymous",  # TODO: Implementar autenticación
        exercise_id=exercise.id,
        submitted_code=submission.code,
        passed_tests=passed_tests,
        total_tests=total_tests,
        execution_time_ms=total_execution_time,
        ai_score=ai_evaluation.get("overall_score"),
        ai_feedback=json.dumps(ai_evaluation.get("feedback", "")),
        code_quality_score=ai_evaluation.get("code_quality"),
        readability_score=ai_evaluation.get("readability"),
        efficiency_score=ai_evaluation.get("efficiency"),
        best_practices_score=ai_evaluation.get("best_practices"),
        is_correct="true" if passed_tests == total_tests else "false"
    )
    
    db.add(new_submission)
    db.commit()
    db.refresh(new_submission)
    
    return {
        "id": new_submission.id,
        "passed_tests": passed_tests,
        "total_tests": total_tests,
        "is_correct": passed_tests == total_tests,
        "execution_time_ms": total_execution_time,
        "ai_score": ai_evaluation.get("overall_score"),
        "ai_feedback": json.dumps(ai_evaluation, ensure_ascii=False),
        "code_quality_score": ai_evaluation.get("code_quality"),
        "readability_score": ai_evaluation.get("readability"),
        "efficiency_score": ai_evaluation.get("efficiency"),
        "best_practices_score": ai_evaluation.get("best_practices"),
        "test_results": test_results
    }


@router.get("/user/submissions")
async def get_user_submissions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtiene todas las submissions del usuario actual"""
    submissions = db.query(UserExerciseSubmission).filter(
        UserExerciseSubmission.user_id == current_user.id
    ).order_by(UserExerciseSubmission.submitted_at.desc()).all()
    
    return {
        "total": len(submissions),
        "submissions": [
            {
                "id": s.id,
                "exercise_id": s.exercise_id,
                "passed_tests": s.passed_tests,
                "total_tests": s.total_tests,
                "is_correct": s.is_correct,
                "ai_score": s.ai_score,
                "submitted_at": s.submitted_at.isoformat() if s.submitted_at else None
            }
            for s in submissions
        ]
    }
