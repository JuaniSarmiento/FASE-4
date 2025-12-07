1/# 🎓 AI-Native Student App - Frontend

**Aplicación React + TypeScript para estudiantes del ecosistema AI-Native**

Interfaz tipo chatbot para interactuar con el tutor AI cognitivo, permitiendo aprendizaje de programación con IA generativa bajo un modelo pedagógico que evalúa procesos (no solo productos).

---

## 📋 Tabla de Contenidos

- [Características](#características)
- [Tecnologías](#tecnologías)
- [Arquitectura](#arquitectura)
- [Instalación](#instalación)
- [Uso](#uso)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [API Integration](#api-integration)
- [Desarrollo](#desarrollo)

---

## ✨ Características

### Funcionalidades Principales

- **Chat en Tiempo Real**: Interfaz conversacional fluida con el tutor AI
- **Gestión de Sesiones**: Crear, mantener y finalizar sesiones de aprendizaje
- **Múltiples Modos**: Tutor Cognitivo, Simulador Profesional, Evaluador
- **Metadatos Cognitivos**: Visualización de estado cognitivo, agente usado, nivel de involucramiento de IA
- **Sistema de Gobernanza**: Detección y visualización de bloqueos pedagógicos
- **Alertas de Riesgos**: Notificaciones cuando se detectan riesgos cognitivos/éticos
- **Markdown Support**: Respuestas formateadas del tutor (código, listas, énfasis)
- **Manejo de Errores**: Sistema robusto de captura y visualización de errores
- **Responsive**: Adaptable a diferentes tamaños de pantalla

### Experiencia de Usuario

- Interfaz limpia y moderna
- Indicadores de carga durante procesamiento
- Timestamps relativos (hace 2 minutos, etc.)
- Scroll automático a último mensaje
- Accesibilidad keyboard-first (Enter para enviar, Shift+Enter para nueva línea)

---

## 🛠️ Tecnologías

### Core

- **React 18.2** - Librería UI
- **TypeScript 5.2** - Tipado estático
- **Vite 5.0** - Build tool & dev server

### Estado y Comunicación

- **Context API** - Gestión de estado global
- **Axios 1.6** - Cliente HTTP con interceptores

### UI/UX

- **React Markdown 9.0** - Renderizado de Markdown
- **date-fns 3.0** - Formateo de fechas
- **clsx 2.0** - Utilidad para clases condicionales

### Desarrollo

- **ESLint** - Linting de código
- **TypeScript ESLint** - Reglas específicas de TS
- **Vite Plugin React** - HMR (Hot Module Replacement)

---

## 🏗️ Arquitectura

### Patrón de Diseño

La aplicación sigue una **arquitectura limpia en capas**:

```
┌─────────────────────────────────────────┐
│         UI LAYER (Components)           │
│  - ChatContainer, ChatMessages, etc.    │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│      STATE LAYER (Context API)          │
│  - ChatContext (session, messages)      │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│      SERVICE LAYER (API Services)       │
│  - sessions, interactions, traces, etc. │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│      HTTP LAYER (Axios Client)          │
│  - Request/Response interceptors        │
│  - Error handling                       │
└─────────────────────────────────────────┘
```

### Flujo de Datos

```
User Input → Component → Context (useChat)
                            ↓
                    Service (interactionsService)
                            ↓
                    HTTP Client (axios)
                            ↓
                    Backend API (FastAPI)
                            ↓
                    Response ← Parse ← Interceptor
                            ↓
                    Context Update
                            ↓
                    Component Re-render
```

### Responsabilidades por Capa

| Capa | Responsabilidad | Ejemplo |
|------|----------------|---------|
| **Components** | Renderizado y eventos UI | `ChatMessage.tsx` |
| **Context** | Estado global y lógica de negocio | `ChatContext.tsx` |
| **Services** | Comunicación con API | `interactions.service.ts` |
| **HTTP Client** | Configuración de requests | `client.ts` |
| **Types** | Contratos de datos | `api.types.ts` |

---

## 🚀 Instalación

### Prerequisitos

- **Node.js** >= 18.x
- **npm** >= 9.x (o pnpm, yarn)
- **Backend API** corriendo en `http://localhost:8000`

### Pasos

1. **Clonar el repositorio** (si no lo has hecho):
   ```bash
   cd Tesis/frontEnd
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**:
   ```bash
   cp .env.example .env
   ```

   Editar `.env`:
   ```
   VITE_API_BASE_URL=http://localhost:8000/api/v1
   ```

4. **Verificar que el backend esté corriendo**:
   ```bash
   # En otro terminal, desde la raíz del proyecto
   cd ..
   python scripts/run_api.py
   ```

5. **Iniciar desarrollo**:
   ```bash
   npm run dev
   ```

6. **Abrir en el navegador**:
   ```
   http://localhost:3000
   ```

---

## 🎮 Uso

### Iniciar una Sesión

1. Al abrir la app, verás el formulario de inicio
2. Completa:
   - **ID de Estudiante**: Ej: `student_001`
   - **ID de Actividad**: Ej: `prog2_tp1_colas`
   - **Modo**: Selecciona `Tutor Cognitivo`
3. Click en **Iniciar Sesión**

### Interactuar con el Tutor

1. Escribe tu pregunta en el campo de texto
2. Presiona `Enter` (o `Shift+Enter` para nueva línea)
3. El tutor procesará tu solicitud y responderá

### Ejemplos de Preguntas

**Conceptuales** (permitidas):
```
¿Qué es una cola circular?
¿En qué se diferencia de una cola simple?
¿Cuándo debería usar una cola vs una pila?
```

**Delegación Total** (bloqueadas):
```
Dame el código completo de una cola circular
Resolvelo vos
Haceme la implementación
```

**Solicitud de Ayuda Específica** (permitida con pistas graduadas):
```
¿Cómo manejo el caso cuando la cola está llena?
¿Es correcto usar el operador módulo para el índice?
¿Qué estructura de datos debería elegir?
```

### Finalizar Sesión

1. Click en **Finalizar Sesión** (botón superior derecho)
2. El sistema generará tu evaluación de proceso cognitivo
3. Podrás ver tu camino cognitivo y nivel de competencia alcanzado

---

## 📁 Estructura del Proyecto

```
frontEnd/
├── public/
│   └── vite.svg                 # Favicon
├── src/
│   ├── components/
│   │   └── Chat/
│   │       ├── ChatContainer.tsx   # Contenedor principal
│   │       ├── ChatHeader.tsx      # Header con info de sesión
│   │       ├── ChatMessages.tsx    # Lista de mensajes
│   │       ├── ChatMessage.tsx     # Mensaje individual
│   │       ├── ChatInput.tsx       # Input de usuario
│   │       ├── SessionStarter.tsx  # Formulario de inicio
│   │       └── Chat.css            # Estilos del chat
│   ├── contexts/
│   │   └── ChatContext.tsx         # Context API para estado global
│   ├── services/
│   │   └── api/
│   │       ├── client.ts           # Cliente axios configurado
│   │       ├── sessions.service.ts # Servicio de sesiones
│   │       ├── interactions.service.ts # Servicio de interacciones
│   │       ├── traces.service.ts   # Servicio de trazabilidad
│   │       ├── risks.service.ts    # Servicio de riesgos
│   │       ├── health.service.ts   # Servicio de health checks
│   │       └── index.ts            # Barrel export
│   ├── types/
│   │   └── api.types.ts            # Tipos TypeScript de la API
│   ├── App.tsx                     # Componente raíz
│   ├── App.css                     # Estilos globales
│   ├── main.tsx                    # Entry point
│   └── index.css                   # CSS base
├── .env.example                    # Ejemplo de variables de entorno
├── .eslintrc.cjs                   # Configuración ESLint
├── .gitignore                      # Archivos ignorados por Git
├── index.html                      # HTML base
├── package.json                    # Dependencias y scripts
├── tsconfig.json                   # Configuración TypeScript
├── tsconfig.node.json              # Config TS para Vite
├── vite.config.ts                  # Configuración Vite
├── README.md                       # Este archivo
└── SETUP_COMPLETE.md               # Guía de archivos faltantes
```

---

## 🔌 API Integration

### Endpoints Utilizados

| Servicio | Endpoint | Método | Uso |
|----------|----------|--------|-----|
| Sessions | `/sessions` | POST | Crear sesión |
| Sessions | `/sessions/{id}/end` | POST | Finalizar sesión |
| Interactions | `/interactions` | POST | Procesar mensaje |
| Traces | `/traces/{session_id}` | GET | Obtener trazas |
| Risks | `/risks/session/{session_id}` | GET | Obtener riesgos |

### Tipos de Datos

Todos los tipos están definidos en `src/types/api.types.ts`:

- `SessionCreate`, `SessionResponse`
- `InteractionRequest`, `InteractionResponse`
- `CognitiveTrace`, `Risk`, `EvaluationReport`
- `ChatMessage` (tipo específico del frontend)

### Interceptores HTTP

**Request Interceptor** (`client.ts`):
- Log de requests (solo en dev)
- Agregar headers de autenticación (preparado para futuro)

**Response Interceptor** (`client.ts`):
- Log de responses (solo en dev)
- Manejo de errores por código HTTP:
  - 400: Validation error
  - 403: Governance block
  - 404: Not found
  - 500: Server error
- Transformación de errores a formato consistente

---

## 💻 Desarrollo

### Scripts Disponibles

```bash
# Desarrollo con HMR
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview

# Linting
npm run lint

# Type checking
npm run type-check
```

### Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | URL base de la API | `http://localhost:8000/api/v1` |

### Convenciones de Código

- **Componentes**: PascalCase (`ChatContainer.tsx`)
- **Servicios**: camelCase (`sessions.service.ts`)
- **Tipos**: PascalCase (`SessionResponse`)
- **Hooks**: camelCase con prefijo `use` (`useChat`)
- **Estilos**: CSS clásico con BEM-like naming

### Path Aliases

Configurados en `tsconfig.json` y `vite.config.ts`:

```typescript
import { useChat } from '@/contexts/ChatContext';
import { sessionsService } from '@/services/api';
import type { SessionResponse } from '@/types/api.types';
```

### Agregar Nuevos Servicios

1. Crear servicio en `src/services/api/`:
   ```typescript
   // mi-servicio.service.ts
   import { get, post } from './client';

   export const miServicio = {
     obtener: async (id: string) => {
       return get(`/mi-endpoint/${id}`);
     },
   };
   ```

2. Exportar en `src/services/api/index.ts`:
   ```typescript
   export { miServicio } from './mi-servicio.service';
   ```

3. Usar en componentes/contexts:
   ```typescript
   import { miServicio } from '@/services/api';

   const data = await miServicio.obtener('123');
   ```

### Debugging

**Dev Tools**:
- React Developer Tools (extensión browser)
- Redux DevTools (compatible con Context API via wrapper)

**Console Logs**:
- Todos los requests/responses se loggean en desarrollo
- Errores se muestran con contexto completo

**Network Tab**:
- Inspeccionar requests en browser DevTools
- Ver headers, payloads, responses

---

## 🧪 Testing (Futuro)

### Estructura Propuesta

```
tests/
├── unit/
│   ├── components/
│   ├── services/
│   └── utils/
├── integration/
│   └── flows/
└── e2e/
    └── scenarios/
```

### Herramientas Sugeridas

- **Vitest** - Unit testing
- **React Testing Library** - Component testing
- **MSW (Mock Service Worker)** - API mocking
- **Playwright** - E2E testing

---

## 📚 Recursos

### Documentación Relacionada

- [Backend API Documentation](../README_API.md)
- [User Stories](../USER_STORIES.md)
- [Tesis Doctoral](../tesis.txt)

### Frameworks

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Axios Documentation](https://axios-http.com/docs/intro)

---

## 🤝 Contribución

### Workflow

1. Crear feature branch desde `main`
2. Desarrollar siguiendo convenciones
3. Testear localmente
4. Crear Pull Request

### Commit Messages

Formato: `<type>: <description>`

Tipos:
- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `refactor`: Refactorización sin cambio de funcionalidad
- `style`: Cambios de formato/estilo
- `docs`: Documentación
- `test`: Tests

Ejemplo:
```
feat: add cognitive path visualization
fix: handle network errors in chat input
refactor: extract message metadata to component
```

---

## 📄 Licencia

Este proyecto es parte de una tesis doctoral sobre enseñanza-aprendizaje de programación con IA generativa.

**Autor**: Mag. en Ing. de Software Alberto Cortez

---

## 🐛 Problemas Conocidos

### Issues Actuales

1. **Locale en date-fns**: Requiere import de `es` locale
2. **Markdown rendering**: Algunos bloques de código pueden no resaltarse
3. **Scroll behavior**: En algunos navegadores puede ser lento

### Soluciones

Ver [SETUP_COMPLETE.md](./SETUP_COMPLETE.md) para detalles de implementación completa.

---

## 🎯 Roadmap

### v1.1 (Próxima versión)

- [ ] Vista de trazabilidad N4 (camino cognitivo visualizado)
- [ ] Dashboard de evaluación de procesos
- [ ] Gráficos de evolución de dependencia de IA
- [ ] Historial de sesiones previas
- [ ] Export de conversación a PDF

### v2.0 (Futuro)

- [ ] Modo oscuro
- [ ] Múltiples idiomas (i18n)
- [ ] Autenticación con JWT
- [ ] Notificaciones push
- [ ] Integración con Git (trazabilidad N2)
- [ ] Tests E2E completos

---

**¿Preguntas o sugerencias?** Abre un issue en el repositorio.