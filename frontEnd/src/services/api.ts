import axios, { AxiosInstance, AxiosError } from 'axios';
import { 
  APIResponse, 
  TokenResponse, 
  LoginCredentials, 
  RegisterData,
  User,
  Session,
  CreateSessionData,
  Interaction,
  InteractionResponse,
  Simulator,
  SimulatorInteraction,
  SimulatorResponse,
  Exercise,
  ExerciseSubmission,
  SubmissionResult,
  Risk,
  HealthStatus,
  CognitivePath,
  PaginatedResponse,
  TraceabilityN4,
  RiskAnalysis5D,
  ProcessEvaluation,
  UserStats
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // ===== Auth Endpoints =====
  async login(credentials: LoginCredentials): Promise<TokenResponse> {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    
    const response = await this.client.post<TokenResponse>('/auth/token', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    return response.data;
  }

  async register(data: RegisterData): Promise<TokenResponse> {
    const response = await this.client.post<TokenResponse>('/auth/register', data);
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<User>('/auth/me');
    return response.data;
  }

  // ===== Sessions Endpoints =====
  async createSession(data: CreateSessionData): Promise<Session> {
    const response = await this.client.post<APIResponse<Session>>('/sessions', data);
    return response.data.data;
  }

  async getSessions(studentId?: string, page: number = 1, pageSize: number = 50): Promise<Session[]> {
    const params: any = { page, page_size: pageSize };
    if (studentId) params.student_id = studentId;
    
    const response = await this.client.get<PaginatedResponse<Session>>('/sessions', { params });
    return response.data.data;
  }

  async getSession(sessionId: string): Promise<Session> {
    const response = await this.client.get<APIResponse<Session>>(`/sessions/${sessionId}`);
    return response.data.data;
  }

  async endSession(sessionId: string): Promise<Session> {
    const response = await this.client.post<APIResponse<Session>>(`/sessions/${sessionId}/end`);
    return response.data.data;
  }

  // ===== Interactions Endpoints =====
  async processInteraction(data: Interaction): Promise<InteractionResponse> {
    const response = await this.client.post<APIResponse<InteractionResponse>>('/interactions', data);
    return response.data.data;
  }

  // ===== Simulators Endpoints =====
  async getSimulators(): Promise<Simulator[]> {
    const response = await this.client.get<APIResponse<Simulator[]>>('/simulators');
    return response.data.data;
  }

  async interactWithSimulator(data: SimulatorInteraction): Promise<SimulatorResponse> {
    const response = await this.client.post<APIResponse<SimulatorResponse>>('/simulators/interact', data, {
      timeout: 60000
    });
    return response.data.data;
  }

  // ===== Exercises Endpoints =====
  async getExercises(): Promise<Exercise[]> {
    const response = await this.client.get<Exercise[]>('/exercises');
    return response.data;
  }

  async getExercise(exerciseId: string): Promise<Exercise> {
    const response = await this.client.get<Exercise>(`/exercises/${exerciseId}`);
    return response.data;
  }

  async submitExercise(data: ExerciseSubmission): Promise<SubmissionResult> {
    const response = await this.client.post<SubmissionResult>('/exercises/submit', data, {
      timeout: 60000
    });
    return response.data;
  }

  // ===== Risks Endpoints =====
  async getRisks(sessionId?: string): Promise<Risk[]> {
    const params = sessionId ? { session_id: sessionId } : {};
    const response = await this.client.get<APIResponse<Risk[]>>('/risks', { params });
    return response.data.data;
  }

  async analyzeSessionRisks(sessionId: string): Promise<Risk[]> {
    const response = await this.client.post<APIResponse<Risk[]>>(`/risks/analyze-session/${sessionId}`, {}, {
      timeout: 60000
    });
    return response.data.data;
  }

  // ===== Cognitive Path Endpoints =====
  async getCognitivePath(sessionId: string): Promise<CognitivePath> {
    const response = await this.client.get<APIResponse<CognitivePath>>(`/cognitive-path/${sessionId}`);
    return response.data.data;
  }

  // ===== Traceability N4 Endpoints =====
  async getTraceabilityN4(traceId: string): Promise<TraceabilityN4> {
    const response = await this.client.get<APIResponse<TraceabilityN4>>(`/traceability/${traceId}`, {
      timeout: 30000
    });
    return response.data.data;
  }

  // ===== Risk Analysis 5D Endpoints =====
  async analyzeRisks5D(sessionId: string): Promise<RiskAnalysis5D> {
    const response = await this.client.get<APIResponse<RiskAnalysis5D>>(`/risks/${sessionId}`, {
      timeout: 120000 // 2 minutos para análisis con LLM
    });
    return response.data.data;
  }

  // ===== Evaluations Endpoints =====
  async generateEvaluation(sessionId: string): Promise<ProcessEvaluation> {
    const response = await this.client.post<APIResponse<ProcessEvaluation>>(
      `/evaluations/${sessionId}/generate`,
      {},
      { timeout: 90000 }
    );
    return response.data.data;
  }

  async getEvaluation(sessionId: string): Promise<ProcessEvaluation> {
    const response = await this.client.get<APIResponse<ProcessEvaluation>>(`/evaluations/${sessionId}`);
    return response.data.data;
  }

  // ===== Stats & Analytics Endpoints =====
  async getUserStats(): Promise<UserStats> {
    const response = await this.client.get<APIResponse<UserStats>>('/exercises/stats');
    return response.data.data;
  }

  async getUserSubmissions(): Promise<SubmissionResult[]> {
    const response = await this.client.get<APIResponse<SubmissionResult[]>>('/exercises/user/submissions');
    return response.data.data;
  }

  // ===== Health Endpoints =====
  async getHealth(): Promise<HealthStatus> {
    const response = await this.client.get<HealthStatus>('/health');
    return response.data;
  }

  async getHealthDeep(): Promise<HealthStatus> {
    const response = await this.client.get<HealthStatus>('/health/deep');
    return response.data;
  }

  // ===== Utility Methods =====
  setToken(token: string | null) {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}

export const api = new ApiService();
export default api;
