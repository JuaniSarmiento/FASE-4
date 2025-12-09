import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('[API Error]', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string | null) {
    if (token) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.client.defaults.headers.common['Authorization'];
    }
  }

  // Sessions
  async createSession(data: { student_id: string; activity_id: string; mode: string; simulator_type?: string }) {
    const response = await this.client.post('/sessions', data);
    return response.data;
  }

  async getSessions(studentId?: string) {
    const params = studentId ? { student_id: studentId } : {};
    const response = await this.client.get('/sessions', { params });
    return response.data;
  }

  async getSession(sessionId: string) {
    const response = await this.client.get(`/sessions/${sessionId}`);
    return response.data;
  }

  // Interactions
  async processInteraction(data: { session_id: string; prompt: string; context?: any }) {
    const response = await this.client.post('/interactions', data);
    return response.data;
  }

  async getInteractions(sessionId: string) {
    const response = await this.client.get(`/interactions`, { params: { session_id: sessionId } });
    return response.data;
  }

  // Simulators
  async getSimulators() {
    const response = await this.client.get('/simulators');
    return response.data;
  }

  async interactWithSimulator(data: { session_id: string; simulator_type: string; prompt: string; context?: any }) {
    const response = await this.client.post('/simulators/interact', {
      session_id: data.session_id,
      simulator_type: data.simulator_type,
      prompt: data.prompt,
      context: data.context || {}
    }, {
      timeout: 60000  // 60 segundos para simuladores complejos como Incident Responder
    });
    return response.data;
  }

  // Events
  async createEvent(data: { session_id: string; event_type: string; event_data: any; description?: string; severity?: string }) {
    const response = await this.client.post('/events', data);
    return response.data;
  }

  async getEvents(sessionId?: string, studentId?: string) {
    const params: any = {};
    if (sessionId) params.session_id = sessionId;
    if (studentId) params.student_id = studentId;
    const response = await this.client.get('/events', { params });
    return response.data;
  }

  // Risks
  async analyzeRisks(sessionId: string) {
    const response = await this.client.get(`/risks/${sessionId}`);
    return response.data;
  }

  // Risks
  async getRisks(params?: { session_id?: string }) {
    const response = await this.client.get('/risks', { params });
    return response.data;
  }

  async analyzeSessionRisks(sessionId: string) {
    const response = await this.client.post(`/risks/analyze-session/${sessionId}`, {}, {
      timeout: 60000  // 60 segundos para análisis completo
    });
    return response.data;
  }

  // Evaluations
  async generateEvaluation(data: { session_id: string; interaction_id?: string }) {
    const response = await this.client.post('/evaluations/generate', data, {
      timeout: 120000  // 120 segundos para evaluación con LLM
    });
    return response.data;
  }

  async getEvaluations(params?: { session_id?: string; interaction_id?: string }) {
    const response = await this.client.get('/evaluations', { params });
    return response.data;
  }

  // Traceability
  async getTraceability(traceId: string) {
    const response = await this.client.get(`/traceability/${traceId}`);
    return response.data;
  }

  async getSessionTraceability(sessionId: string) {
    const response = await this.client.get(`/traceability/session/${sessionId}`, {
      timeout: 45000  // 45 segundos para grafo completo
    });
    return response.data;
  }

  // Git Analytics
  async getGitAnalytics(sessionId: string) {
    const response = await this.client.get(`/git-analytics/${sessionId}`);
    return response.data;
  }

  // Health
  async checkHealth() {
    const response = await this.client.get('/health');
    return response.data;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
