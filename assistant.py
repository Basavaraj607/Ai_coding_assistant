"""Minimal CLI AI coding assistant.

This script can talk to an OpenAI-compatible chat-completions API when
`OPENAI_API_KEY` is set. Without an API key it falls back to a local starter
response so the project remains runnable out of the box.
"""

from __future__ import annotations

import argparse
import json
import os
import textwrap
from dataclasses import dataclass
from urllib import error, request


@dataclass(frozen=True)
class AssistantConfig:
    api_key: str | None = os.getenv("OPENAI_API_KEY")
    base_url: str = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
    model: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")


def build_payload(prompt: str, system_prompt: str, model: str) -> dict:
    return {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.2,
    }


def local_bootstrap_response(prompt: str) -> str:
    return textwrap.dedent(
        f"""
        I can help you bootstrap your AI coding assistant project.

        Suggested next steps:
        1. Define your assistant scope (CLI, web app, or IDE plugin).
        2. Pick an LLM provider and store API credentials in environment variables.
        3. Add repository-aware features (read files, suggest edits, run tests).

        Your input: {prompt}
        """
    ).strip()


def fetch_completion(prompt: str, system_prompt: str, config: AssistantConfig | None = None) -> str:
    cfg = config or AssistantConfig()
    if not cfg.api_key:
        return local_bootstrap_response(prompt)

    payload = build_payload(prompt, system_prompt, cfg.model)
    body = json.dumps(payload).encode("utf-8")
    req = request.Request(
        f"{cfg.base_url}/chat/completions",
        method="POST",
        data=body,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {cfg.api_key}",
        },
    )

    try:
        with request.urlopen(req, timeout=30) as resp:
            parsed = json.loads(resp.read().decode("utf-8"))
    except (error.URLError, TimeoutError, json.JSONDecodeError):
        return f"Request failed.\n\n{local_bootstrap_response(prompt)}"

    choices = parsed.get("choices", [])
    if not choices:
        return "No response choices returned by API."

    content = choices[0].get("message", {}).get("content", "")
    return content or "Model returned an empty response."


def main() -> None:
    parser = argparse.ArgumentParser(description="Minimal AI coding assistant CLI")
    parser.add_argument("prompt", help="Coding request for the assistant")
    parser.add_argument(
        "--system",
        default="You are a helpful coding assistant.",
        help="System instruction for the assistant",
    )
    args = parser.parse_args()

    print(fetch_completion(args.prompt, args.system))


if __name__ == "__main__":
    main()
