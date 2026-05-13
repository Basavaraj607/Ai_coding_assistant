import unittest

from assistant import build_payload, fetch_completion


class AssistantTests(unittest.TestCase):
    def test_build_payload_structure(self):
        payload = build_payload("hello", "be helpful", "gpt-4o-mini")
        self.assertIn("model", payload)
        self.assertEqual(payload["messages"][0]["role"], "system")
        self.assertEqual(payload["messages"][1]["content"], "hello")

    def test_fetch_completion_uses_local_fallback_without_key(self):
        response = fetch_completion("build assistant", "you are helpful")
        self.assertIn("bootstrap your AI coding assistant", response)


if __name__ == "__main__":
    unittest.main()
