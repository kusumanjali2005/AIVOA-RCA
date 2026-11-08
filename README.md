# AIVOA.AI – AI-Powered Pharmaceutical Root Cause Analysis

## Overview

AIVOA.AI is an AI-powered pharmaceutical quality investigation and Root Cause Analysis (RCA) system designed to assist quality assurance teams in investigating incidents, identifying potential root causes, and managing Corrective and Preventive Actions (CAPA).

The system uses Large Language Models (LLMs) to analyze incident descriptions and generate structured preliminary investigation reports.

## Key Features

- **AI-Powered Root Cause Analysis:** Generates potential root causes and investigation recommendations.
- **Manual Incident Reporting:** Submit pharmaceutical quality incidents for analysis.
- **PDF Upload:** Upload PDF documents and extract incident information for AI analysis.
- **Investigation History:** Store and retrieve previous investigations.
- **CAPA Management:** Create, assign, update, and track corrective and preventive actions.
- **PDF Report Generation:** Download structured RCA investigation reports.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React.js, Vite |
| Backend | Python, FastAPI |
| AI Integration | Groq API |
| AI Workflow | LangGraph |
| Database | SQLite (local), PostgreSQL (deployment) |
| PDF Processing | PyPDF |
| PDF Generation | ReportLab |
| Version Control | Git, GitHub |

## Project Structure

```text
AIVOA-RCA/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── database/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── PdfUpload.jsx
│   │   └── CapaManagement.jsx
