
import os
import json

from typing import TypedDict, Any
from dotenv import load_dotenv
from groq import Groq
from langgraph.graph import StateGraph, END

load_dotenv()


class InvestigationState(TypedDict, total=False):
    title: str
    description: str
    severity: str
    source: str
    analysis: dict[str, Any]


def analyze_incident(state: InvestigationState):
    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        raise ValueError(
            "GROQ_API_KEY is missing. Configure it in backend/.env"
        )

    client = Groq(api_key=api_key)

    prompt = f"""
You are an AI assistant supporting pharmaceutical quality
investigations.

Analyze the following incident and produce a preliminary
investigation report.

INCIDENT DETAILS
Title: {state["title"]}
Description: {state["description"]}
Severity: {state["severity"]}
Source: {state["source"]}

Return valid JSON with exactly these fields:

{{
  "summary": "Brief summary of the incident",
  "potential_root_causes": [
    {{
      "cause": "Possible cause",
      "rationale": "Why this could be a cause",
      "evidence_to_check": [
        "Evidence that investigators should verify"
      ]
    }}
  ],
  "immediate_containment": [
    "Suggested immediate containment action"
  ],
  "corrective_actions": [
    "Suggested corrective action"
  ],
  "preventive_actions": [
    "Suggested preventive action"
  ],
  "missing_information": [
    "Information needed to investigate further"
  ],
  "qa_review_note": "Reminder for QA review"
}}

IMPORTANT:
- Treat causes as hypotheses, not established facts.
- Never invent batch numbers, test results, equipment details,
  dates, or evidence.
- Clearly identify missing information.
- Recommendations must be relevant to pharmaceutical quality.
- Do not claim regulatory compliance or final root cause
  determination.
- Keep recommendations practical and concise.
"""

    response = client.chat.completions.create(
        model=os.getenv(
            "GROQ_MODEL",
            "openai/gpt-oss-120b"
        ),
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a careful pharmaceutical quality "
                    "investigation assistant. Return JSON only."
                )
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.2,
        response_format={"type": "json_object"}
    )

    content = response.choices[0].message.content

    if not content:
        raise ValueError("The AI model returned an empty response.")

    try:
        analysis = json.loads(content)
    except json.JSONDecodeError as exc:
        raise ValueError(
            "The AI model returned invalid JSON."
        ) from exc

    return {"analysis": analysis}


def build_workflow():
    workflow = StateGraph(InvestigationState)

    workflow.add_node("analyze_incident", analyze_incident)

    workflow.set_entry_point("analyze_incident")
    workflow.add_edge("analyze_incident", END)

    return workflow.compile()


rca_graph = build_workflow()


def run_investigation(title, description, severity, source):
    initial_state = {
        "title": title,
        "description": description,
        "severity": severity,
        "source": source
    }

    result = rca_graph.invoke(initial_state)

    return result["analysis"]
