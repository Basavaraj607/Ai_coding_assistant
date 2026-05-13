# Ai_coding_assistant

Minimal starter project for building an AI coding assistant.

## What this includes
- `assistant.py`: a small CLI assistant.
- OpenAI-compatible API support via environment variables.
- Local fallback response so the project works without API keys.
- Basic unit tests in `tests/test_assistant.py`.

## Quick start
```bash
cd Ai_coding_assistant
python assistant.py "help me design a code review workflow"
```

## Use with an API provider
Set these variables before running:
```bash
export OPENAI_API_KEY="your_api_key"
export OPENAI_BASE_URL="https://api.openai.com/v1"
export OPENAI_MODEL="gpt-4o-mini"
python assistant.py "suggest improvements for my Python project"
```

## Run tests
```bash
python -m unittest discover -s tests -p "test_*.py"
```
