
import json
import re
from io import BytesIO
from uuid import uuid4
from xml.sax.saxutils import escape

from fastapi import (
    APIRouter, Depends, HTTPException, UploadFile, File
)
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pypdf import PdfReader
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable
)

from app.database.database import get_db
from app.database.models import Investigation
from app.schemas.investigation import (
    InvestigationRequest,
    InvestigationResponse
)
from app.services.rca_workflow import run_investigation

router = APIRouter(
    prefix="/api/investigations",
    tags=["Investigations"]
)


def format_investigation(record, message="Investigation retrieved"):
    analysis = None

    if record.analysis:
        try:
            analysis = json.loads(record.analysis)
        except json.JSONDecodeError:
            analysis = None

    return InvestigationResponse(
        message=message,
        investigation_id=record.id,
        status=record.status,
        title=record.title,
        analysis=analysis,
        analysis_error=record.analysis_error,
        created_at=(
            record.created_at.isoformat()
            if record.created_at else None
        )
    )


def save_and_analyze(title, description, severity, source, db):
    record = Investigation(
        id=str(uuid4()),
        title=title,
        description=description,
        severity=severity,
        source=source,
        status="Processing"
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    try:
        analysis = run_investigation(
            title=title,
            description=description,
            severity=severity,
            source=source
        )

        record.analysis = json.dumps(analysis)
        record.status = "Analysis Completed"
        record.analysis_error = None

        db.commit()
        db.refresh(record)

        return format_investigation(
            record,
            "Investigation analyzed and saved successfully"
        )

    except Exception:
        db.rollback()

        record = db.query(Investigation).filter(
            Investigation.id == record.id
        ).first()

        if record:
            record.status = "Analysis Unavailable"
            record.analysis_error = (
                "AI analysis could not be completed. "
                "Check backend configuration and try again."
            )
            db.commit()
            db.refresh(record)

            return format_investigation(
                record,
                "Investigation saved, but AI analysis is unavailable"
            )

        raise HTTPException(
            status_code=500,
            detail="Unable to save investigation."
        )


def safe_paragraph(value, style):
    if value is None:
        value = "Not provided"
    return Paragraph(escape(str(value)), style)


def add_report_section(story, heading, content, styles):
    story.append(Paragraph(escape(heading), styles["Heading2"]))
    story.append(Spacer(1, 4))

    if isinstance(content, list):
        if not content:
            story.append(Paragraph("No information available.", styles["BodyText"]))
        else:
            for item in content:
                if isinstance(item, dict):
                    for key, value in item.items():
                        story.append(
                            Paragraph(
                                f"<b>{escape(str(key.replace('_', ' ').title()))}:</b> "
                                f"{escape(str(value))}",
                                styles["BodyText"]
                            )
                        )
                else:
                    story.append(
                        Paragraph(
                            f"&bull; {escape(str(item))}",
                            styles["BodyText"]
                        )
                    )
                story.append(Spacer(1, 4))
    else:
        story.append(
            Paragraph(
                escape(str(content or "Not provided")),
                styles["BodyText"]
            )
        )

    story.append(Spacer(1, 10))


def generate_rca_pdf(record):
    buffer = BytesIO()

    document = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm
    )

    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        name="ReportTitle",
        parent=styles["Title"],
        fontSize=19,
        leading=24,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#17365D"),
        spaceAfter=8
    ))

    styles.add(ParagraphStyle(
        name="ReportSubtitle",
        parent=styles["Normal"],
        alignment=TA_CENTER,
        textColor=colors.HexColor("#64748B"),
        fontSize=9,
        spaceAfter=16
    ))

    analysis = {}
    if record.analysis:
        try:
            analysis = json.loads(record.analysis)
        except json.JSONDecodeError:
            analysis = {}

    story = [
        Paragraph("AIVOA.AI", styles["ReportTitle"]),
        Paragraph(
            "PHARMACEUTICAL QUALITY INVESTIGATION REPORT",
            styles["ReportSubtitle"]
        ),
        HRFlowable(
            width="100%",
            thickness=1,
            color=colors.HexColor("#CBD5E1")
        ),
        Spacer(1, 14)
    ]

    metadata = [
        ["Investigation ID", record.id],
        ["Incident Title", record.title],
        ["Severity", record.severity],
        ["Source", record.source],
        ["Status", record.status],
        [
            "Created At",
            record.created_at.isoformat() if record.created_at else "Not available"
        ]
    ]

    table = Table(
        [
            [
                safe_paragraph(row[0], styles["BodyText"]),
                safe_paragraph(row[1], styles["BodyText"])
            ]
            for row in metadata
        ],
        colWidths=[42 * mm, 118 * mm]
    )

    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#EAF0F8")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D5DDE8")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7)
    ]))

    story.extend([
        Paragraph("Incident Details", styles["Heading2"]),
        Paragraph(
            escape(record.description),
            styles["BodyText"]
        ),
        Spacer(1, 12),
        table,
        Spacer(1, 14)
    ])

    if analysis:
        add_report_section(
            story, "AI-Generated Incident Summary",
            analysis.get("summary"), styles
        )

        causes = analysis.get("potential_root_causes", [])
        story.append(
            Paragraph("Potential Root Causes", styles["Heading2"])
        )

        if causes:
            for index, cause in enumerate(causes, start=1):
                story.append(
                    Paragraph(
                        f"{index}. {escape(str(cause.get('cause', 'Possible cause')))}",
                        styles["Heading3"]
                    )
                )
                story.append(
                    Paragraph(
                        escape(str(cause.get("rationale", ""))),
                        styles["BodyText"]
                    )
                )
                story.append(Paragraph(
                    "<b>Evidence to check:</b>",
                    styles["BodyText"]
                ))
                for evidence in cause.get("evidence_to_check", []):
                    story.append(
                        Paragraph(
                            f"&bull; {escape(str(evidence))}",
                            styles["BodyText"]
                        )
                    )
                story.append(Spacer(1, 8))
        else:
            story.append(
                Paragraph("No potential causes provided.", styles["BodyText"])
            )

        add_report_section(
            story, "Immediate Containment",
            analysis.get("immediate_containment", []), styles
        )
        add_report_section(
            story, "Corrective Actions",
            analysis.get("corrective_actions", []), styles
        )
        add_report_section(
            story, "Preventive Actions",
            analysis.get("preventive_actions", []), styles
        )
        add_report_section(
            story, "Missing Information",
            analysis.get("missing_information", []), styles
        )
        add_report_section(
            story, "QA Review Note",
            analysis.get("qa_review_note"), styles
        )
    else:
        story.append(
            Paragraph(
                "AI analysis is not available for this investigation.",
                styles["BodyText"]
            )
        )
        if record.analysis_error:
            story.append(
                Paragraph(
                    escape(record.analysis_error),
                    styles["BodyText"]
                )
            )

    story.extend([
        Spacer(1, 16),
        HRFlowable(
            width="100%",
            thickness=0.7,
            color=colors.HexColor("#CBD5E1")
        ),
        Spacer(1, 8),
        Paragraph(
            "<b>Important:</b> This report contains AI-generated preliminary "
            "hypotheses and suggested actions. It is not a confirmed root-cause "
            "determination or an approved CAPA. Qualified personnel must verify "
            "the evidence, review recommendations, and approve any actions.",
            styles["Italic"]
        ),
        Spacer(1, 8),
        Paragraph(
            "Generated by AIVOA.AI",
            styles["ReportSubtitle"]
        )
    ])

    document.build(story)
    buffer.seek(0)
    return buffer


@router.post("/", response_model=InvestigationResponse)
def create_investigation(
    data: InvestigationRequest,
    db: Session = Depends(get_db)
):
    return save_and_analyze(
        data.title,
        data.description,
        data.severity,
        data.source or "Manual",
        db
    )


@router.post("/upload-pdf/", response_model=InvestigationResponse)
async def upload_pdf(
    file: UploadFile = File(...),
    severity: str = "Medium",
    db: Session = Depends(get_db)
):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a valid PDF file."
        )

    try:
        file_content = await file.read()

        if not file_content:
            raise HTTPException(
                status_code=400,
                detail="The uploaded PDF is empty."
            )

        if not file_content.startswith(b"%PDF-"):
            raise HTTPException(
                status_code=400,
                detail="The uploaded file is not a valid PDF."
            )

        reader = PdfReader(BytesIO(file_content))
        extracted_text = "\n".join(
            page.extract_text() or ""
            for page in reader.pages
        ).strip()

        if not extracted_text:
            raise HTTPException(
                status_code=400,
                detail="No readable text found. Scanned PDFs require OCR."
            )

        extracted_text = extracted_text[:15000]
        title = f"PDF Investigation - {file.filename}"

        return save_and_analyze(
            title,
            extracted_text,
            severity,
            "PDF Upload",
            db
        )

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Unable to read this PDF. Please try another PDF."
        )
    finally:
        await file.close()


@router.get("/", response_model=list[InvestigationResponse])
def get_investigations(db: Session = Depends(get_db)):
    records = (
        db.query(Investigation)
        .order_by(Investigation.created_at.desc())
        .all()
    )
    return [format_investigation(record) for record in records]


@router.get("/{investigation_id}/report")
def download_investigation_report(
    investigation_id: str,
    db: Session = Depends(get_db)
):
    record = db.query(Investigation).filter(
        Investigation.id == investigation_id
    ).first()

    if not record:
        raise HTTPException(
            status_code=404,
            detail="Investigation not found."
        )

    pdf_buffer = generate_rca_pdf(record)

    safe_id = re.sub(r"[^a-zA-Z0-9_-]", "", record.id)
    filename = f"AIVOA_RCA_Report_{safe_id}.pdf"

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )


@router.get("/{investigation_id}", response_model=InvestigationResponse)
def get_investigation(
    investigation_id: str,
    db: Session = Depends(get_db)
):
    record = db.query(Investigation).filter(
        Investigation.id == investigation_id
    ).first()

    if not record:
        raise HTTPException(
            status_code=404,
            detail="Investigation not found."
        )

    return format_investigation(record)
