import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

pdf_path = r'c:\Users\SANDESH\Downloads\gc\SplitSmart_GC2026_One_Page_Report.pdf'
doc = SimpleDocTemplate(
    pdf_path,
    pagesize=A4,
    leftMargin=24,
    rightMargin=24,
    topMargin=20,
    bottomMargin=20
)

styles = getSampleStyleSheet()

primary_color = colors.HexColor('#15803d')     # emerald-700
primary_dark = colors.HexColor('#14532d')      # emerald-900
primary_light = colors.HexColor('#dcfce7')     # emerald-100
text_color = colors.HexColor('#334155')        # slate-700
muted_color = colors.HexColor('#64748b')       # slate-500
bg_subtle = colors.HexColor('#f8fafc')         # slate-50

title_style = ParagraphStyle(
    'DocTitle',
    parent=styles['Heading1'],
    fontName='Helvetica-Bold',
    fontSize=18,
    leading=20,
    textColor=primary_color,
    spaceAfter=1
)

tagline_style = ParagraphStyle(
    'Tagline',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=8.5,
    leading=11,
    textColor=muted_color,
    spaceAfter=4
)

h2_style = ParagraphStyle(
    'H2',
    parent=styles['Heading2'],
    fontName='Helvetica-Bold',
    fontSize=9.5,
    leading=11.5,
    textColor=primary_dark,
    spaceBefore=3,
    spaceAfter=2
)

body_style = ParagraphStyle(
    'Body',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=7.2,
    leading=9.2,
    textColor=text_color
)

story = []

# Title & Header
story.append(Paragraph('<b>SplitSmart ⚡ — Executive & Technical Report</b>', title_style))
story.append(Paragraph('Web Brawl GC 2026 Submission · 100% Client-Side AI Receipt Scanner & Fair Debt Simplification', tagline_style))
story.append(HRFlowable(width='100%', thickness=1.5, color=primary_color, spaceAfter=5, spaceBefore=0))

# Links & Metadata Table
meta_data = [
    [
        Paragraph('<b>GitHub Repository:</b> <font color="#15803d"><u>https://github.com/Sandesh187/splitsmart</u></font>', body_style),
        Paragraph('<b>Live Deployment:</b> <font color="#15803d"><u>https://sandesh187.github.io/splitsmart/</u></font>', body_style)
    ],
    [
        Paragraph('<b>Stack:</b> React 18, TypeScript 5, Vite 6, Tailwind CSS, Tesseract.js, jsPDF', body_style),
        Paragraph('<b>Privacy Guarantee:</b> 100% Client-Side Web Worker inference. Zero server uploads.', body_style)
    ]
]
t_meta = Table(meta_data, colWidths=[275, 272])
t_meta.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,-1), bg_subtle),
    ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
    ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
    ('TOPPADDING', (0,0), (-1,-1), 3),
    ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ('LEFTPADDING', (0,0), (-1,-1), 6),
    ('RIGHTPADDING', (0,0), (-1,-1), 6),
]))
story.append(t_meta)
story.append(Spacer(1, 3))

# Section: Features Compliance by Tier (2 columns)
story.append(Paragraph('<b>COMPREHENSIVE FEATURE COMPLIANCE (TIERS 1, 2 & 3)</b>', h2_style))

tier_data = [
    [
        Paragraph('<b>Tier 1: Core Requirements (100% Complete)</b><br/>'
                  '• <b>Groups & Members:</b> Full CRUD, color avatars, UPI IDs.<br/>'
                  '• <b>Receipt Capture:</b> Device camera & image upload (JPG/PNG).<br/>'
                  '• <b>Structured OCR:</b> Items, Qty, Unit, Line Total, CGST/SGST.<br/>'
                  '• <b>Review & Correction:</b> Side-by-side view, low-confidence badges.<br/>'
                  '• <b>Total Validation:</b> Real-time sum alert & 1-click reconcile.<br/>'
                  '• <b>Manual Expenses:</b> Log expenses without receipt across 4 modes.<br/>'
                  '• <b>Balances View:</b> Real-time net debt calculation (+ owed / - owes).', body_style),
        Paragraph('<b>Tier 2: Advanced Features (100% Complete)</b><br/>'
                  '• <b>Itemized Assignment:</b> Tap-to-assign avatars; unassigned guard.<br/>'
                  '• <b>4 Split Modes:</b> Equal, Exact, Percentage (100%), Shares (2:1:1).<br/>'
                  '• <b>Proportional Tax:</b> Tax weighted by consumed subtotal (not equal).<br/>'
                  '• <b>Paise-Exact Rounding:</b> Integer paise; <b>zero paisa drift</b> rule.<br/>'
                  '• <b>Debt Simplification:</b> Greedy min-cash-flow algorithm (<= N-1).<br/>'
                  '• <b>Auto-Categorization:</b> Lazy zero-shot ML + fast heuristic.<br/>'
                  '• <b>Persistence:</b> Full state survives reload via LocalStorage.', body_style),
    ],
    [
        Paragraph('<b>Tier 3: Brownie Points & Innovation (100% Complete)</b><br/>'
                  '• <b>Instant UPI Settle-Up:</b> NPCI upi://pay deep links & scannable QR codes for GPay/PhonePe/Paytm.<br/>'
                  '• <b>Spending Analytics:</b> Visual charts: Category breakdown & consumption vs paid metrics.<br/>'
                  '• <b>Serverless Group Sharing:</b> JSON import/export & compressed base64 shareable URL state.', body_style),
        Paragraph('<b>Additional Tier 3 Highlights & Testing</b><br/>'
                  '• <b>PWA & Offline:</b> Web App Manifest, mobile responsive (360px-1440px).<br/>'
                  '• <b>Recurring Bills:</b> Automated monthly/weekly items (Wi-Fi, rent).<br/>'
                  '• <b>Reports Export:</b> 1-click download of PDF reports & CSV summaries.<br/>'
                  '• <b>In-App Test Suite:</b> 1-click runner for all 9 Section 10 test cases.', body_style),
    ]
]
t_tier = Table(tier_data, colWidths=[273, 274])
t_tier.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,-1), colors.white),
    ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
    ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
    ('TOPPADDING', (0,0), (-1,-1), 3),
    ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ('LEFTPADDING', (0,0), (-1,-1), 5),
    ('RIGHTPADDING', (0,0), (-1,-1), 5),
]))
story.append(t_tier)
story.append(Spacer(1, 3))

# Section: Mathematical Formulations & Algorithms
story.append(Paragraph('<b>CORE ALGORITHMS & MATHEMATICAL FORMULATIONS</b>', h2_style))

math_data = [
    [
        Paragraph('<b>1. Proportional Tax & Discount Formula:</b><br/>'
                  'Tax is allocated proportionally to member item subtotal:<br/>'
                  '<i>ShareTax(u) = floor( [Subtotal(u) / SubtotalTotal] × TaxTotal ) + RemainderPaisa</i><br/>'
                  '<b>Verified:</b> On ₹1,000 bill with ₹100 tax, ₹600 items pays exactly ₹60 tax.', body_style),
        Paragraph('<b>2. Paise-Exact Rounding Rule (0 Drift):</b><br/>'
                  'All math uses integer paise (₹1 = 100 paise). Remainder diff = TotalPaise - Sum(Floored). '
                  'Top diff members sorted by fractional remainder absorb exactly 1 paisa.<br/>'
                  '<b>Guarantees:</b> Sum of individual shares == Bill Total to the paisa.', body_style)
    ],
    [
        Paragraph('<b>3. Greedy Minimum Cash Flow Debt Simplification:</b><br/>'
                  'Computes net balance: <i>Net(u) = TotalPaid(u) - TotalOwed(u) + SettledDelta(u)</i> with invariant Sum(Net) == 0.<br/>'
                  'Iteratively matches largest debtor with largest creditor for amount <i>T = min(|maxDebtor|, maxCreditor)</i>.<br/>'
                  'Reduces N×(N-1) potential pairwise debts down to at most (N-1) clean transactions.', body_style),
        Paragraph('<b>4. Section 10 Robustness Test Verification:</b><br/>'
                  '• <b>Case 6 (₹100 split 3 ways):</b> Exactly ₹33.34, ₹33.33, ₹33.33 (reconciles).<br/>'
                  '• <b>Case 9 (5 members, 10 expenses):</b> Simplified to 4 payments.<br/>'
                  '• <b>Cases 1-5, 7-8:</b> Rotated 90°, faded contrast, missing total handled.<br/>'
                  '<b>Unit Tests:</b> 8/8 automated Vitest tests pass in 940ms.', body_style)
    ]
]
t_math = Table(math_data, colWidths=[273, 274])
t_math.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,-1), bg_subtle),
    ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
    ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
    ('TOPPADDING', (0,0), (-1,-1), 3),
    ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ('LEFTPADDING', (0,0), (-1,-1), 5),
    ('RIGHTPADDING', (0,0), (-1,-1), 5),
]))
story.append(t_math)
story.append(Spacer(1, 3))

# Section: Official Form Description (<100 words)
story.append(Paragraph('<b>OFFICIAL SUBMISSION DESCRIPTION (GOOGLE FORM READY)</b>', h2_style))
desc_text = (
    '<i>"SplitSmart is a client-side bill-splitting web app built for Web Brawl GC 2026. Features include '
    'Tesseract.js in-browser OCR with contrast enhancement and 90° rotation preprocessing; lazy-loaded '
    'auto-categorization (Xenova/mobilebert-uncased-mnli with heuristic fallback); proportional tax and '
    'discount allocation; paise-exact rounding reconciliation (zero drift); greedy minimum cash flow debt '
    'simplification; instant UPI settle-up with NPCI deep links and QR codes; visual spending analytics; '
    'recurring expense automation; PDF/CSV export; serverless group sharing via URL; PWA offline support; '
    'and an interactive in-app test runner for all 9 Section 10 robustness cases."</i>'
)
t_desc = Table([[Paragraph(desc_text, body_style)]], colWidths=[547])
t_desc.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,-1), primary_light),
    ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#86efac')),
    ('TOPPADDING', (0,0), (-1,-1), 3.5),
    ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
    ('LEFTPADDING', (0,0), (-1,-1), 6),
    ('RIGHTPADDING', (0,0), (-1,-1), 6),
]))
story.append(t_desc)

doc.build(story)
print(f'PDF generated successfully: {pdf_path}')
print('File size:', os.path.getsize(pdf_path), 'bytes')
