"""
Ollama LLM provider implementation

Provides integration with Ollama (local LLM server)

Ollama is a lightweight framework to run open-source LLMs locally.
It supports models like Llama 2, Mistral, Code Llama, and many others.

Note: Requires 'httpx' package to be installed:
    pip install httpx

Note: Ollama must be running locally or accessible via network.
    Install: https://ollama.ai
    Start server: ollama serve
    Pull models: ollama pull llama2
"""
from typing import Optional, Dict, Any, List, AsyncIterator
import logging
import httpx
import json
from contextlib import asynccontextmanager

from .base import LLMProvider, LLMMessage, LLMResponse, LLMRole

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


class OllamaProvider(LLMProvider):
    """
    Ollama LLM provider (local models)

    Supports:
    - Llama 2 (llama2, llama2:13b, llama2:70b)
    - Mistral (mistral, mistral:7b)
    - Code Llama (codellama, codellama:13b)
    - Gemma (gemma:2b, gemma:7b)
    - And many other open-source models

    Configuration:
        base_url: Ollama server URL (default: http://localhost:11434)
        model: Model name (default: llama2)
        temperature: Sampling temperature (default: 0.7)
        timeout: Request timeout in seconds (default: 60)

    Example:
        >>> provider = OllamaProvider({
        ...     "base_url": "http://ollama:11434",
        ...     "model": "llama2",
        ...     "temperature": 0.7
        ... })
        >>> response = provider.generate(messages)

    Features:
    - 100% local execution (no API keys required)
    - Privacy-focused (data never leaves your infrastructure)
    - Cost-effective (no per-token charges)
    - Offline capable
    - Customizable models
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        super().__init__(config)

        # Configuration with sensible defaults
        self.base_url = self.config.get("base_url", "http://localhost:11434")
        self.model = self.config.get("model", "llama2")
        self.temperature = self.config.get("temperature", 0.7)
        self.timeout = self.config.get("timeout", 60.0)

        # Remove trailing slash from base_url
        self.base_url = self.base_url.rstrip("/")

        # API endpoint
        self.chat_endpoint = f"{self.base_url}/api/chat"

        # HTTP client (will be initialized lazily)
        self._client: Optional[httpx.AsyncClient] = None

        logger.info(
            "Ollama provider initialized",
            extra={
                "base_url": self.base_url,
                "model": self.model,
                "temperature": self.temperature,
                "timeout": self.timeout
            }
        )

    def _get_client(self) -> httpx.AsyncClient:
        """Lazy initialization of HTTP client. Creates persistent connection."""
        if self._client is None:
            self._client = httpx.AsyncClient(
                timeout=httpx.Timeout(self.timeout),
                limits=httpx.Limits(max_keepalive_connections=5, max_connections=10)
            )
        return self._client

    async def _close_client(self):
        """Close HTTP client and cleanup resources."""
        if self._client is not None:
            await self._client.aclose()
            self._client = None

    def _convert_messages_to_ollama_format(self, messages: List[LLMMessage]) -> List[Dict[str, str]]:
        """
        Convert LLMMessage list to Ollama chat format

        Ollama expects:
        [
            {"role": "system", "content": "You are a helpful assistant"},
            {"role": "user", "content": "Hello!"},
            {"role": "assistant", "content": "Hi there!"}
        ]

        Args:
            messages: List of LLMMessage objects

        Returns:
            List of message dicts in Ollama format
        """
        ollama_messages = []
        for msg in messages:
            # Soportar tanto objetos LLMMessage como dicts simples
            if isinstance(msg, dict):
                ollama_messages.append({
                    "role": msg.get("role"),
                    "content": msg.get("content")
                })
            else:
                ollama_messages.append({
                    "role": msg.role.value,  # "system", "user", or "assistant"
                    "content": msg.content
                })
        return ollama_messages

    async def generate(
        self,
        messages: List[LLMMessage],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> LLMResponse:
        """
        Generate completion using Ollama API

        Args:
            messages: List of conversation messages
            temperature: Sampling temperature (overrides config default)
            max_tokens: Maximum tokens in response (Ollama uses 'num_predict')
            **kwargs: Additional Ollama-specific parameters

        Returns:
            LLMResponse with generated content and metadata

        Raises:
            httpx.ConnectError: If Ollama server is unreachable
            httpx.TimeoutException: If request times out
            ValueError: If response format is invalid
        """
        # Use provided temperature or fall back to config
        temp = temperature if temperature is not None else self.temperature

        # ✅ HIGH-01: Use context manager to track LLM call duration
        metrics = _get_metrics()
        if metrics:
            with metrics.record_llm_call("ollama", self.model):
                return await self._execute_ollama_call(messages, temp, max_tokens, **kwargs)
        else:
            return await self._execute_ollama_call(messages, temp, max_tokens, **kwargs)

    async def _execute_ollama_call(
        self,
        messages: List[LLMMessage],
        temperature: float,
        max_tokens: Optional[int],
        **kwargs
    ) -> LLMResponse:
        """Execute the actual Ollama API call (extracted for metrics instrumentation)"""
        client = self._get_client()

        # Convert messages to Ollama format
        ollama_messages = self._convert_messages_to_ollama_format(messages)

        # Build request payload
        payload = {
            "model": self.model,
            "messages": ollama_messages,
            "stream": False,  # Non-streaming mode
            "options": {
                "temperature": temperature,
            }
        }

        # Add num_predict if max_tokens is specified
        if max_tokens is not None:
            payload["options"]["num_predict"] = max_tokens

        # Add any additional Ollama-specific options
        if kwargs:
            payload["options"].update(kwargs)

        try:
            # Make API request
            response = await client.post(
                self.chat_endpoint,
                json=payload,
                headers={"Content-Type": "application/json"}
            )

            # Check for HTTP errors
            response.raise_for_status()

            # Parse response
            data = response.json()

            # Extract generated content
            content = data.get("message", {}).get("content", "")
            if not content:
                raise ValueError("Ollama returned empty response")

            # Extract token usage
            # Ollama returns: prompt_eval_count (input tokens), eval_count (output tokens)
            prompt_tokens = data.get("prompt_eval_count", 0)
            completion_tokens = data.get("eval_count", 0)
            total_tokens = prompt_tokens + completion_tokens

            # Build LLMResponse
            return LLMResponse(
                content=content,
                model=self.model,
                usage={
                    "prompt_tokens": prompt_tokens,
                    "completion_tokens": completion_tokens,
                    "total_tokens": total_tokens
                },
                metadata={
                    "provider": "ollama",
                    "base_url": self.base_url,
                    "temperature": temperature,
                    "total_duration": data.get("total_duration"),
                    "load_duration": data.get("load_duration"),
                    "prompt_eval_duration": data.get("prompt_eval_duration"),
                    "eval_duration": data.get("eval_duration"),
                }
            )

        except httpx.ConnectError as e:
            logger.error(
                f"Failed to connect to Ollama server at {self.base_url}",
                extra={"error": str(e)}
            )
            raise ValueError(
                f"❌ Cannot connect to Ollama server at {self.base_url}. "
                f"Make sure Ollama is running:\n"
                f"  1. Install Ollama: https://ollama.ai\n"
                f"  2. Start server: ollama serve\n"
                f"  3. Pull model: ollama pull {self.model}\n"
                f"Error details: {str(e)}"
            ) from e

        except httpx.TimeoutException as e:
            logger.error(
                f"Ollama request timed out after {self.timeout}s",
                extra={"model": self.model, "error": str(e)}
            )
            raise ValueError(
                f"⏱️  Ollama request timed out after {self.timeout}s. "
                f"Try increasing timeout or using a smaller model."
            ) from e

        except httpx.HTTPStatusError as e:
            logger.error(
                f"Ollama HTTP error: {e.response.status_code}",
                extra={"status_code": e.response.status_code, "response": e.response.text}
            )
            raise ValueError(
                f"❌ Ollama API error ({e.response.status_code}): {e.response.text}"
            ) from e

        except (KeyError, json.JSONDecodeError) as e:
            logger.error(
                "Failed to parse Ollama response",
                extra={"error": str(e), "response": response.text if response else None}
            )
            raise ValueError(
                f"❌ Invalid response format from Ollama: {str(e)}"
            ) from e

    async def generate_stream(
        self,
        messages: List[LLMMessage],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> AsyncIterator[str]:
        """
        Generate streaming completion using Ollama API

        Args:
            messages: List of conversation messages
            temperature: Sampling temperature (overrides config default)
            max_tokens: Maximum tokens in response
            **kwargs: Additional Ollama-specific parameters

        Yields:
            Chunks of generated content as they arrive

        Example:
            >>> async for chunk in provider.generate_stream(messages):
            ...     print(chunk, end="", flush=True)
        """
        # Use provided temperature or fall back to config
        temp = temperature if temperature is not None else self.temperature

        client = self._get_client()

        # Convert messages to Ollama format
        ollama_messages = self._convert_messages_to_ollama_format(messages)

        # Build request payload
        payload = {
            "model": self.model,
            "messages": ollama_messages,
            "stream": True,  # Enable streaming mode
            "options": {
                "temperature": temp,
            }
        }

        # Add num_predict if max_tokens is specified
        if max_tokens is not None:
            payload["options"]["num_predict"] = max_tokens

        # Add any additional Ollama-specific options
        if kwargs:
            payload["options"].update(kwargs)

        try:
            # Make streaming API request
            async with client.stream(
                "POST",
                self.chat_endpoint,
                json=payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                response.raise_for_status()

                # Stream response line by line
                async for line in response.aiter_lines():
                    if not line.strip():
                        continue

                    try:
                        data = json.loads(line)

                        # Extract content chunk
                        chunk = data.get("message", {}).get("content", "")
                        if chunk:
                            yield chunk

                        # Check if stream is done
                        if data.get("done", False):
                            break

                    except json.JSONDecodeError:
                        logger.warning(f"Failed to parse streaming chunk: {line}")
                        continue

        except httpx.ConnectError as e:
            logger.error(f"Failed to connect to Ollama server: {str(e)}")
            raise ValueError(
                f"❌ Cannot connect to Ollama server at {self.base_url}. "
                f"Make sure Ollama is running."
            ) from e

        except httpx.HTTPStatusError as e:
            logger.error(f"Ollama streaming error: {e.response.status_code}")
            raise ValueError(
                f"❌ Ollama API error ({e.response.status_code}): {e.response.text}"
            ) from e

    def count_tokens(self, text: str) -> int:
        """
        Estimate token count for text

        Note: Ollama doesn't provide a direct token counting API.
        This is a rough approximation using character count.

        For accurate token counting, consider using the model's tokenizer directly.

        Args:
            text: Input text

        Returns:
            Estimated number of tokens (roughly 1 token per 4 characters)
        """
        # Rough approximation: 1 token ≈ 4 characters for English text
        # This varies by model and language
        return len(text) // 4

    async def is_model_available(self) -> bool:
        """
        Check if the specified model is available in Ollama

        Returns:
            True if model is available, False otherwise
        """
        client = self._get_client()

        try:
            # Get list of available models
            response = await client.get(f"{self.base_url}/api/tags")
            response.raise_for_status()

            data = response.json()
            models = data.get("models", [])

            # Check if our model is in the list
            for model in models:
                if model.get("name", "").startswith(self.model):
                    return True

            return False

        except Exception as e:
            logger.warning(f"Failed to check model availability: {str(e)}")
            return False

    async def list_available_models(self) -> List[str]:
        """
        Get list of all models available in Ollama

        Returns:
            List of model names

        Example:
            >>> models = await provider.list_available_models()
            >>> print(models)
            ['llama2:latest', 'mistral:7b', 'codellama:13b']
        """
        client = self._get_client()

        try:
            response = await client.get(f"{self.base_url}/api/tags")
            response.raise_for_status()

            data = response.json()
            models = data.get("models", [])

            return [model.get("name", "") for model in models if model.get("name")]

        except Exception as e:
            logger.error(f"Failed to list models: {str(e)}")
            return []

    def __del__(self):
        """Cleanup when provider is destroyed"""
        # Note: __del__ cannot be async, so we just log if client is still open
        if self._client is not None:
            logger.warning("OllamaProvider destroyed with open HTTP client. Call _close_client() explicitly.")
