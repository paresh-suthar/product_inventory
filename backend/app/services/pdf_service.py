import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_invoice_pdf(invoice, client, bank_account, subscription=None, server=None) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'InvoiceTitle',
        parent=styles['Heading1'],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#1e3a8a')
    )
    header_style = ParagraphStyle(
        'HeaderStyle',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#475569')
    )
    bold_style = ParagraphStyle(
        'BoldStyle',
        parent=styles['Normal'],
        fontSize=10,
        leading=13,
        fontName='Helvetica-Bold',
        textColor=colors.HexColor('#0f172a')
    )
    
    elements = []
    
    # Company Banner & Invoice Title
    header_data = [
        [
            Paragraph('<b>StockFlow Cloud ERP</b><br/>Cloud & Server Infrastructure Management<br/>Email: billing@stockflow.internal', header_style),
            Paragraph(f'<b>TAX INVOICE</b><br/>Invoice No: <b>{invoice.invoice_no}</b><br/>Status: <b>{invoice.status}</b>', title_style)
        ]
    ]
    t_header = Table(header_data, colWidths=[270, 270])
    t_header.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ALIGN', (1,0), (1,0), 'RIGHT'),
    ]))
    elements.append(t_header)
    elements.append(Spacer(1, 15))
    
    # Bill To & Dates Info
    issue_str = invoice.issue_date.strftime('%Y-%m-%d') if invoice.issue_date else 'N/A'
    due_str = invoice.due_date.strftime('%Y-%m-%d') if invoice.due_date else 'N/A'
    
    bill_info = [
        [
            Paragraph(f'<b>BILLED TO:</b><br/><b>{client.company_name}</b><br/>Attn: {client.contact_name}<br/>Email: {client.email}<br/>Address: {client.billing_address or N/A}<br/>Tax ID: {client.tax_id or N/A}', header_style),
            Paragraph(f'<b>INVOICE DETAILS:</b><br/>Issue Date: <b>{issue_str}</b><br/>Due Date: <b>{due_str}</b><br/>Currency: <b>{invoice.currency}</b>', header_style)
        ]
    ]
    t_bill = Table(bill_info, colWidths=[270, 270])
    t_bill.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#e2e8f0')),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    elements.append(t_bill)
    elements.append(Spacer(1, 15))
    
    # Line Items
    plan_desc = subscription.plan_name if subscription else 'Dedicated Server Provisioning & Bandwidth'
    server_desc = f'Server: {server.hostname} ({server.datacenter_location}) | IP: {server.primary_ip}' if server else 'Cloud Infrastructure Hosting Service'
    
    items_data = [
        [Paragraph('<b>Description</b>', bold_style), Paragraph('<b>Billing Cycle</b>', bold_style), Paragraph('<b>Amount</b>', bold_style)],
        [Paragraph(f'<b>{plan_desc}</b><br/>{server_desc}', header_style), Paragraph(subscription.billing_cycle if subscription else 'MONTHLY', header_style), Paragraph(f'{invoice.currency} {float(invoice.subtotal):,.2f}', bold_style)],
        ['', Paragraph('<b>Tax / VAT:</b>', header_style), Paragraph(f'{invoice.currency} {float(invoice.tax_amount):,.2f}', header_style)],
        ['', Paragraph('<b>TOTAL DUE:</b>', bold_style), Paragraph(f'<b>{invoice.currency} {float(invoice.total_amount):,.2f}</b>', title_style)],
    ]
    t_items = Table(items_data, colWidths=[310, 110, 120])
    t_items.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
        ('LINEBELOW', (0,0), (-1,0), 1.5, colors.HexColor('#cbd5e1')),
        ('LINEBELOW', (0,1), (-1,1), 1, colors.HexColor('#e2e8f0')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 6),
        ('ALIGN', (2,0), (2,-1), 'RIGHT'),
    ]))
    elements.append(t_items)
    elements.append(Spacer(1, 20))
    
    # Payment Instructions & Bank Details
    if bank_account:
        bank_details = (
            f'<b>BANK WIRE TRANSFER INSTRUCTIONS ({bank_account.currency}):</b><br/>'
            f'Bank Name: <b>{bank_account.bank_name}</b> | Account Name: <b>{bank_account.account_name}</b><br/>'
            f'Account No: <b>{bank_account.account_number or N/A}</b> | IBAN: <b>{bank_account.iban or N/A}</b><br/>'
            f'SWIFT / BIC: <b>{bank_account.swift_bic or N/A}</b> | Routing: <b>{bank_account.routing_code or N/A}</b><br/>'
            f'<i>Please include invoice number <b>{invoice.invoice_no}</b> in your wire transfer payment reference.</i>'
        )
    else:
        bank_details = '<b>PAYMENT METHODS:</b><br/>Please pay via registered Bank Wire or online portal. Contact billing@stockflow.internal for assistance.'
        
    p_bank = Paragraph(bank_details, header_style)
    t_bank = Table([[p_bank]], colWidths=[540])
    t_bank.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#eff6ff')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#93c5fd')),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    elements.append(t_bank)
    
    doc.build(elements)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
