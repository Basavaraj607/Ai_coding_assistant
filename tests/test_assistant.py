import unittest
from unittest.mock import patch

from assistant import AssistantConfig, build_payload, fetch_completion


class AssistantTests(unittest.TestCase):
    def test_build_payload_structure(self):
        payload = build_payload("hello", "be helpful", "gpt-4o-mini")
        self.assertIn("model", payload)
        self.assertEqual(payload["messages"][0]["role"], "system")
        self.assertEqual(payload["messages"][1]["content"], "hello")

    def test_fetch_completion_uses_local_fallback_without_key(self):
        response = fetch_completion("build assistant", "you are helpful")
        self.assertIn("bootstrap your AI coding assistant", response)

    @patch("assistant.request.urlopen")
    def test_fetch_completion_uses_api_when_key_is_set(self, mock_urlopen):
        mock_urlopen.return_value.__enter__.return_value.read.return_value = (
            b'{"choices":[{"message":{"content":"API response"}}]}'
        )
        cfg = AssistantConfig(api_key="test-key", base_url="https://example.com/v1", model="test-model")

        response = fetch_completion("build assistant", "you are helpful", config=cfg)

        self.assertEqual(response, "API response")


if __name__ == "__main__":
    unittest.main()
